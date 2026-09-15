import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';

const mockGetAdminDb = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockAuthUid = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => mockGetAdminDb(),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getRequestIp: () => 'test-ip',
}));

vi.mock('@/lib/api-auth', () => ({
  authUid: () => mockAuthUid(),
}));

interface MineDoc {
  id: string;
  data: Record<string, unknown>;
}

function makeDb(docs: MineDoc[]) {
  const snap = {
    docs: docs.map((d) => ({
      id: d.id,
      data: () => d.data,
    })),
  };
  const chain = {
    where: () => chain,
    orderBy: () => chain,
    limit: () => chain,
    get: async () => snap,
  };
  return {
    collection: (name: string) => (name === 'posts' ? chain : null),
  };
}

function makeReq(auth: string | null, url = 'http://localhost/api/posts/mine?limit=10'): NextRequest {
  const headers: Record<string, string> = {};
  if (auth) headers.Authorization = auth;
  return new NextRequest(url, { headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfterMs: 0 });
});

describe('GET /api/posts/mine', () => {
  it('يطلب دخولًا عند غياب الرمز (401)', async () => {
    mockAuthUid.mockResolvedValueOnce(null);
    const res = await GET(makeReq(null));
    expect(res.status).toBe(401);
    expect(mockGetAdminDb).not.toHaveBeenCalled();
  });

  it('يرفض الطلبات المتكررة (429)', async () => {
    mockAuthUid.mockResolvedValueOnce('uid-1');
    mockCheckRateLimit.mockReturnValueOnce({ allowed: false, retryAfterMs: 30_000 });
    const res = await GET(makeReq('Bearer tok'));
    expect(res.status).toBe(429);
  });

  it('يعيد منشورات المستخدم مرتبة بالأحدث بلا إحداثيات/هوية حقيقية', async () => {
    mockAuthUid.mockResolvedValueOnce('uid-1');
    mockGetAdminDb.mockReturnValueOnce(
      makeDb([
        { id: 'p2', data: { userId: 'uid-1', text: 'نصيحة عن مالك عمارة في الحي', createdAt: 2000, upCount: 3, downCount: 1, netVotes: 2, numComments: 4, status: 'open', neighborhoodId: '6اكتوبر', city: '6 أكتوبر', lat: 30.0, lng: 31.2 } },
        { id: 'p5', data: { userId: 'uid-1', text: 'عرض خدمة صيانة لسكان العمارة', createdAt: 1000, status: 'hidden', city: 'المعادي' } },
      ])
    );
    const res = await GET(makeReq('Bearer tok'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { posts: Array<Record<string, unknown>>; count: number };
    expect(body.count).toBe(2);
    expect(body.posts[0].id).toBe('p2');
    expect(body.posts[0].text).toBe('نصيحة عن مالك عمارة في الحي');
    expect(body.posts[0].netVotes).toBe(2);
    expect(body.posts[0].numComments).toBe(4);
    expect(body.posts[1].status).toBe('hidden');
    expect(body.posts[0]).not.toHaveProperty('lat');
    expect(body.posts[0]).not.toHaveProperty('lng');
    expect(body.posts[0]).not.toHaveProperty('displayName');
  });
});