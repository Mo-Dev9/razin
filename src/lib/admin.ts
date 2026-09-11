import { cookies } from 'next/headers';
import { adminSessionValue, isAdminSession } from '@/lib/session-token';

export { adminSessionValue };

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return isAdminSession(cookieStore.get('admin_session')?.value);
}