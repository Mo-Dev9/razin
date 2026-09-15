import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebase-admin';
import { checkRateLimit, getRequestIp } from '@/lib/rate-limit';
import { crawlSource, toStoredListing, blockedToQueueItem } from '@/lib/crawler/runner';
import { resolveListingLocation, listingDedupKey } from '@/lib/listing-utils';
import { neighborhoodListingsRef, recomputeNeighborhoodMeta } from '@/lib/neighborhood-writer';
import type { CrawlResult, SourceParser } from '@/lib/crawler/types';
import { parseOlxSearchHtml } from '@/lib/crawler/olx-eg';
import { opensooqParser } from '@/lib/crawler/opensooq-eg';
import type { DocumentReference } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const maxDuration = 60;

export interface CrawlControllerRequest {
  /** حدّ أقصى لعدد الإعلانات المحفوظة في هذه الرحلة (احترام القاعدة أدبًا). */
  limit?: number;
}

/** مصادر الاتجاه الواحد المتاحة حاليًا (يُضاف كل مصدر جديد هنا). */
const SOURCES: Array<{ source: { id: string; name: string; baseUrl: string; robotsUrl: string; allowedPathPrefixes: string[] }; parser: SourceParser; buildSearchUrls: (baseUrl: string) => string[] }> = [
  {
    source: {
      id: 'olx-eg',
      name: 'OLX مصر (دبليزي)',
      baseUrl: 'https://www.olx.com.eg',
      robotsUrl: 'https://www.olx.com.eg/robots.txt',
      allowedPathPrefixes: ['/en/properties/', '/en/i2/properties/'],
    },
    parser: { parseSearchHtml: parseOlxSearchHtml },
    buildSearchUrls: (baseUrl) => [
      // الرابط الوحيد المؤكد حيًا (سبتمبر 2026): صفحة بحث «شقق/دوبلكس إيجار»
      // العامة — لا تسجيل دخول ولا كابتشا. (اختبار Live: 200 + ld+json + 45 إعلانًا.)
      `${baseUrl}/en/i2/properties/apartments-duplex-for-rent`,
    ],
  },
  {
    source: {
      id: 'opensooq-eg',
      name: 'السوق المفتوح مصر (OpenSooq)',
      baseUrl: 'https://eg.opensooq.com',
      robotsUrl: 'https://eg.opensooq.com/robots.txt',
      allowedPathPrefixes: ['/ar/', '/en/'],
    },
    parser: opensooqParser,
    buildSearchUrls: (baseUrl) =>
      ['', '?page=2', '?page=3', '?page=4', '?page=5'].map((p) => `${baseUrl}/ar/عقارات/شقق-للايجار${p}`),
  },
];

function hasher(str: string, len = 8): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(36).padStart(len, '0');
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { allowed, retryAfterMs } = checkRateLimit(
    `admin-crawl:${getRequestIp(req.headers)}`,
    6,
    60_000
  );
  if (!allowed) {
    return NextResponse.json(
      { error: 'طلبات زحف كثيرة، حاول لاحقًا' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  let body: CrawlControllerRequest = {};
  try {
    body = (await req.json()) as CrawlControllerRequest;
  } catch {
    // بدون جسم أو جسم غير صالح: استخدم الإعدادات الافتراضية.
  }
  const limit = Number.isFinite(body.limit)
    ? Math.min(Math.max(Math.round(body.limit as number), 1), 100)
    : 30;

  const settings = {
    // مطلوب: UA بـ ASCII فقط — undici يرفض أي حرف غير Latin-1 في الـ headers.
    userAgent:
      'RazinBot/1.0 (Egyptian rent price research; human contact: https://razin-eg.vercel.app)',
    timeoutMs: 15000,
    minDelayMs: 600,
  };

  const outcome: {
    sourceResults: Array<{ sourceId: string; fetchedPages: number; totalAvailable: number | null; parsedCount: number; blockedCount: number; error: string | null }>;
    saved: number;
    queued: number;
    touchedNeighborhoods: number;
  } = { sourceResults: [], saved: 0, queued: 0, touchedNeighborhoods: 0 };

  const db = getAdminDb();
  const touched = new Set<string>();

  for (const entry of SOURCES) {
    const { source, parser, buildSearchUrls } = entry;
    const searchUrls = buildSearchUrls(source.baseUrl);
    const result: CrawlResult = await crawlSource(source, settings, { searchUrls, parser });

    let saved = 0;
    const seenDedup = new Set<string>();
    // تراكم المستندات المرشّحة للكتابة، ثم التحقق من وجودها دفعةً واحدة،
    // حتى لا يُعاد جمع أي إعلان موجود أصلًا (ولا تُمَس حقول مراجعتنا اليدوية).
    const pending: Array<{ ref: DocumentReference; data: Record<string, unknown> }> = [];
    for (const l of result.parsed) {
      if (saved + pending.length >= limit) break;
      // دفعة الإيجار الشهري فقط — اليومي/الأسبوعي/السنوي سوق مفروش مختلف
      // لا يُخزَّن ولا يُعرض في المؤشر الشهري.
      if (l.rentalFrequency !== null && l.rentalFrequency !== 'monthly') continue;
      // حارس سعر الصدق: أقل من 300 جنيه شهريًا لا يمكن أن يكون إيجارًا فعليًا
      // (مصدر OpenSooq يُرجع أحيانًا قيم سعر معطوبة/رمزيّة) — لا يُخزَّن.
      if (typeof l.price === 'number' && l.price < 300) continue;
      const docId = `${source.id}_${l.externalId}`;
      const base = toStoredListing(source, l);
      const resolved = resolveListingLocation(
        typeof base.city === 'string' ? base.city : null,
        typeof base.governorate === 'string' ? base.governorate : null
      );
// إزالة تكرار إعلانات الوسيط المُعاد نشرها (نفس الشقة برقم ID جديد).
      const dedup = listingDedupKey({
        neighborhoodId:
          typeof base.neighborhoodId === 'string' ? base.neighborhoodId : null,
        propertyType:
          typeof base.propertyType === 'string' ? base.propertyType : null,
        bedrooms: typeof base.bedrooms === 'number' ? base.bedrooms : null,
        areaM2: typeof base.areaM2 === 'number' ? base.areaM2 : null,
        price: typeof base.price === 'number' ? base.price : null,
      });
      if (dedup && seenDedup.has(dedup)) continue;
      if (dedup) seenDedup.add(dedup);
      pending.push({
        ref: neighborhoodListingsRef(db, resolved.neighborhoodId).doc(docId),
        data: {
          ...base,
          governorate: resolved.governorate,
          city: resolved.city,
          neighborhoodId: resolved.neighborhoodId,
        },
      });
    }

    // الدفعة: كل من يظهر كموجود أصلًا نجتازه (لا نعيد جمعه ولا نمسح حقوله).
    const existing = new Set(
      pending.length > 0
        ? (await db.getAll(...pending.map((p) => p.ref))).filter((s) => s.exists).map((s) => s.ref)
        : []
    );
    for (const p of pending) {
      if (existing.has(p.ref)) continue;
      await p.ref.set(p.data);
      touched.add(String(p.data.neighborhoodId));
      saved += 1;
    }
    outcome.saved += saved;

    let queued = 0;
    for (const b of result.blocked) {
      const docId = `queue_${hasher(`${b.reason}:${b.url}`)}`;
      await db.collection('collectionQueue').doc(docId).set(blockedToQueueItem(source, b.url, b.reason, b.note));
      queued += 1;
    }
    outcome.queued += queued;

    outcome.sourceResults.push({
      sourceId: source.id,
      fetchedPages: result.fetchedPages,
      totalAvailable: result.totalAvailable,
      parsedCount: result.parsed.length,
      blockedCount: result.blocked.length,
      error: result.error,
    });
  }

  for (const nid of touched) {
    await recomputeNeighborhoodMeta(db, nid);
  }
  outcome.touchedNeighborhoods = touched.size;

  return NextResponse.json({ ok: true, ...outcome });
}