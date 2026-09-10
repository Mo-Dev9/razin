import { cookies } from 'next/headers';
import { createHash, timingSafeEqual } from 'crypto';

// قيمة الجلسة مشتقة من كلمة مرور الأدمن السرية — لا يمكن تزويرها بدون معرفة السر،
// على عكس القيمة الثابتة السابقة («authenticated») التي كان أي عميل يمكنه انتحالها.
export function adminSessionValue(): string {
  const password = process.env.ADMIN_PASSWORD || '';
  return createHash('sha256').update(`razin-admin-session:${password}`).digest('hex');
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session) return false;
  const expected = adminSessionValue();
  if (!expected) return false;
  const a = Buffer.from(session.value);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}