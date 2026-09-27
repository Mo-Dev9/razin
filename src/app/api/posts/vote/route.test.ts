import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

const mockGetAdminDb = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockCheckRateLimitShared = vi.fn();
const mockAuthUid = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => mockGetAdminDb(),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  checkRateLimitShared: (...args: unknown[]) => mockCheckRateLimitShared(...args),
}));

vi.mock('@/lib/api-auth', () => ({
  authUid: () => mockAuthUid(),
}));

interface DbConfig {
  postExists?: boolean;
  status?: string;
  upCount?: number;
  downCount?: number;
  prevVote?: number;
  prevExists?: boolean;
}

interface TxRef {
  path: string;
  collection: (sub: string) => { doc: (id: string) => TxRef };
}

interface FakeDb {
  db: {
    runTransaction: (
      fn: (tx: {
        get: (ref: TxRef) => Promise<{ exists: boolean; data: () => Record<string, number | string> }>;
        set: (ref: TxRef, data: unknown, opts: unknown) => Promise<void>;
        delete: (ref: TxRef) => Promise<void>;
      }) => Promise<unknown>
    ) => Promise<unknown>;
    collection: (name: string) => { doc: (id: string) => TxRef };
  };
  txOps: string[];
}

function makeDb(cfg: DbConfig = {}): FakeDb {
  const txOps: string[] = [];
  const makeRef = (path: string): TxRef => {
    const ref: Partial<TxRef> = { path };
    ref.collection = (sub: string) => ({ doc: (subId: string) => makeRef(`${path}/${sub}/${subId}`) });
    return ref as TxRef;
  };
  const db = {
    runTransaction: async (fn: Parameters<FakeDb['db']['runTransaction']>[0]) =>
      fn({
        get: async (ref: TxRef) => {
          if (ref.path.includes('/votes/')) {
            return {
              exists: cfg.prevExists ?? false,
              data: () => ({ vote: cfg.prevVote ?? 0 }),
            };
          }
          return {
            exists: cfg.postExists ?? true,
            data: () => ({
              status: cfg.status ?? 'open',
              upCount: cfg.upCount ?? 0,
              downCount: cfg.downCount ?? 0,
            }),
          };
        },
        set: async () => {
          txOps.push('set');
        },
        delete: async () => {
          txOps.push('delete');
        },
      }),
    collection: (name: string) => ({
      doc: (id: string) => makeRef(`${name}/${id}`),
    }),
  };
  return { db, txOps };
}

function makeRequest(body: string): NextRequest {
  return new NextRequest('https://razin.test/api/posts/vote', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
}

beforeEach(() => {
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfterMs: 0 });
  mockCheckRateLimitShared.mockResolvedValue({ allowed: true, retryAfterMs: 0 });
  mockAuthUid.mockReturnValue('uid-1');
  const fake = makeDb();
  mockGetAdminDb.mockReturnValue(fake.db);
});

describe('POST /api/posts/vote', () => {
  it('returns 401 without a valid anonymous identity', async () => {
    mockAuthUid.mockReturnValue(null);
    const res = await POST(makeRequest(JSON.stringify({ postId: 'p1', vote: 1 })));
    expect(res.status).toBe(401);
  });

  it('returns 429 when rate limited', async () => {
    mockCheckRateLimitShared.mockResolvedValue({ allowed: false, retryAfterMs: 5000 });
    const res = await POST(makeRequest(JSON.stringify({ postId: 'p1', vote: 1 })));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('5');
  });

  it('returns 400 for an invalid vote value', async () => {
    for (const vote of [2, -2, 'up', null, undefined]) {
      const res = await POST(makeRequest(JSON.stringify({ postId: 'p1', vote })));
      expect(res.status).toBe(400);
    }
  });

  it('returns 400 for a missing postId', async () => {
    const res = await POST(makeRequest(JSON.stringify({ vote: 1 })));
    expect(res.status).toBe(400);
  });

  it('returns 400 for a composite postId (a/b) instead of 500', async () => {
    const res = await POST(makeRequest(JSON.stringify({ postId: 'a/b', vote: 1 })));
    expect(res.status).toBe(400);
  });

  it('returns 404 when the post does not exist', async () => {
    const fake = makeDb({ postExists: false });
    mockGetAdminDb.mockReturnValue(fake.db);
    const res = await POST(makeRequest(JSON.stringify({ postId: 'missing', vote: 1 })));
    expect(res.status).toBe(404);
  });

  it('returns 404 when the post is hidden (reported)', async () => {
    const fake = makeDb({ status: 'hidden' });
    mockGetAdminDb.mockReturnValue(fake.db);
    const res = await POST(makeRequest(JSON.stringify({ postId: 'p1', vote: 1 })));
    expect(res.status).toBe(404);
  });

  it('adds an upvote for a fresh vote and records the vote doc', async () => {
    const fake = makeDb({ upCount: 3, downCount: 2 });
    mockGetAdminDb.mockReturnValue(fake.db);
    const res = await POST(makeRequest(JSON.stringify({ postId: 'p1', vote: 1 })));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ upCount: 4, downCount: 2, netVotes: 2, myVote: 1 });
    expect(fake.txOps).toContain('set');
  });

  it('cancels the vote when the same direction is repeated (toggle)', async () => {
    const fake = makeDb({ upCount: 4, downCount: 2, prevVote: 1, prevExists: true });
    mockGetAdminDb.mockReturnValue(fake.db);
    const res = await POST(makeRequest(JSON.stringify({ postId: 'p1', vote: 1 })));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ upCount: 3, downCount: 2, netVotes: 1, myVote: 0 });
    expect(fake.txOps).toContain('delete');
  });

  it('switches from up to down while keeping the net balance', async () => {
    const fake = makeDb({ upCount: 4, downCount: 2, prevVote: 1, prevExists: true });
    mockGetAdminDb.mockReturnValue(fake.db);
    const res = await POST(makeRequest(JSON.stringify({ postId: 'p1', vote: -1 })));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ upCount: 3, downCount: 3, netVotes: 0, myVote: -1 });
  });

  it('cancels an explicit vote=0 request', async () => {
    const fake = makeDb({ upCount: 4, downCount: 2, prevVote: 1, prevExists: true });
    mockGetAdminDb.mockReturnValue(fake.db);
    const res = await POST(makeRequest(JSON.stringify({ postId: 'p1', vote: 0 })));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ upCount: 3, downCount: 2, myVote: 0 });
    expect(fake.txOps).toContain('delete');
  });
});