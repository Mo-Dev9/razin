import { createHash, timingSafeEqual } from 'crypto';

const SESSION_SALT = 'razin-admin-session:';

export function adminSessionValue(): string {
  const password = process.env.ADMIN_PASSWORD || '';
  return createHash('sha256').update(`${SESSION_SALT}${password}`).digest('hex');
}

export function isAdminSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const expected = adminSessionValue();
  if (!expected) return false;
  const a = Buffer.from(cookieValue);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}