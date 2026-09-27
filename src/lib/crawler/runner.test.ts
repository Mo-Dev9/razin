import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { crawlSource } from '@/lib/crawler/runner';
import type { CrawlSettings, ParsedListing, SourceParser } from '@/lib/crawler/types';

/**
 * اختبار سلوكي لدمج Crawlee (CheerioCrawler) في طبقة جلب الرحلة:
 * خادم HTTP محلي حقيقي يلفّ كل مسار مصدر تجريبي (روبات + بحث + محظورات)
 * وينفي أن الدمج يعمل فعليًا: جلب عبر Crawlee، احترام robots، تصنيف الحظر،
 * وإزالة الازدواج عبر الصفحات — لا اختبار معزول على دالة واحدة.
 */

const HOST = '127.0.0.1';
let server: Server;
let baseUrl = '';

/** مشكّل تجريبي يقرأ إعلانات <article data-id> من HTML المرتجَع. */
const fakeParser: SourceParser = {
  parseSearchHtml(html: string) {
    const items: ParsedListing[] = [];
    const re = /<article[^>]*data-id="([^"]+)"[^>]*data-price="(\d+)"[^>]*(?:data-city="([^"]*)")?[^>]*>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      items.push({
        externalId: m[1],
        title: `شقة ${m[1]}`,
        url: `${baseUrl}/listing/${m[1]}`,
        price: Number(m[2]),
        currency: 'EGP',
        city: m[3] ?? null,
        governorate: null,
        propertyType: null,
        finishing: null,
        furnished: null,
        rooms: null,
        bathrooms: null,
        areaM2: null,
        rentalFrequency: 'monthly',
        listedAt: null,
        sourceUrl: `${baseUrl}/listing/${m[1]}`,
      });
    }
    return { items, totalAvailable: items.length };
  },
};

function htmlResponse(articles: string): string {
  return `<!doctype html><html><body>${articles}</body></html>`;
}

function article(id: string, price: number, city?: string): string {
  return `<article data-id="${id}" data-price="${price}"${city ? ` data-city="${city}"` : ''}></article>`;
}

beforeAll(async () => {
  server = createServer((req, res) => {
    const path = (req.url ?? '').split('?')[0];

    if (path === '/robots.txt') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('User-agent: *\nAllow: /search/\nDisallow: /protected/\n');
      return;
    }

    if (path === '/search/page1') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(htmlResponse(article('a1', 5000, 'القاهرة') + article('a2', 6000, 'الجيزة')));
      return;
    }

    if (path === '/search/page2') {
      // عقدة: نفس externalId من صفحة أولى تكررًا عبر الصفحات — يجب إزالتها.
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(htmlResponse(article('a1', 5000, 'القاهرة') + article('a3', 7000)));
      return;
    }

    // مسار محظور بصراحة في robots.txt — يُسجَّل blocked ولا يُجلب أصلاً.
    if (path === '/protected/page') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(htmlResponse(article('b1', 9999)));
      return;
    }

    // مسار محظور لأسباب تقنية (403) — تمر عبر Crawlee ثم تُصنَّف protected.
    if (path === '/search/blocked') {
      res.writeHead(403, { 'Content-Type': 'text/html' });
      res.end('Forbidden');
      return;
    }

    // صفحة البحث الوحيدة المتاحة بالإضافة لمحظورات: استجابة فارغة (لا إعلان).
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlResponse(''));
  });

  await new Promise<void>((resolve) => server.listen(0, HOST, resolve));
  baseUrl = `http://${HOST}:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('crawlSource مع CheerioCrawler (Crawlee)', () => {
  const settings: CrawlSettings = {
    userAgent: 'RazinBot/1.0 (local test)',
    timeoutMs: 8000,
    minDelayMs: 5,
  };

  it('يجلب صفحات البحث عبر Crawlee ويحترم robots ويصنّف الحظر ويحذف الازدواج', async () => {
    // source يُبنى هنا بعد اكتمال beforeAll — أي بربط robotsUrl/ربوتات تلقائية مع baseUrl الحي.
    const source = {
      id: 'local-test',
      name: 'خادم محلي',
      baseUrl,
      robotsUrl: `${baseUrl}/robots.txt`,
      allowedPathPrefixes: ['/search/', '/protected/'],
    };
    // محاولة 403 هي اختبار مقصود: نُسكت سجل console الخاص بـ Crawlee (stderr) أثناء النداء
    // حتى لا يزعج ناتج الاختبار — لا نغيِّر سلوك الدمج نفسه.
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let result: Awaited<ReturnType<typeof crawlSource>>;
    try {
      result = await crawlSource(source, settings, {
        searchUrls: [
          `${baseUrl}/search/page1`,
          `${baseUrl}/search/page2`,
          `${baseUrl}/protected/page`,
          `${baseUrl}/search/blocked`,
          `${baseUrl}/not-allowed`,
        ],
        parser: fakeParser,
      });
    } finally {
      consoleErrorSpy.mockRestore();
    }

    // تعرّف عن المسارات التي اعترضها الكراولر على مستوى المصدر.
    const blockedUrls = result.blocked.map((b) => b.url);

    // 1) الصفحات الواقعية (page1 + page2) جُلبت وبارست — بدون الازدواج a1.
    expect(result.fetchedPages).toBeGreaterThanOrEqual(2);
    const ids = result.parsed.map((l) => l.externalId).sort();
    // totalAvailable نُحدَّث من آخر صفحة بارشتها (صفحة البحث القابلة للقراءة).
    expect(ids).toEqual(['a1', 'a2', 'a3'].sort());

    // 2) الجناح المحجوب في robots.txt لم يُزرع إطلاقًا (لا جلب ولا parsing).
    expect(blockedUrls).toContain(`${baseUrl}/protected/page`);
    const robotsBlock = result.blocked.find((b) => b.url === `${baseUrl}/protected/page`);
    expect(robotsBlock?.reason).toBe('robots-disallow');

    // 3) الصفحة 403 صُنفت protected (عبر reasonForStatus) وليس «ناجحة».
    expect(blockedUrls).toContain(`${baseUrl}/search/blocked`);
    expect(result.blocked.find((b) => b.url === `${baseUrl}/search/blocked`)?.reason).toBe('protected');

    // 4) المسار خارج allowedPathPrefixes رُفض من البداية (لا يصل الشبكة).
    expect(blockedUrls).toContain(`${baseUrl}/not-allowed`);
    const noPrefix = result.blocked.find((b) => b.url === `${baseUrl}/not-allowed`);
    expect(noPrefix?.note).toContain('خارج النطاق');
  });
});