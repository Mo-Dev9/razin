import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authUid, authGoogleUid } from '@/lib/api-auth';

const mockVerifyIdToken = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/lib/firebase-admin', () => ({
  getAdminAuth: () => ({
    verifyIdToken: (token: string) => mockVerifyIdToken(token),
    getUser: (uid: string) => mockGetUser(uid),
  }),
}));

beforeEach(() => {
  mockVerifyIdToken.mockReset();
  mockGetUser.mockReset();
});

function bearerOf(payload: unknown): string {
  return `Bearer token-${(payload as { uid: string }).uid}`;
}

function decoded(uid: string) {
  return { uid };
}

function userRecord(providerIds: string[]) {
  const uid = 'u-' + (providerIds.join('+') || 'none');
  return { uid, providerData: providerIds.map((providerId) => ({ providerId })) };
}

describe('authGoogleUid — هوية مؤكدة بجوجل (providerData فعلي)', () => {
  it('يعيد uid لحساب مرتبط بـ google.com (providerData)', async () => {
    mockVerifyIdToken.mockResolvedValue(decoded('g-1'));
    mockGetUser.mockResolvedValue(userRecord(['google.com']));
    expect(await authGoogleUid(bearerOf({ uid: 'g-1' }))).toBe('g-1');
    expect(mockGetUser).toHaveBeenCalledWith('g-1');
  });

  it('H4: جلسة anonymous لكن الحساب مربوط بجوجل ⇒ يُقبل — لا يرفض لاقتباس الزمن', async () => {
    mockVerifyIdToken.mockResolvedValue(decoded('anon-linked'));
    mockGetUser.mockResolvedValue(userRecord(['google.com', 'anonymous']));
    expect(await authGoogleUid('Bearer anon-linked-token')).toBe('anon-linked');
  });

  it('يُرجع null لحساب مجهول بالكامل (بلا جوجل)', async () => {
    mockVerifyIdToken.mockResolvedValue(decoded('anon-1'));
    mockGetUser.mockResolvedValue(userRecord(['anonymous']));
    expect(await authGoogleUid('Bearer anon-token')).toBeNull();
  });

  it('يُرجع null لحساب موفّر آخر (غير جوجل)', async () => {
    mockVerifyIdToken.mockResolvedValue(decoded('t-1'));
    mockGetUser.mockResolvedValue(userRecord(['twitter.com']));
    expect(await authGoogleUid(bearerOf({ uid: 't-1' }))).toBeNull();
  });

  it('يُرجع null لحساب بلا providerData إطلاقًا', async () => {
    mockVerifyIdToken.mockResolvedValue(decoded('empty-1'));
    mockGetUser.mockResolvedValue({ uid: 'empty-1', providerData: [] });
    expect(await authGoogleUid('Bearer empty-token')).toBeNull();
  });

  it('يُرجع null عند غياب رأس Authorization كليًا (لا يحصل على المستخدم)', async () => {
    mockVerifyIdToken.mockResolvedValue(decoded('g-1'));
    mockGetUser.mockResolvedValue(userRecord(['google.com']));
    expect(await authGoogleUid(null)).toBeNull();
    expect(await authGoogleUid('')).toBeNull();
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('يُرجع null عند رمز غير صالح (رفض الفك)', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('invalid token'));
    expect(await authGoogleUid('Bearer broken')).toBeNull();
  });

  it('يُرجع null عند فشل getUser (حساب محذوف بين الفكين)', async () => {
    mockVerifyIdToken.mockResolvedValue(decoded('g-1'));
    mockGetUser.mockRejectedValue(new Error('not found'));
    expect(await authGoogleUid('Bearer g-token')).toBeNull();
  });
});

describe('authUid — أي هوية (بما فيها المجهولة)', () => {
  it('يُرجع uid لأي هوية صالحة (مجهولة أو غيرها)', async () => {
    mockVerifyIdToken.mockResolvedValue(decoded('anon-2'));
    expect(await authUid('Bearer t')).toBe('anon-2');
    mockVerifyIdToken.mockResolvedValue(decoded('g-2'));
    expect(await authUid('Bearer t2')).toBe('g-2');
  });

  it('يُرجع null عند رمز معطوب أو غائب', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('boom'));
    expect(await authUid('Bearer bad')).toBeNull();
    expect(await authUid(undefined)).toBeNull();
  });
});