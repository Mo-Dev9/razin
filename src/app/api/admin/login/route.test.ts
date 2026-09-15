import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

const mockCheckRateLimit = vi.fn();
const mockCheckRateLimitShared = vi.fn();
const mockResetRateLimit = vi.fn();
const mockResetRateLimitShared = vi.fn();
const mockGetRequestIp = vi.fn();
const mockAdminSessionValue = vi.fn();

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  checkRateLimitShared: (...args: unknown[]) => mockCheckRateLimitShared(...args),
  resetRateLimit: (...args: unknown[]) => mockResetRateLimit(...args),
  resetRateLimitShared: (...args: unknown[]) => mockResetRateLimitShared(...args),
  getRequestIp: (...args: unknown[]) => mockGetRequestIp(...args),
}));

vi.mock('@/lib/admin', () => ({
  adminSessionValue: () => mockAdminSessionValue(),
}));

function makeRequest(body: string, ip: string): NextRequest {
  return new NextRequest('https://razin.test/api/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body,
  });
}

beforeEach(() => {
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfterMs: 0 });
  mockCheckRateLimitShared.mockResolvedValue({ allowed: true, retryAfterMs: 0 });
  mockResetRateLimitShared.mockResolvedValue(undefined);
  mockGetRequestIp.mockReturnValue('1.2.3.4');
  mockAdminSessionValue.mockReturnValue('session-hash-value');
  process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-admin-password';
});

describe('POST /api/admin/login', () => {
  it('يرفض payload بخاصية password غير نصية (كائن) بـ 400 لا 500', async () => {
    const res = await POST(makeRequest(JSON.stringify({ password: { not: 'a string' } }), '1.2.3.4'));
    expect(res.status).toBe(400);
  });

  it('يرفض password فارغ/كمية فراغ بـ 400', async () => {
    for (const body of [JSON.stringify({ password: '' }), JSON.stringify({}), JSON.stringify({ password: '   ' })]) {
      const res = await POST(makeRequest(body, '1.2.3.4'));
      expect(res.status).toBe(400);
    }
  });

  it('يحسب مفتاح الحصة من آخر قيمة XFF (لا الأولى المزورة)', async () => {
    mockGetRequestIp.mockReturnValue('9.9.9.9');
    const res = await POST(makeRequest(JSON.stringify({ password: 'wrong' }), '1.1.1.1, 9.9.9.9'));
    expect(res.status).toBe(401);
    expect(mockGetRequestIp).toHaveBeenCalledTimes(1);
  });

  it('يرد 429 عند استنفاد الحصة دون أي تعرّض لخوارزمية كلمة المرور', async () => {
    mockCheckRateLimitShared.mockResolvedValue({ allowed: false, retryAfterMs: 60000 });
    const res = await POST(makeRequest(JSON.stringify({ password: 'x' }), '1.2.3.4'));
    expect(res.status).toBe(429);
  });
});