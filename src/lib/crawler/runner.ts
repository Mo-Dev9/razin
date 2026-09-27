/**
 * منسّق الرحلة الواحدة: robots.txt → صفحة بحث عامة → تطبيع.
 * القواعد الثابتة: إعلانات السوق العامة فقط، احترام robots.txt،
 * ولا محاولة تجاوز أي حماية (تسجيل دخول/كابتشا/حظر) — تُحفظ الصفحة للجمع اليدوي.
 */

import type { BlockReason, CrawlResult, CrawlSettings, CrawlSource, ParsedListing, SourceParser } from '@/lib/crawler/types';
import { reasonForStatus } from '@/lib/crawler/olx-eg';
import { parseRobotsTxt, robotsAllows } from '@/lib/crawler/robots';

// طبقة الجلب الشبكية مبنية على Crawlee (CheerioCrawler 3.x) — مكتبة الزحف المعتمدة
// (دمج تشرين الثاني... بتاريخ ٢٦ سبتمبر ٢٠٢٦). توفر: إعادة محاولة تلقائية،
// UA/بصمة متصفح، إدارة جلسات، ومهلة موحّدة. يعمل بـ Node ≥16 وCheerioCrawler لا
// يتطلب متصفحًا (HTTP خام + Cheerio) — خفيف وآمن للتشغيل في سيرفرلس Vercel.
import { CheerioCrawler, Configuration, LogLevel } from '@crawlee/cheerio';

export interface FetchTextResult {
  ok: boolean;
  status: number;
  body: string;
  finalUrl: string;
}

/** جلب نقي خام — يُستخدم لـ robots.txt فقط (لا حاجة لتعقيد كراولر لذلك). */
export async function fetchText(url: string, settings: CrawlSettings): Promise<FetchTextResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), settings.timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': settings.userAgent,
        accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body, finalUrl: res.url || url };
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RunSourceOptions {
  /** عناوين الصفحات لجلبها بهذا الترتيب (افتراضيًا صفحة البحث القياسية الواردة في المصدر). */
  searchUrls: string[];
  /** مشكّل صفحة البحث الخاص بهذا المصدر — يُحدَّد عند إضافة مصدر جديد. */
  parser: SourceParser;
}

/**
 * ينفّذ رحلة جلب واحدة على مصدر. أخطاء الشبكة لا تُسكت — تُرجع للرحلة كلها.
 * الفشل في الصفحة الواحدة يُسجَّل باسم blocked (سببه) ويستمر في ما بعدها.
 * صفحات البحث نفسها تُجلب عبر CheerioCrawler (Crawlee) — بصمة متصفح + جلسات
 * + إعادة محاولة. تزامن = 1 احترامًا لأدب الزحف وأفضليته (minDelayMs).
 */
export async function crawlSource(
  source: CrawlSource,
  settings: CrawlSettings,
  options: RunSourceOptions,
): Promise<CrawlResult> {
  const result: CrawlResult = {
    sourceId: source.id,
    fetchedPages: 0,
    totalAvailable: null,
    parsed: [],
    blocked: [],
    error: null,
  };

  // 1) robots.txt
  let robotsRules: ReturnType<typeof parseRobotsTxt> | null = null;
  try {
    const robots = await fetchText(source.robotsUrl, settings);
    if (robots.ok) {
      const uaToken = settings.userAgent.match(/^(\S+)\//)?.[1] ?? settings.userAgent;
      robotsRules = parseRobotsTxt(robots.body, uaToken);
    }
  } catch {
    // غياب robots لا يمنع الزيارة (تدرّج بلا robots.txt شائعًا)، نواصل بحذر.
    robotsRules = null;
  }

  // 2) تصفية الروابط قبل أي طلب: robots + بادئات المصدر المسموحة.
  const allowed: Array<{ url: string; path: string }> = [];
  for (const url of options.searchUrls) {
    const path = (() => {
      try {
        return new URL(url).pathname;
      } catch {
        return url;
      }
    })();

    if (robotsRules && !robotsAllows(robotsRules, path)) {
      result.blocked.push({ url, reason: 'robots-disallow' });
      continue;
    }

    if (!source.allowedPathPrefixes.some((p) => path.startsWith(p))) {
      result.blocked.push({ url, reason: 'blocked', note: 'مسار خارج النطاق المسموح للمصدر' });
      continue;
    }

    allowed.push({ url, path });
  }

  // 3) جلب الصفحات المسموحة عبر CheerioCrawler (ترتيب الدخول نفسه محفوظ —
  //    تزامن 1 + minDelayMs يبقيان الإيقاع مهذّبًا كما كان fetchText فعلًا).
  // التخزين الدائم معطّل (serverless-safe): لا ملفات، كل شيء في الذاكرة.
  const config = new Configuration({ persistStorage: false, purgeOnStart: false, logLevel: LogLevel.ERROR });
  let lastFetchAt = 0;
  const crawler = new CheerioCrawler(
    {
      maxConcurrency: 1,
      minConcurrency: 1,
      maxRequestRetries: 1,
      retryOnBlocked: true,
      requestHandlerTimeoutSecs: Math.max(5, Math.ceil(settings.timeoutMs / 1000)),
      // مهلة جلب صريحة مماثلة لـ timeoutMs؛ لا «جلسة» تُسقط الصفحة إلا بعد RTT حقيقي.
      requestHandler: async ({ request, response, body: rawBody }) => {
        const status = response?.statusCode ?? 200;
        if (settings.minDelayMs && lastFetchAt > 0) {
          const wait = settings.minDelayMs - (Date.now() - lastFetchAt);
          if (wait > 0) await sleep(wait);
        }
        lastFetchAt = Date.now();
        result.fetchedPages += 1;

        // الاستجابة غير الناجحة — نفس تصنيف الرحلة القديمة (reasonForStatus).
        if (status >= 400) {
          const r = reasonForStatus(status);
          result.blocked.push({ url: request.url, reason: r?.reason ?? 'blocked', note: r?.note });
          return;
        }

        const html = typeof rawBody === 'string' ? rawBody : rawBody?.toString() ?? '';
        if (!html) {
          result.blocked.push({ url: request.url, reason: 'blocked', note: 'استجابة فارغة' });
          return;
        }

        try {
          const parsed = options.parser.parseSearchHtml(html);
          result.totalAvailable = parsed.totalAvailable ?? result.totalAvailable;
          result.parsed.push(...parsed.items.map((l) => ({ ...l, sourcePageUrl: request.url })));
        } catch (err) {
          result.blocked.push({
            url: request.url,
            reason: 'blocked',
            note: err instanceof Error ? err.message : 'فشل تحليل الصفحة',
          });
        }
      },
      // الطلبات المُخفقة نهائيًا (شبكة/تجاوز مهلة/حظر بعد إعادة المحاولة) تدخل قائمة الانتظار.
      failedRequestHandler: async ({ request, response }, error) => {
        const status = response?.statusCode ?? 0;
        const r = status >= 400 ? reasonForStatus(status) : null;
        result.blocked.push({
          url: request.url,
          reason: r?.reason ?? 'blocked',
          note: error?.message ?? r?.note ?? 'فشل الطلب بعد إعادة المحاولة',
        });
      },
    },
    config
  );

  await crawler.run(allowed.map(({ url }) => url));

  // 4) إزالة ازدواج بالأمعرّف الرقمي عبر جميع الصفحات.
  const seen = new Set<string>();
  result.parsed = result.parsed.filter((l) => {
    if (seen.has(l.externalId)) return false;
    seen.add(l.externalId);
    return true;
  });

  return result;
}

/**
 * يحوّل إعلان كراولر إلى سجل إيداع (بلا حقول قد لا تتوفر من المصدر).
 * السعر فقط هو العمود الفقري — التصنيفات غير المؤكدة تبقى null ولا يُخترَع نص.
 */
export function toStoredListing(source: CrawlSource, l: ParsedListing): Record<string, unknown> {
  return {
    externalId: l.externalId,
    title: l.title,
    description: l.description ?? null,
    sourceName: source.name,
    sourceType: 'crawled',
    sourceUrl: l.sourceUrl,
    price: l.price,
    currency: l.currency || 'EGP',
    city: l.city,
    governorate: l.governorate,
    propertyType: l.propertyType,
    finishing: l.finishing,
    furnished: l.furnished,
    rooms: l.rooms,
    bathrooms: l.bathrooms,
    areaM2: l.areaM2,
    rentalFrequency: l.rentalFrequency,
    listedAt: l.listedAt,
    verif: 'unverified',
    status: 'active',
    recordedAt: Date.now(),
  };
}

export function blockedToQueueItem(source: CrawlSource, url: string, reason: BlockReason, note?: string): Record<string, unknown> {
  return {
    url,
    sourceName: source.name,
    reason,
    status: 'pending',
    addedAt: Date.now(),
    note: note ?? undefined,
  };
}