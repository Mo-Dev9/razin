import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import type { VoteType } from '@/types';

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

interface OpsRef {
  path: string;
}

interface FakeDb {
  db: {
    collection: (name: string) => { doc: (id: string) => OpsRef };
    runTransaction: (cb: (tx: FakeTx) => Promise<unknown>) => Promise<unknown>;
  };
  ops: string[];
}

interface FakeTx {
  get: (ref: OpsRef) => Promise<{ exists: boolean; data: () => unknown }>;
  delete: (ref: OpsRef) => Promise<void>;
  set: (ref: OpsRef, data: unknown) => Promise<void>;
  update: (ref: OpsRef, data: unknown) => Promise<void>;
}

function makeDb(review: { buildingId: string } | null, vote: { type: VoteType } | null): FakeDb {
  const ops: string[] = [];
  const tx: FakeTx = {
    get: async (ref) => {
      if (ref.path.startsWith('reviews/')) {
        return { exists: !!review, data: () => review };
      }
      if (ref.path.startsWith('votes/')) {
        return { exists: !!vote, data: () => vote };
      }
      throw new Error(`Unexpected path: ${ref.path}`);
    },
    delete: async (ref) => {
      ops.push(`delete:${ref.path}`);
    },
    set: async (ref, data) => {
      ops.push(`set:${ref.path}:${(data as { type: string }).type}`);
    },
    update: async (ref) => {
      ops.push(`update:${ref.path}`);
    },
  };
  const db = {
    collection: (name: string) => ({
      doc: (id: string) => ({ path: `${name}/${id}` }),
    }),
    runTransaction: async (cb: (t: FakeTx) => Promise<unknown>) => cb(tx),
  };
  return { db, ops };
}

function makeRequest(overrides: {
  rawBody?: string;
  token?: string;
  ip?: string;
  noAuth?: boolean;
} = {}) {
  const { rawBody, token = 'token-123', ip = 'ip-1', noAuth = false } = overrides;
  const body =
    rawBody ??
    JSON.stringify({ reviewId: 'review-1', buildingId: 'building-1', type: 'up' });
  const headers: Record<string, string> = {
    'x-forwarded-for': ip,
    'content-type': 'application/json',
  };
  if (!noAuth) headers.authorization = `Bearer ${token}`;
  return new NextRequest('https://rentrate.test/api/reviews/vote', {
    method: 'POST',
    headers,
    body,
  });
}

beforeEach(() => {
  mockGetAdminAuth.mockReturnValue({
    verifyIdToken: (t: string) =>
      t === 'invalid-token'
        ? Promise.reject(new Error('invalid token'))
        : Promise.resolve({ uid: 'user-1' }),
  });
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfterMs: 0 });
  mockGetAdminDb.mockReturnValue(makeDb({ buildingId: 'building-1' }, null).db);
});

describe('POST /api/reviews/vote', () => {
  it('returns 401 when no auth header', async () => {
    const res = await POST(makeRequest({ noAuth: true }));
    expect(res.status).toBe(401);
  });

  it('returns 401 for an invalid token', async () => {
    const res = await POST(makeRequest({ token: 'invalid-token' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for malformed JSON body', async () => {
    const res = await POST(makeRequest({ rawBody: '{not-json' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing/invalid fields', async () => {
    const missingType = await POST(
      makeRequest({ rawBody: JSON.stringify({ reviewId: 'r', buildingId: 'b', type: 'neutral' }) })
    );
    expect(missingType.status).toBe(400);

    const missingId = await POST(
      makeRequest({ rawBody: JSON.stringify({ reviewId: '', buildingId: 'b', type: 'up' }) })
    );
    expect(missingId.status).toBe(400);
  });

  it('returns 404 when the review does not exist', async () => {
    mockGetAdminDb.mockReturnValue(makeDb(null, null).db);
    const res = await POST(makeRequest());
    expect(res.status).toBe(404);
  });

  it('returns 400 when buildingId mismatches the review', async () => {
    mockGetAdminDb.mockReturnValue(makeDb({ buildingId: 'other-building' }, null).db);
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
  });

  it('adds a new upvote and persists vote + counters', async () => {
    const { db, ops } = makeDb({ buildingId: 'building-1' }, null);
    mockGetAdminDb.mockReturnValue(db);
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, upvotes: 1, downvotes: 0, userVote: 'up', net: 1 });
    expect(ops).toContain('set:votes/review-1_user-1:up');
    expect(ops).toContain('update:reviews/review-1');
  });

  it('removes the vote on the same type again', async () => {
    const { db, ops } = makeDb({ buildingId: 'building-1' }, { type: 'up' });
    mockGetAdminDb.mockReturnValue(db);
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ upvotes: 0, downvotes: 0, userVote: null, net: 0 });
    expect(ops).toContain('delete:votes/review-1_user-1');
    expect(ops).not.toContain('set:votes/review-1_user-1:up');
  });

  it('switches from up to down', async () => {
    const { db, ops } = makeDb({ buildingId: 'building-1' }, { type: 'up' });
    mockGetAdminDb.mockReturnValue(db);
    const res = await POST(
      makeRequest({
        rawBody: JSON.stringify({ reviewId: 'review-1', buildingId: 'building-1', type: 'down' }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ upvotes: 0, downvotes: 1, userVote: 'down', net: -1 });
    expect(ops).toContain('delete:votes/review-1_user-1');
    expect(ops).toContain('set:votes/review-1_user-1:down');
  });

  it('keeps legacy reviews without counters safe (defaults to 0)', async () => {
    mockGetAdminDb.mockReturnValue(makeDb({ buildingId: 'building-1' }, null).db);
    const res = await POST(makeRequest());
    const body = await res.json();
    expect(body).toMatchObject({ upvotes: 1, downvotes: 0 });
  });

  it('returns 429 when rate limit is hit', async () => {
    mockCheckRateLimit.mockReturnValue({ allowed: false, retryAfterMs: 5000 });
    const res = await POST(makeRequest());
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('5');
  });
});