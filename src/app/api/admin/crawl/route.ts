import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebase-admin';
import { crawlSource, toStoredListing, blockedToQueueItem } from '@/lib/crawler/runner';
import type { CrawlResult } from '@/lib/crawler/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export interface CrawlControllerRequest {
  /** حدّ أقصى لعدد الإعلانات المحفوظة في هذه الرحلة (احترام القاعدة أدبًا). */
  limit?: number;
}

/** مصادر الاتجاه الواحد المتاحة حاليًا (يُضاف كل مصدر جديد هنا). */
const SOURCES = [
  {
    id: 'olx-eg',
    name: 'OLX مصر (دبليزي)',
    baseUrl: 'https://www.olx.com.eg',
    robotsUrl: 'https://www.olx.com.eg/robots.txt',
    allowedPathPrefixes: ['/en/properties/', '/en/i2/properties/'],
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
    userAgent:
      'RazinBot/1.0 (دليل أسعار إيجار مصري، بحث علمي عن إعلانات عامة؛ تواصل: https://rentrate.vercel.app)',
    timeoutMs: 15000,
    minDelayMs: 600,
  };

  const outcome: {
    sourceResults: Array<{ sourceId: string; fetchedPages: number; totalAvailable: number | null; parsedCount: number; blockedCount: number; error: string | null }>;
    saved: number;
    queued: number;
  } = { sourceResults: [], saved: 0, queued: 0 };

  const db = getAdminDb();

  for (const source of SOURCES) {
    const searchUrls = buildSearchUrlFor(source.baseUrl);
    const result: CrawlResult = await crawlSource(source, settings, { searchUrls });

    let saved = 0;
    for (const l of result.parsed) {
      if (saved >= limit) break;
      const docId = `${source.id}_${l.externalId}`;
      await db.collection('listings').doc(docId).set(toStoredListing(source, l));
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

  return NextResponse.json({ ok: true, ...outcome });
}

function buildSearchUrlFor(baseUrl: string): string[] {
  // الرابط الوحيد المؤكد حيًا (سبتمبر 2026): صفحة بحث «شقق/دوبلكس إيجار»
  // العامة — لا تسجيل دخول ولا كابتشا. (اختبار Live: 200 + ld+json + 45 إعلانًا.)
  return [`${baseUrl}/en/i2/properties/apartments-duplex-for-rent`];
}