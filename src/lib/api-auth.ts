import { getAdminAuth } from '@/lib/firebase-admin';

/**
 * يكشف «رمز الهوية المجهولة» (Firebase anonymous) من Authorization Bearer —
 * يعيد uid أو null (لا رمز أو رمز غير صالح). القرارات في الروتا: قد يكون uid
 * شرطيًا (قراءة عامة) أو إلزاميًا (كتابة في 401).
 */
export async function authUid(authHeader: string | null | undefined): Promise<string | null> {
  const header = authHeader ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

/**
 * هوية **مؤكدة بجوجل** (قرار الإبلاغ ٥): يعيد uid فقط إن كان الحساب مرتبطًا
 * بمزوّد google.com فعلًا. التحقق من `providerData` عبر Admin SDK (وليس ادعاء
 * `sign_in_provider` في الرمز) لأن حسابًا مجهولًا رُبِط بجوجل تبقى جلسته
 * `anonymous` أحيانًا — المصدر الموثوق هو سجل الحساب في Identity Platform.
 */
export async function authGoogleUid(authHeader: string | null | undefined): Promise<string | null> {
  const header = authHeader ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const record = await getAdminAuth().getUser(decoded.uid);
    const linkedGoogle = (record.providerData ?? []).some((p) => p.providerId === 'google.com');
    return linkedGoogle ? decoded.uid : null;
  } catch {
    return null;
  }
}