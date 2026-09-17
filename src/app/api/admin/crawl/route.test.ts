import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

const mockGetAdminDb = vi.fn();
const mockIsAdmin = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockCrawlSource = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => mockGetAdminDb(),
}));

vi.mock('@/lib/admin', () => ({
  isAdmin: () => mockIsAdmin(),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getRequestIp: () => 'test-ip',
}));

vi.mock('@/lib/crawler/runner', () => ({
  crawlSource: (...args: unknown[]) => mockCrawlSource(...args),
  toStoredListing: (source: { id: string }, l: { externalId: string; title: string; price: number }) => ({
    externalId: l.externalId,
    title: l.title,
    price: l.price,
    sourceUrl: 'https://example.test/x',
    city: 'مدينة نصر',
    governorate: 'القاهرة',
    status: 'active',
  }),
  blockedToQueueItem: (source: unknown, url: string, reason: string) => ({ url, reason }),
}));

vi.mock('@/lib/neighborhood-writer', () => ({
  neighborhoodListingsRef: (
    db: FakeDb,
    nid: string
  ): { doc: (docId: string) => FakeListingDoc } => db.refForListings(nid),
  recomputeNeighborhoodMeta: vi.fn(async () => undefined),
}));

vi.mock('@/lib/listing-utils', () => ({
  resolveListingLocation: () => ({ neighborhoodId: 'n1', city: 'مدينة نصر', governorate: 'القاهرة' }),
  listingDedupKey: () => null,
  resolvePlaceFromSearchUrl: () => null,
}));

type FakeListingDoc = { path: string; id: string; set: (d: unknown) => Promise<void> };
interface FakeDb {
  refForListings: (nid: string) => { doc: (docId: string) => FakeListingDoc };
  getAll: (...docs: FakeListingDoc[]) => Promise<Array<{ exists: boolean; ref: FakeListingDoc }>>;
  collection: (name: string) => { doc: (id: string) => { set: (d: unknown) => Promise<void> } };
  collectionGroup: (name: string) => {
    where: (field: unknown, op: string, ids: string[]) => {
      get: () => Promise<{ docs: Array<{ id: string }> }>;
    };
  };
  written: Array<{ path: string; data: unknown }>;
}

function makeDb(existingDocIds: string[], existingAnywhereIds: string[] = []): FakeDb {
  const existingPaths = new Set(existingDocIds);
  const written: FakeDb['written'] = [];
  const db: FakeDb = {
    refForListings: (nid) => ({
      doc: (docId: string): FakeListingDoc => ({
        path: `neighborhoods/${nid}/listings/${docId}`,
        id: docId,
        set: async (data) => {
          written.push({ path: `neighborhoods/${nid}/listings/${docId}`, data });
        },
      }),
    }),
    getAll: async (...docs) => docs.map((d) => ({ exists: existingPaths.has(d.path), ref: d })),
    collection: () => ({
      doc: () => ({
        set: async () => {
          // قائمة المهام — لا شيء نتحقق منه هنا
        },
      }),
    }),
    collectionGroup: () => ({
      where: (_field, _op, extIds: string[]) => ({
        // الاستعلام على حقل externalId عبر كل الأحياء — يعيد المستندات الموجودة
        // في أي حي (المطابقة على docId الكامل = "المصدر_externalId").
        get: async () => ({
          docs: extIds
            .filter((ext) => existingAnywhereIds.some((full) => full.endsWith(`_${ext}`)))
            .map((ext) => ({ id: existingAnywhereIds.find((full) => full.endsWith(`_${ext}`))! })),
        }),
      }),
    }),
    written,
  };
  return db;
}

function makeRequest(body: string): NextRequest {
  return new NextRequest('https://razin.test/api/admin/crawl', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
}

function parsedListing(externalId: string, price: number) {
  return {
    externalId,
    title: `Twig ${externalId}`,
    price,
    sourceUrl: `https://example.test/${externalId}`,
    city: 'مدينة نصر' as string | null,
    governorate: 'القاهرة' as string | null,
    propertyType: null,
    finishing: null,
    rooms: null,
    bathrooms: null,
    areaM2: null,
    rentalFrequency: 'monthly' as string | null,
    listedAt: null,
    currency: 'EGP',
  };
}

beforeEach(() => {
  mockIsAdmin.mockReturnValue(true);
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfterMs: 0 });
});

function storedData(db: FakeDb, suffix: string): Record<string, unknown> | undefined {
  return db.written.find((w) => w.path.endsWith(suffix))?.data as Record<string, unknown> | undefined;
}

describe('POST /api/admin/crawl', () => {
  it('returns 401 without admin session', async () => {
    mockIsAdmin.mockReturnValue(false);
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, retryAfterMs: 5000 });
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('5');
  });

  it('skips listings whose docs already exist — reviewed rows are never re-written', async () => {
    // الحالة: إعلان أولكس قديم موجود أصلًا (المرجع الأصفر) + إعلان جديد غير موجود.
    mockCrawlSource.mockResolvedValue({
      sourceId: 'olx-eg',
      fetchedPages: 1,
      totalAvailable: 2,
      parsed: [parsedListing('old123', 7000), parsedListing('new777', 9000)],
      blocked: [],
      error: null,
    });

    const db = makeDb(['neighborhoods/n1/listings/olx-eg_old123']);
    mockGetAdminDb.mockReturnValue(db);

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.saved).toBeGreaterThan(0);

    // المستند الموجود أصلًا لم يُكتب إطلاقًا (حقول المراجعة اليدوية باقية)
    const rewritesToOld = db.written.filter((w) => w.path.endsWith('olx-eg_old123'));
    expect(rewritesToOld).toHaveLength(0);

    // الإعلان الجديد كُتب فعليًا في مصدرهما
    const wroteNew = db.written.filter((w) => w.path.endsWith('olx-eg_new777'));
    expect(wroteNew).toHaveLength(1);
  });

  it('skips a listing that already exists in ANOTHER neighborhood (global dedup by docId)', async () => {
    // الحالة: إعلان مخزّن سابقًا تحت حي مختلف (نتيجة تحليل موقع خاطئ قديم).
    // الحارس الشامل يجب أن يجده عبر كل الأحياء ويُتجاوزه حتى لو كان الحي
    // المستنتج الآن مختلفًا — لا إعادة جمع ولا تكرار عبر الأحياء أبدًا.
    mockCrawlSource.mockResolvedValue({
      sourceId: 'olx-eg',
      fetchedPages: 1,
      totalAvailable: 2,
      parsed: [parsedListing('old123', 7000), parsedListing('new777', 9000)],
      blocked: [],
      error: null,
    });

    // "old123" موجود مسبقًا في حي آخر (n2)، بينما المستنتج الحالي n1.
    const db = makeDb([], ['olx-eg_old123']);
    mockGetAdminDb.mockReturnValue(db);

    const res = await POST(makeRequest(JSON.stringify({ source: 'olx-eg' })));
    expect(res.status).toBe(200);
    const body = await res.json();

    // القديم لم يُكتب في n1 رغم أن getAll على n1 يراه غير موجود.
    const rewritesToOld = db.written.filter((w) => w.path.endsWith('olx-eg_old123'));
    expect(rewritesToOld).toHaveLength(0);
    expect(body.saved).toBe(1); // الجديد وحده

    const wroteNew = db.written.filter((w) => w.path.endsWith('olx-eg_new777'));
    expect(wroteNew).toHaveLength(1);
  });

  it('forwards custom olx search urls to the crawler when source+urls are given', async () => {
    mockCrawlSource.mockResolvedValue({
      sourceId: 'olx-eg',
      fetchedPages: 1,
      totalAvailable: 0,
      parsed: [],
      blocked: [],
      error: null,
    });
    const db = makeDb([]);
    mockGetAdminDb.mockReturnValue(db);

    const url = 'https://www.olx.com.eg/en/properties/apartments-duplex-for-rent/6th-of-october';
    const res = await POST(makeRequest(JSON.stringify({ source: 'olx-eg', urls: [url], limit: 5 })));
    expect(res.status).toBe(200);

    const call = mockCrawlSource.mock.calls.find(([, , opts]) => opts.searchUrls.includes(url));
    expect(call).toBeTruthy();
  });

  it('skips the first N parsed listings when skip is given', async () => {
    mockCrawlSource.mockResolvedValue({
      sourceId: 'olx-eg',
      fetchedPages: 1,
      totalAvailable: 6,
      parsed: [
        parsedListing('a1', 500),
        parsedListing('a2', 600),
        parsedListing('a3', 700),
        parsedListing('a4', 800),
        parsedListing('a5', 900),
        parsedListing('keep1', 1200),
      ],
      blocked: [],
      error: null,
    });
    const db = makeDb([]);
    mockGetAdminDb.mockReturnValue(db);

    const res = await POST(makeRequest(JSON.stringify({ source: 'olx-eg', skip: 5, limit: 10 })));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.saved).toBe(1);

    const writtenIds = db.written.map((w) => w.path.split('/').pop());
    expect(writtenIds).toContain('olx-eg_keep1');
    expect(writtenIds).not.toContain('olx-eg_a1');
    expect(writtenIds).not.toContain('olx-eg_a5');
  });

  it('rejects urls without an explicit source (parser confusion guard)', async () => {
    const res = await POST(makeRequest(JSON.stringify({ urls: ['https://www.olx.com.eg/en/properties/x'] })));
    expect(res.status).toBe(400);
  });

  it('rejects urls outside the allowed path prefix for the source', async () => {
    mockCrawlSource.mockResolvedValue({
      sourceId: 'opensooq-eg',
      fetchedPages: 1,
      totalAvailable: 0,
      parsed: [],
      blocked: [],
      error: null,
    });
    const res = await POST(
      makeRequest(JSON.stringify({ source: 'opensooq-eg', urls: ['https://eg.opensooq.com/anything-else/x'] }))
    );
    expect(res.status).toBe(400);
  });

  it('preview mode returns indexed items without writing anything', async () => {
    mockCrawlSource.mockResolvedValue({
      sourceId: 'olx-eg',
      fetchedPages: 1,
      totalAvailable: 3,
      parsed: [parsedListing('p1', 5000), parsedListing('p2', 6000), parsedListing('p3', 7000)],
      blocked: [],
      error: null,
    });
    const db = makeDb([]);
    mockGetAdminDb.mockReturnValue(db);

    const res = await POST(makeRequest(JSON.stringify({ source: 'olx-eg', preview: true })));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.preview).toBe(true);
    expect(body.previewItems).toHaveLength(3);
    expect(body.previewItems[0]).toMatchObject({ index: 1, externalId: 'p1', price: 5000 });
    expect(body.previewItems[2]).toMatchObject({ index: 3, externalId: 'p3', price: 7000 });
    expect(db.written).toHaveLength(0);
    expect(body.saved).toBe(0);
  });

  it('skips exact indices via rules.skipIndices', async () => {
    mockCrawlSource.mockResolvedValue({
      sourceId: 'olx-eg',
      fetchedPages: 1,
      totalAvailable: 5,
      parsed: [
        parsedListing('i1', 5000), parsedListing('i2', 6000),
        parsedListing('i3', 7000), parsedListing('i4', 8000), parsedListing('i5', 9000),
      ],
      blocked: [],
      error: null,
    });
    const db = makeDb([]);
    mockGetAdminDb.mockReturnValue(db);

    const res = await POST(makeRequest(JSON.stringify({
      source: 'olx-eg',
      rules: { skipIndices: [2, 4] },
    })));
    expect(res.status).toBe(200);
    expect((await res.json()).saved).toBe(3);
    const ids = db.written.map((w) => w.path.split('/').pop());
    expect(ids).toEqual(expect.arrayContaining(['olx-eg_i1', 'olx-eg_i3', 'olx-eg_i5']));
    expect(ids).not.toEqual(expect.arrayContaining(['olx-eg_i2', 'olx-eg_i4']));
  });

  it('forces propertyType via rules.typeOverrides', async () => {
    mockCrawlSource.mockResolvedValue({
      sourceId: 'olx-eg',
      fetchedPages: 1,
      totalAvailable: 2,
      parsed: [parsedListing('t1', 6000), parsedListing('t2', 7000)],
      blocked: [],
      error: null,
    });
    const db = makeDb([]);
    mockGetAdminDb.mockReturnValue(db);

    const res = await POST(makeRequest(JSON.stringify({
      source: 'olx-eg',
      rules: { typeOverrides: { 1: 'studio', 2: 'apartment' } },
    })));
    expect(res.status).toBe(200);
    expect((await res.json()).saved).toBe(2);
expect(storedData(db, 'olx-eg_t1')?.propertyType).toBe('studio');
    expect(storedData(db, 'olx-eg_t2')?.propertyType).toBe('apartment');
  });

  it('overrides price via rules.priceOverrides and passes the <300 guard', async () => {
    mockCrawlSource.mockResolvedValue({
      sourceId: 'olx-eg',
      fetchedPages: 1,
      totalAvailable: 2,
      parsed: [parsedListing('a1', 5000), parsedListing('a2', 25)],
      blocked: [],
      error: null,
    });
    const db = makeDb([]);
    mockGetAdminDb.mockReturnValue(db);

    const res = await POST(makeRequest(JSON.stringify({
      source: 'olx-eg',
      rules: { priceOverrides: { 2: 21000 } },
    })));
    expect(res.status).toBe(200);
    expect((await res.json()).saved).toBe(2);
    expect(storedData(db, 'olx-eg_a2')?.price).toBe(21000);
  });

  it('priceOverrides below 300 are still rejected by the honesty guard', async () => {
    mockCrawlSource.mockResolvedValue({
      sourceId: 'olx-eg',
      fetchedPages: 1,
      totalAvailable: 2,
      parsed: [parsedListing('b1', 5000), parsedListing('b2', 800)],
      blocked: [],
      error: null,
    });
    const db = makeDb([]);
    mockGetAdminDb.mockReturnValue(db);

    const res = await POST(makeRequest(JSON.stringify({
      source: 'olx-eg',
      rules: { priceOverrides: { 2: 100 } },
    })));
    expect(res.status).toBe(200);
    expect((await res.json()).saved).toBe(1);
    expect(db.written.find((w) => w.path.endsWith('olx-eg_b1'))).toBeTruthy();
    expect(db.written.find((w) => w.path.endsWith('olx-eg_b2'))).toBeFalsy();
  });

  it('combined skip + type + price rules work together', async () => {
    mockCrawlSource.mockResolvedValue({
      sourceId: 'olx-eg',
      fetchedPages: 1,
      totalAvailable: 5,
      parsed: [
        parsedListing('x1', 5000), parsedListing('x2', 6000),
        parsedListing('x3', 30),   parsedListing('x4', 8000), parsedListing('x5', 9000),
      ],
      blocked: [],
      error: null,
    });
    const db = makeDb([]);
    mockGetAdminDb.mockReturnValue(db);

    const res = await POST(makeRequest(JSON.stringify({
      source: 'olx-eg',
      rules: {
        skipIndices: [2, 5],
        typeOverrides: { 1: 'studio' },
        priceOverrides: { 3: 3000 },
      },
    })));
    expect(res.status).toBe(200);
    expect((await res.json()).saved).toBe(3);
    const ids = db.written.map((w) => w.path.split('/').pop());
    expect(ids).toEqual(expect.arrayContaining(['olx-eg_x1', 'olx-eg_x3', 'olx-eg_x4']));
    expect(ids).not.toEqual(expect.arrayContaining(['olx-eg_x2', 'olx-eg_x5']));
    expect(storedData(db, 'olx-eg_x1')?.propertyType).toBe('studio');
    expect(storedData(db, 'olx-eg_x3')?.price).toBe(3000);
  });

  it('stopAt caps processing after the given index (nothing beyond is stored)', async () => {
    mockCrawlSource.mockResolvedValue({
      sourceId: 'olx-eg',
      fetchedPages: 1,
      totalAvailable: 5,
      parsed: [
        parsedListing('s1', 5000), parsedListing('s2', 6000),
        parsedListing('s3', 7000), parsedListing('s4', 8000), parsedListing('s5', 9000),
      ],
      blocked: [],
      error: null,
    });
    const db = makeDb([]);
    mockGetAdminDb.mockReturnValue(db);

    const res = await POST(makeRequest(JSON.stringify({
      source: 'olx-eg',
      rules: { stopAt: 3 },
    })));
    expect(res.status).toBe(200);
    expect((await res.json()).saved).toBe(3);
    const ids = db.written.map((w) => w.path.split('/').pop());
    expect(ids).toEqual(expect.arrayContaining(['olx-eg_s1', 'olx-eg_s2', 'olx-eg_s3']));
    expect(ids).not.toEqual(expect.arrayContaining(['olx-eg_s4', 'olx-eg_s5']));
  });

  it('stopAt also caps preview items', async () => {
    mockCrawlSource.mockResolvedValue({
      sourceId: 'olx-eg',
      fetchedPages: 1,
      totalAvailable: 5,
      parsed: [
        parsedListing('r1', 5000), parsedListing('r2', 6000),
        parsedListing('r3', 7000), parsedListing('r4', 8000), parsedListing('r5', 9000),
      ],
      blocked: [],
      error: null,
    });
    const db = makeDb([]);
    mockGetAdminDb.mockReturnValue(db);

    const res = await POST(makeRequest(JSON.stringify({
      source: 'olx-eg',
      preview: true,
      rules: { stopAt: 3 },
    })));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.previewItems).toHaveLength(3);
    expect(body.previewItems[body.previewItems.length - 1]).toMatchObject({ index: 3 });
  });
});