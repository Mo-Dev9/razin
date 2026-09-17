import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebase-admin';
import { checkRateLimit, getRequestIp } from '@/lib/rate-limit';
import { crawlSource, toStoredListing, blockedToQueueItem } from '@/lib/crawler/runner';
import { resolveListingLocation, listingDedupKey, resolvePlaceFromSearchUrl } from '@/lib/listing-utils';
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
  /** قصر الرحلة على مصدر واحد (معرّفه كـ sourceId مثل olx-eg). */
  source?: string;
  /** عناوين بحث مخصصة — تُستبدل بصفحات المصدر الافتراضية (تُطابق المسار المسموح). */
  urls?: string[];
  /** تجاهل أول N إعلانًا في النتائج المرتبة (مفيد لترتيب السعر التصاعدي — الأرخص غالبًا شوائب). */
  skip?: number;
  /** معاينة فقط: تعيد قائمة الإعلانات المرتقبة بفهرسها دون حفظ أي شيء. */
  preview?: boolean;
  /** قواعد فهرس صريحة لتجنّب «احفظ ثم عدّل»: تخطّي فهارس، وإجبار نوع/سعر لإعلان بعينه. */
  rules?: {
    /** فهارس (1-أساس) تُتخطّى مهما كانت البيانات — كالتكرارات أو الأيامية. */
    skipIndices?: number[];
    /** إجبار propertyType لإعلان بفهرسه — «استوديو حتى لو مكتوب شقة». */
    typeOverrides?: Record<number, string>;
    /** إجبار السعر بإعلان بفهرسه — «المذكور 21 يقصد 21000». */
    priceOverrides?: Record<number, number>;
    /** آخر فهرس يُنظر إليه (توقّف قبل هذا الرقم مهما كانت القواعد) — «توقف عند رقم كذا». */
    stopAt?: number;
  };
}

function isValidCustomUrl(raw: unknown, source: (typeof SOURCES)[number]): boolean {
  if (typeof raw !== 'string' || !raw.startsWith('https://')) return false;
  let path = '';
  try {
    path = new URL(raw).pathname;
  } catch {
    return false;
  }
  return source.source.allowedPathPrefixes.some((p) => path.startsWith(p));
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

  const skip = Number.isFinite(body.skip)
    ? Math.max(Math.round(body.skip as number), 0)
    : 0;

  const preview = body.preview === true;
  const rules = body.rules ?? {};
  const skipIndices = new Set<number>(
    Array.isArray(rules.skipIndices) ? rules.skipIndices.map((i) => Number(i)) : []
  );
  const stopAt = Number.isFinite(rules.stopAt)
    ? Math.max(Math.round(rules.stopAt as number), 1)
    : null;
  const typeOverrides = new Map<string, string>();
  if (rules.typeOverrides && typeof rules.typeOverrides === 'object') {
    for (const [k, v] of Object.entries(rules.typeOverrides)) {
      const idx = Number(k);
      if (Number.isInteger(idx) && idx > 0 && typeof v === 'string') typeOverrides.set(String(idx), v);
    }
  }
  const priceOverrides = new Map<string, number>();
  if (rules.priceOverrides && typeof rules.priceOverrides === 'object') {
    for (const [k, v] of Object.entries(rules.priceOverrides)) {
      const idx = Number(k);
      if (Number.isInteger(idx) && idx > 0 && typeof v === 'number' && Number.isFinite(v)) {
        priceOverrides.set(String(idx), Math.max(0, Math.round(v)));
      }
    }
  }

  const urls = Array.isArray(body.urls) ? (body.urls as unknown[]) : [];
  if (urls.length > 10) {
    return NextResponse.json({ error: 'أكثر من 10 روابط في رحلة واحدة' }, { status: 400 });
  }
  // الروابط المخصصة تتطلب مصدرًا صريحًا — وإلا قد تُرسل صفحة OLX لمحلل OpenSooq.
  // والمسار يجب أن يقع ضمن البادئات المسموح بها للمصدر (احترام ُصلاحية المصدر).
  const targetEntry = body.source ? SOURCES.find((s) => s.source.id === body.source) : null;
  if (urls.length > 0) {
    if (!targetEntry) {
      return NextResponse.json({ error: 'الروابط المخصصة تتطلب `source` صريح' }, { status: 400 });
    }
    if (!urls.every((u) => isValidCustomUrl(u, targetEntry))) {
      return NextResponse.json(
        { error: 'رابط خارج نطاق المصدر أو ليس https — تُرفض كل الرحلة' },
        { status: 400 }
      );
    }
  }

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
    /** عدد إعلانات أُهملت لأن محلّها المعلَن حيٌّ آخر معروف غير حي slug الصفحة. */
    skippedNeighborhoodMismatch: number;
    previewItems?: Array<Record<string, unknown>>;
  } = { sourceResults: [], saved: 0, queued: 0, touchedNeighborhoods: 0, skippedNeighborhoodMismatch: 0 };

  const db = getAdminDb();
  const touched = new Set<string>();

  for (const entry of SOURCES) {
    const { source, parser, buildSearchUrls } = entry;
    if (body.source && body.source !== source.id) continue;

    const searchUrls = urls.length > 0 ? (urls as string[]) : buildSearchUrls(source.baseUrl);
    const result: CrawlResult = await crawlSource(source, settings, { searchUrls, parser });

    // معاينة فقط: عرض الإعلانات المرقّمة (بنفس فهرس قواعد المستخدم) دون كتابة شيء.
    // كل فهرس هنا = فهرس في ترتيب النتيجة الفعلي — تطابق مباشر مع قواعد skipIndices/overrides.
    if (preview) {
      outcome.sourceResults.push({
        sourceId: source.id,
        fetchedPages: result.fetchedPages,
        totalAvailable: result.totalAvailable,
        parsedCount: result.parsed.length,
        blockedCount: result.blocked.length,
        error: result.error,
      });
      outcome.previewItems = [
        ...(outcome.previewItems ?? []),
        ...result.parsed
          .map((l, i) => {
            const item: Record<string, unknown> = {
              index: i + 1,
              externalId: l.externalId,
              title: l.title ?? '',
              url: l.sourceUrl ?? l.sourcePageUrl ?? searchUrls[0],
              price: l.price ?? null,
              propertyType: l.propertyType ?? null,
              rentalFrequency: l.rentalFrequency ?? null,
              city: l.city ?? null,
              governorate: l.governorate ?? null,
              bedrooms: l.rooms ?? null,
              bathrooms: l.bathrooms ?? null,
              areaM2: l.areaM2 ?? null,
              monthly: l.rentalFrequency === null || l.rentalFrequency === 'monthly',
              neighborhoodMismatch: false,
            };
            // حارس انتماء الحي في المعاينة: يسبغ إشارة على كل إعلان محلّه المعلَن
            // حيٌّ آخر معروف غير حي slug — صفحة slug غير صالحة ترجّع خليط أحياء
            // (مثل فيصل/المقطم ضمن «السيدة زينب») تُشير إليه المعاينة قبل التطبيق.
            const pagePlace =
              typeof l.sourcePageUrl === 'string' ? resolvePlaceFromSearchUrl(l.sourcePageUrl) : null;
            if (pagePlace) {
              const own = resolveListingLocation(l.city ?? null, l.governorate ?? null);
              const pageNid = resolveListingLocation(pagePlace.city, pagePlace.governorate).neighborhoodId;
              if (own.matched && own.neighborhoodId !== pageNid) {
                item.neighborhoodMismatch = true;
                outcome.skippedNeighborhoodMismatch += 1;
              }
            }
            return item;
          })
          .filter((p) => (stopAt === null ? true : (p.index as number) <= stopAt)),
      ];
      continue;
    }

    let saved = 0;
    const seenDedup = new Set<string>();
    // تراكم المستندات المرشّحة للكتابة، ثم التحقق من وجودها دفعةً واحدة،
    // حتى لا يُعاد جمع أي إعلان موجود أصلًا (ولا تُمَس حقول مراجعتنا اليدوية).
    const pending: Array<{ ref: DocumentReference; data: Record<string, unknown> }> = [];
    let parsedIndex = 0;
    for (const l of result.parsed) {
      parsedIndex += 1;
      if (stopAt !== null && parsedIndex > stopAt) break;
      if (parsedIndex <= skip) continue;
      // قاعدة فهرس صريحة: تخطّي إعلانات بعينها (تكرارات/أيامية/شوائب) مهما كانت بياناتها.
      if (skipIndices.has(parsedIndex)) continue;
      if (saved + pending.length >= limit) break;
      // دفعة الإيجار الشهري فقط — اليومي/الأسبوعي/السنوي سوق مفروش مختلف
      // لا يُخزَّن ولا يُعرض في المؤشر الشهري.
      if (l.rentalFrequency !== null && l.rentalFrequency !== 'monthly') continue;
      // سعر مطلوب صراحةً بإعلان بعينه (مثل «المذكور 21 يقصد 21000»).
      let price = typeof l.price === 'number' ? l.price : null;
      const forcedPrice = priceOverrides.get(String(parsedIndex));
      if (forcedPrice !== undefined) price = forcedPrice;
      // حارس سعر الصدق: أقل من 300 جنيه شهريًا لا يمكن أن يكون إيجارًا فعليًا
      // (مصدر OpenSooq يُرجع أحيانًا قيم سعر معطوبة/رمزيّة) — لا يُخزَّن.
      if (price !== null && price < 300) continue;
      const docId = `${source.id}_${l.externalId}`;
      const base = toStoredListing(source, { ...l, price } as typeof l);
      // نوع مقرَّر يدويًا (مثل «استوديو حتى لو مكتوب شقة»).
      const forcedType = typeOverrides.get(String(parsedIndex));
      if (forcedType) base.propertyType = forcedType;
      // مصدر الحقيقة للحي: slug صفحة البحث أولًا (المستخدم يزحف صفحة حي بعينه)،
      // ثم locality المحفوظ في json-ld إن لم يكشف slug عن مكان معروف.
      const pagePlace = typeof l.sourcePageUrl === 'string' ? resolvePlaceFromSearchUrl(l.sourcePageUrl) : null;
      const own = resolveListingLocation(
        typeof base.city === 'string' ? base.city : null,
        typeof base.governorate === 'string' ? base.governorate : null
      );
      const resolved = pagePlace
        ? resolveListingLocation(pagePlace.city, pagePlace.governorate)
        : own;
      // حارس انتماء الحي على مستوى الإعلان: صفحة بslug حي معروف لا تخزّن إعلانًا
      // محلّه المعلَن حيٌّ آخر معروف (slug غير صالح يعيد خليطًا في فيصل/المقطم
      // داخل «السيدة زينب»). نحتفظ بالمطابق ونهمل المختلف مع عدّاد شفاف — بلا رفض
      // رحلة كاملة ولا فقدان إعلانات صحيحة. المحليات غير المعروفة تبقى بصلاحية slug
      // (أفضل جهد — كسلوك اليوم).
      if (pagePlace) {
        const pageNid = resolveListingLocation(pagePlace.city, pagePlace.governorate).neighborhoodId;
        if (own.matched && own.neighborhoodId !== pageNid) {
          outcome.skippedNeighborhoodMismatch += 1;
          continue;
        }
      }
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

    // الدفعة: كل من يظهر كموجود أصلًا في الحي المستنتج نجتازه (لا نعيد جمعه ولا نمسح حقوله).
    const existing = new Set(
      pending.length > 0
        ? (await db.getAll(...pending.map((p) => p.ref))).filter((s) => s.exists).map((s) => s.ref)
        : []
    );

    // الحارس الشامل عبر كل الأحياء: نفس المستند (source.id + externalId) موجود
    // في أي حي آخر يُتجاوز حتى لو اختلف الحي المستنتج هذه المرة عن حي التخزين
    // السابق (لا تكرار عبر الأحياء — إعلان قديم مراجَع لا يُعاد جمعه أبدًا).
    // الاستعلام على حقل externalId في مجموعة listings الجماعية (حقل واحد لا
    // يحتاج فهرسًا مركبًا)، ثم مطابقة docId الكامل الذي يشمل بادئة المصدر
    // فتستحيل مصادفة أرقام OLX/OpenSooq المتطابقة.
    const existsAnywhere = new Set<string>();
    if (pending.length > 0) {
      const extIds = [...new Set(pending.map((p) => String(p.data.externalId ?? '').trim()).filter(Boolean))];
      try {
        for (let i = 0; i < extIds.length; i += 10) {
          const snap = await db.collectionGroup('listings').where('externalId', 'in', extIds.slice(i, i + 10)).get();
          snap.docs.forEach((d) => existsAnywhere.add(d.id));
        }
      } catch (err) {
        // الحارس الشامل best-effort: فشل الفحص (مؤقت مثل إعداد الفهرس الجماعي)
        // لا يُسقط الرحلة — يبقى فحص الحي الدقيق (existing) ساريًا دائمًا.
        console.error('[crawl] global guard unavailable, skipping cross-neighborhood check', err);
      }
    }

    for (const p of pending) {
      if (existing.has(p.ref)) continue;
      if (existsAnywhere.has(p.ref.id)) continue;
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

  if (preview) (outcome as Record<string, unknown>).preview = true;
  return NextResponse.json({ ok: true, ...outcome });
}