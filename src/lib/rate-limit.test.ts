import { describe, it, expect } from 'vitest';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

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