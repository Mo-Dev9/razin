/**
 * منسّق الرحلة الواحدة: robots.txt → صفحة بحث عامة → تطبيع.
 * القواعد الثابتة: إعلانات السوق العامة فقط، احترام robots.txt،
 * ولا محاولة تجاوز أي حماية (تسجيل دخول/كابتشا/حظر) — تُحفظ الصفحة للجمع اليدوي.
 */

import type { BlockReason, CrawlResult, CrawlSettings, CrawlSource, ParsedListing } from '@/lib/crawler/types';
import { parseOlxSearchHtml, reasonForStatus } from '@/lib/crawler/olx-eg';
import { parseRobotsTxt, robotsAllows } from '@/lib/crawler/robots';

export interface FetchTextResult {
  ok: boolean;
  status: number;
  body: string;
  finalUrl: string;
}

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
}

/**
 * ينفّذ رحلة جلب واحدة على مصدر. أخطاء الشبكة لا تُسكت — تُرجع للرحلة كلها.
 * الفشل في الصفحة الواحدة يُسجَّل باسم blocked (سببه) ويستمر في ما بعدها.
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

  // 2) لكل صفحة بحث:
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

    // تحقق وقائي من القيد الإضافي: المسار الأقل مقبولًا في المصدر.
    if (!source.allowedPathPrefixes.some((p) => path.startsWith(p))) {
      result.blocked.push({ url, reason: 'blocked', note: 'مسار خارج النطاق المسموح للمصدر' });
      continue;
    }

    try {
      if (settings.minDelayMs && result.fetchedPages > 0) await sleep(settings.minDelayMs);
      const fetchRes = await fetchText(url, settings);
      result.fetchedPages += 1;

      if (!fetchRes.ok) {
        const r = reasonForStatus(fetchRes.status);
        result.blocked.push({ url, reason: r?.reason ?? 'blocked', note: r?.note });
        continue;
      }

      const parsed = parseOlxSearchHtml(fetchRes.body);
      result.totalAvailable = parsed.totalAvailable ?? result.totalAvailable;
      result.parsed.push(...parsed.items);
    } catch (err) {
      result.blocked.push({
        url,
        reason: 'blocked',
        note: err instanceof Error ? err.message : 'فشل الجلب',
      });
    }
  }

  // 3) إزالة ازدواج بالأمعرّف الرقمي عبر جميع الصفحات.
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
    sourceName: source.name,
    sourceType: 'crawled',
    sourceUrl: l.sourceUrl,
    price: l.price,
    currency: l.currency || 'EGP',
    city: l.city,
    governorate: l.governorate,
    propertyType: l.propertyType,
    finishing: l.finishing,
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