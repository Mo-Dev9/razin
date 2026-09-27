import { describe, it, expect } from 'vitest';
import { checkRateLimit, checkRateLimitShared, resetRateLimit, getRequestIp } from '@/lib/rate-limit';

describe('getRequestIp — آخر قيمة موثوقة من XFF', () => {
  it('يأخذ آخر قيمة في السلسلة (الذي يُلحقه الوكيل الموثوق) لا أولها', () => {
    const head = new Headers({ 'x-forwarded-for': '10.0.0.1, 1.2.3.4' });
    expect(getRequestIp(head)).toBe('1.2.3.4');
  });

  it('يتجاهل القيم الفارغة والمسافات وينجح بترويسة واحدة', () => {
    expect(getRequestIp(new Headers({ 'x-forwarded-for': ' 8.8.8.8 ' }))).toBe('8.8.8.8');
    expect(getRequestIp(new Headers({ 'x-forwarded-for': ',,' }))).toBe('unknown');
  });

  it('يستعمل x-real-ip عند غياب x-forwarded-for', () => {
    expect(getRequestIp(new Headers({ 'x-real-ip': '9.9.9.9' }))).toBe('9.9.9.9');
    expect(getRequestIp(new Headers({}))).toBe('unknown');
  });
});

describe('checkRateLimit (in-memory sliding-fixed window)', () => {
  it('allows requests within the limit then blocks', () => {
    const key = `test-key-${Date.now()}`;
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    const blocked = checkRateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('treats different keys independently', () => {
    const keyA = `key-a-${Date.now()}`;
    const keyB = `key-b-${Date.now()}`;
    checkRateLimit(keyA, 1, 60_000); // exhaust A
    expect(checkRateLimit(keyA, 1, 60_000).allowed).toBe(false);
    expect(checkRateLimit(keyB, 1, 60_000).allowed).toBe(true);
  });

  it('opens a new window after expiry', () => {
    const key = `expiry-key-${Date.now()}`;
    checkRateLimit(key, 1, -1); // negative window means already expired
    expect(checkRateLimit(key, 1, -1).allowed).toBe(true);
  });

  it('resetRateLimit clears an exhausted key', () => {
    const key = `reset-key-${Date.now()}`;
    expect(checkRateLimit(key, 1, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 1, 60_000).allowed).toBe(false);
    resetRateLimit(key);
    expect(checkRateLimit(key, 1, 60_000).allowed).toBe(true);
  });
});

// checkRateLimitShared: خارج VERCEL (= محلي/اختبارات) يسلك سلوك الذاكرة نفسه —
// هذه التحويلات تؤكّد أن واجهة المسارات الحساسة (async) لا تكسر النمط الحالي.
describe('checkRateLimitShared (fallback محلي = نفس حد الذاكرة)', () => {
  it('يحسب على نفس مفتاح الذاكرة حتى عبر المسارات الحساسة', async () => {
    const key = `shared-local-${Date.now()}`;
    expect((await checkRateLimitShared(key, 2, 60_000)).allowed).toBe(true);
    expect((await checkRateLimitShared(key, 2, 60_000)).allowed).toBe(true);
    const blocked = await checkRateLimitShared(key, 2, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });
});