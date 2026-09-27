import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

const mockGetAdminDb = vi.fn();
const mockAuthGoogleUid = vi.fn();
const mockCheckRateLimitShared = vi.fn();
const mockGetRequestIp = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => mockGetAdminDb(),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  checkRateLimitShared: (...args: unknown[]) => mockCheckRateLimitShared(...args),
  getRequestIp: (...args: unknown[]) => mockGetRequestIp(...args),
}));

vi.mock('@/lib/api-auth', () => ({
  authGoogleUid: () => mockAuthGoogleUid(),
}));

interface ReportRecord {
  userId: string;
  text: string | null;
  createdAt: number;
}

interface State {
  postStatus: string;
  reports: Map<string, ReportRecord>;
}

function makeDb(state: State) {
  const doc = (collection: string, id: string) => {
    const reportsRef = collection === 'posts'
      ? {
          doc: (reportId: string) => ({
            get: async () => {
              const r = state.reports.get(reportId);
              return { exists: !!r, data: () => r ?? ({} as ReportRecord) };
            },
            set: async (v: ReportRecord) => {
              state.reports.set(reportId, v);
            },
          }),
          get: async () => ({
            docs: Array.from(state.reports.values()).map((r) => ({ data: () => r })),
          }),
        }
      : undefined;
    return {
      get: async () => ({
        exists: true,
        data: () => ({ status: state.postStatus }),
      }),
      collection: (name: string) => {
        if (name !== 'reports' || !reportsRef) throw new Error('unexpected collection: ' + name);
        return reportsRef;
      },
      set: async (v: Record<string, unknown>) => {
        if (collection === 'posts') {
          state.postStatus = (v.status as string) ?? state.postStatus;
        }
        void id;
      },
    };
  };
  return {
    collection: (name: string) => ({ doc: (id: string) => doc(name, id) }),
  } as unknown as ReturnType<typeof mockGetAdminDb>;
}

function makeRequest(body: string): NextRequest {
  return new NextRequest('https://razin.test/api/posts/post-id/report', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  });
}

function freshState(): State {
  return { postStatus: 'open', reports: new Map() };
}

beforeEach(() => {
  mockAuthGoogleUid.mockReset();
  mockCheckRateLimitShared.mockResolvedValue({ allowed: true, retryAfterMs: 0 });
  mockGetRequestIp.mockReturnValue('1.2.3.4');
});

describe('POST /api/posts/[id]/report — شرط جوجل + عتبة البلاغين', () => {
  it('يرفض معرّف مركّب (a/b) بـ 400', async () => {
    const req = new NextRequest('https://razin.test/api/posts/a%2Fb/report', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'a/b' }) });
    expect(res.status).toBe(400);
  });

  it('يرفض بلا هوية جوجل (مجهولة أو معدومة) بـ 401', async () => {
    mockAuthGoogleUid.mockResolvedValue(null);
    mockGetAdminDb.mockReturnValue(makeDb(freshState()));
    const res = await POST(makeRequest(JSON.stringify({})), { params: Promise.resolve({ id: 'p1' }) });
    expect(res.status).toBe(401);
    expect(mockGetAdminDb).not.toHaveBeenCalled();
  });

  it('يحدّ الطلب بـ 429 عند استنفاد الحصة', async () => {
    mockAuthGoogleUid.mockResolvedValue('g-1');
    mockCheckRateLimitShared.mockResolvedValue({ allowed: false, retryAfterMs: 5000 });
    mockGetAdminDb.mockReturnValue(makeDb(freshState()));
    const res = await POST(makeRequest(JSON.stringify({})), { params: Promise.resolve({ id: 'p1' }) });
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('5');
  });

  it('يرفض سببًا أطول من 200 حرف بـ 400', async () => {
    mockAuthGoogleUid.mockResolvedValue('g-1');
    mockGetAdminDb.mockReturnValue(makeDb(freshState()));
    const res = await POST(makeRequest(JSON.stringify({ text: 'x'.repeat(201) })), {
      params: Promise.resolve({ id: 'p1' }),
    });
    expect(res.status).toBe(400);
  });

  it('يرجع 404 لمنشور مخفي — لا يُبلَّغ منشور غير ظاهر', async () => {
    mockAuthGoogleUid.mockResolvedValue('g-1');
    const state = freshState();
    state.postStatus = 'hidden';
    mockGetAdminDb.mockReturnValue(makeDb(state));
    const res = await POST(makeRequest(JSON.stringify({})), { params: Promise.resolve({ id: 'p1' }) });
    expect(res.status).toBe(404);
  });

  it('البلاغ الأول: ok=true, hidden=false, reported=true (إشارة للأدمن فقط)', async () => {
    mockAuthGoogleUid.mockResolvedValue('g-1');
    const state = freshState();
    mockGetAdminDb.mockReturnValue(makeDb(state));
    const res = await POST(makeRequest(JSON.stringify({ text: 'محتوى مخالف' })), {
      params: Promise.resolve({ id: 'p1' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, hidden: false });
    expect(state.reports.size).toBe(1);
    expect(state.postStatus).toBe('open');
  });

  it('بلاغان من حسابين مختلفين ⇒ hide فوري (status=hidden, reported=true)', async () => {
    mockAuthGoogleUid.mockResolvedValue('g-2');
    const state = freshState();
    state.reports.set('g-1', { userId: 'g-1', text: null, createdAt: 1 });
    mockGetAdminDb.mockReturnValue(makeDb(state));
    const res = await POST(makeRequest(JSON.stringify({})), { params: Promise.resolve({ id: 'p1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, hidden: true });
    expect(state.postStatus).toBe('hidden');
    expect(state.reports.size).toBe(2);
  });

  it('نفس الحساب لا يُعدّ مرتين (alreadyReported) ولا يصل للعتبة بنفسه', async () => {
    mockAuthGoogleUid.mockResolvedValue('g-1');
    const state = freshState();
    state.reports.set('g-1', { userId: 'g-1', text: null, createdAt: 1 });
    mockGetAdminDb.mockReturnValue(makeDb(state));
    const res = await POST(makeRequest(JSON.stringify({})), { params: Promise.resolve({ id: 'p1' }) });
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, alreadyReported: true });
    expect(state.postStatus).toBe('open');
  });
});