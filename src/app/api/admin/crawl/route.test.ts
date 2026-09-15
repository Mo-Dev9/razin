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
}));

type FakeListingDoc = { path: string; set: (d: unknown) => Promise<void> };
interface FakeDb {
  refForListings: (nid: string) => { doc: (docId: string) => FakeListingDoc };
  getAll: (...docs: FakeListingDoc[]) => Promise<Array<{ exists: boolean; ref: FakeListingDoc }>>;
  collection: (name: string) => { doc: (id: string) => { set: (d: unknown) => Promise<void> } };
  written: Array<{ path: string; data: unknown }>;
}

function makeDb(existingDocIds: string[]): FakeDb {
  const existingPaths = new Set(existingDocIds);
  const written: FakeDb['written'] = [];
  const db: FakeDb = {
    refForListings: (nid) => ({
      doc: (docId: string): FakeListingDoc => ({
        path: `neighborhoods/${nid}/listings/${docId}`,
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
});