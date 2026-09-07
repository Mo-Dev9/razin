import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

const mockGetAdminDb = vi.fn();
const mockCheckRateLimit = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => mockGetAdminDb(),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

interface FakeDb {
  ops: string[];
  collection: (name: string) => {
    doc: (id: string) => {
      set: (data: unknown, opts: { merge: boolean }) => Promise<void>;
    };
  };
}

function makeDb(): FakeDb {
  const ops: string[] = [];
  return {
    ops,
    collection: (name: string) => ({
      doc: (id: string) => ({
        set: async () => {
          ops.push(`set:${name}/${id}`);
        },
      }),
    }),
  };
}

function makeRequest(rawBody: string): NextRequest {
  return new NextRequest('https://rentrate.test/api/visit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: rawBody,
  });
}

beforeEach(() => {
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfterMs: 0 });
  mockGetAdminDb.mockReturnValue(makeDb());
});

describe('POST /api/visit', () => {
  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, retryAfterMs: 5000 });
    const res = await POST(makeRequest(JSON.stringify({ path: '/search' })));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('5');
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await POST(makeRequest('{not-json'));
    expect(res.status).toBe(400);
  });

  it('ignores invalid paths without counting', async () => {
    for (const path of ['/admin', '/api/reviews', 'search', '/_next/foo', 'x'.repeat(200)]) {
      const db = makeDb();
      mockGetAdminDb.mockReturnValue(db);
      const res = await POST(makeRequest(JSON.stringify({ path })));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(db.ops.length).toBe(0);
    }
  });

  it('increments day and page counters for a valid path', async () => {
    const db = makeDb();
    mockGetAdminDb.mockReturnValue(db);
    const res = await POST(makeRequest(JSON.stringify({ path: '/search' })));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(db.ops.some((op) => op.startsWith('set:visitDays/'))).toBe(true);
    expect(db.ops.some((op) => op.startsWith('set:visitPages/%2Fsearch'))).toBe(true);
  });
});