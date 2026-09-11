import { describe, it, expect, vi, afterEach } from 'vitest';
import { adminSessionValue, isAdminSession } from '@/lib/session-token';

describe('admin session token', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('derives a stable value from the admin password', () => {
    vi.stubEnv('ADMIN_PASSWORD', 'secret-1');
    const first = adminSessionValue();
    vi.stubEnv('ADMIN_PASSWORD', 'secret-1');
    expect(adminSessionValue()).toBe(first);
  });

  it('derives a different value when the password changes', () => {
    vi.stubEnv('ADMIN_PASSWORD', 'secret-1');
    const first = adminSessionValue();
    vi.stubEnv('ADMIN_PASSWORD', 'secret-2');
    expect(adminSessionValue()).not.toBe(first);
  });

  it('rejects missing, empty, or wrong cookies and accepts the exact value', () => {
    vi.stubEnv('ADMIN_PASSWORD', 'secret-1');
    expect(isAdminSession(undefined)).toBe(false);
    expect(isAdminSession('')).toBe(false);
    expect(isAdminSession('not-the-value')).toBe(false);
    expect(isAdminSession(adminSessionValue())).toBe(true);
  });

  it('rejects a value computed under a different password', () => {
    vi.stubEnv('ADMIN_PASSWORD', 'secret-1');
    const other = adminSessionValue();
    vi.stubEnv('ADMIN_PASSWORD', 'secret-2');
    expect(isAdminSession(other)).toBe(false);
  });
});