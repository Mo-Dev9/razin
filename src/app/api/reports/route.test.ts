import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

const mockGetAdminDb = vi.fn();
const mockGetAdminAuth = vi.fn();
const mockCheckRateLimit = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => mockGetAdminDb(),
  getAdminAuth: () => mockGetAdminAuth(),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

interface ReviewDocData {
  exists: boolean;
  data?: { buildingId?: string };
}

interface FakeDb {
  ops: string[];
  reviewDoc: ReviewDocData;
  hasDupReport: boolean;
}

function makeDb(): FakeDb {
  return {
    ops: [],
    reviewDoc: { exists: true, data: { buildingId: 'b1' } },
    hasDupReport: false,
  };
}

function makeDbFacade(db: FakeDb) {
  return {
    collection: (name: string) => ({
      doc: (id: string) => ({
        get: async () => {
          db.ops.push(`get:${name}/${id}`);
          return { exists: db.reviewDoc.exists, data: () => db.reviewDoc.data };
        },
      }),
      where: () => ({
        where: () => ({
          limit: () => ({
            get: async () => ({ empty: !db.hasDupReport }),
          }),
        }),
      }),
      add: async () => {
        db.ops.push(`add:${name}`);
      },
    }),
  };
}

function makeRequest(rawBody: string, authorized = true): NextRequest {
  return new NextRequest('https://rentrate.test/api/reports', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(authorized ? { authorization: 'Bearer tok' } : {}),
    },
    body: rawBody,
  });
}

beforeEach(() => {
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfterMs: 0 });
  mockGetAdminAuth.mockReturnValue({ verifyIdToken: () => Promise.resolve({ uid: 'u1' }) });
});

describe('POST /api/reports', () => {
  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, retryAfterMs: 5000 });
    const res = await POST(makeRequest(JSON.stringify({ reviewId: 'r1', buildingId: 'b1', reason: 'offensive' })));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('5');
  });

  it('returns 401 without a valid token', async () => {
    mockGetAdminAuth.mockReturnValue({ verifyIdToken: () => Promise.reject(new Error('bad')) });
    const res = await POST(makeRequest(JSON.stringify({ reviewId: 'r1', buildingId: 'b1', reason: 'offensive' }), false));
    expect(res.status).toBe(401);
  });

  it('returns 401 for an anonymous (not Google-linked) user', async () => {
    mockGetAdminAuth.mockReturnValue({
      verifyIdToken: () => Promise.resolve({ uid: 'u1', firebase: { sign_in_provider: 'anonymous' } }),
    });
    const res = await POST(makeRequest(JSON.stringify({ reviewId: 'r1', buildingId: 'b1', reason: 'offensive' })));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('سجّل بـ Google أولاً');
  });

  it('returns 400 for an invalid reason', async () => {
    const res = await POST(makeRequest(JSON.stringify({ reviewId: 'r1', buildingId: 'b1', reason: 'spam' })));
    expect(res.status).toBe(400);
  });

  it('returns 400 when reviewId is missing', async () => {
    const res = await POST(makeRequest(JSON.stringify({ buildingId: 'b1', reason: 'offensive' })));
    expect(res.status).toBe(400);
  });

  it('returns 404 when the review does not exist', async () => {
    const db = makeDb();
    db.reviewDoc = { exists: false };
    mockGetAdminDb.mockReturnValue(makeDbFacade(db));
    const res = await POST(makeRequest(JSON.stringify({ reviewId: 'r1', buildingId: 'b1', reason: 'offensive' })));
    expect(res.status).toBe(404);
  });

  it('returns 400 when the review belongs to another building', async () => {
    const db = makeDb();
    db.reviewDoc = { exists: true, data: { buildingId: 'b2' } };
    mockGetAdminDb.mockReturnValue(makeDbFacade(db));
    const res = await POST(makeRequest(JSON.stringify({ reviewId: 'r1', buildingId: 'b1', reason: 'offensive' })));
    expect(res.status).toBe(400);
  });

  it('returns 409 when the user already reported that review', async () => {
    const db = makeDb();
    db.hasDupReport = true;
    mockGetAdminDb.mockReturnValue(makeDbFacade(db));
    const res = await POST(makeRequest(JSON.stringify({ reviewId: 'r1', buildingId: 'b1', reason: 'offensive' })));
    expect(res.status).toBe(409);
  });

  it('creates a pending report for valid input', async () => {
    const db = makeDb();
    mockGetAdminDb.mockReturnValue(makeDbFacade(db));
    const res = await POST(makeRequest(JSON.stringify({ reviewId: 'r1', buildingId: 'b1', reason: 'personal_data' })));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(db.ops.some((op) => op.startsWith('add:reports'))).toBe(true);
  });
});