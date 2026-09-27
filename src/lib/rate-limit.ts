/**
 * IP موثوق من الترويسات على النحو الآمن: نأخذ **آخر** قيمة في سلسلة
 * `x-forwarded-for` (يُلحقها الوكيل الموثوق — Vercel — بحيث تكون القيمة
 * الأخيرة هي الأصلية، ولا يمكن للعميل تقليدها بتزوير أول القيم).
 */
export function getRequestIp(headers: Pick<Headers, 'get'>): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return headers.get('x-real-ip')?.trim() || 'unknown';
}

const RATE_LIMIT_STORE = new Map<string, { count: number; resetAt: number }>();
const MAX_ENTRIES = 5000;

// Lazy pruning keeps the map bounded without a global interval that would
// keep serverless instances warm.
function pruneExpired(): void {
  if (RATE_LIMIT_STORE.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, entry] of RATE_LIMIT_STORE) {
    if (now > entry.resetAt) RATE_LIMIT_STORE.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  pruneExpired();
  const now = Date.now();
  let entry = RATE_LIMIT_STORE.get(key);

  if (entry && now > entry.resetAt) {
    RATE_LIMIT_STORE.delete(key);
    entry = undefined;
  }

  if (!entry) {
    RATE_LIMIT_STORE.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

export function resetRateLimit(key: string): void {
  RATE_LIMIT_STORE.delete(key);
}

/**
 * حدّ معدّل **مشترك عبر سياقات السيرفرلس** (قرار ٨) للمسارات الحساسة فقط
 * (admin/login، إنشاء منشور، تصويت، تعليق، إبلاغ): التخزين Firestore حتى لا
 * يلتفّ أحد بقتل السياق (كل طلب يبدأ عدّاده من صفر في الذاكرة المنفردة).
 * - `VERCEL=1`: عدّاد Firestore بمفتاح sha256 (لا وقع لرموز المسار).
 * - غير ذلك (محلي/اختبارات): fallback للذاكرة الحالية — قراءة المنطق نفسه.
 * الفشل المتوقع (انقطاع DB) لا يوقِف الطلب: يهبط للذاكرة (مرجح) بدل 500.
 */
export async function checkRateLimitShared(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  if (process.env.VERCEL !== '1') {
    return checkRateLimit(key, maxRequests, windowMs);
  }
  try {
    const { createHash } = await import('crypto');
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const docId = createHash('sha256').update(key).digest('hex');
    const ref = getAdminDb().collection('rateLimits').doc(docId);
    const now = Date.now();
    const snap = await ref.get();
    const data = snap.exists ? (snap.data() ?? null) : null;
    if (!data || (data.resetAt ?? 0) <= now) {
      await ref.set({ count: 1, resetAt: now + windowMs, createdKey: key });
      return { allowed: true, retryAfterMs: 0 };
    }
    const count = typeof data.count === 'number' ? data.count : 1;
    if (count >= maxRequests) {
      return { allowed: false, retryAfterMs: data.resetAt - now };
    }
    await ref.update({ count: count + 1 });
    return { allowed: true, retryAfterMs: 0 };
  } catch (err) {
    console.error('Shared rate limit error, falling back to memory:', err);
    return checkRateLimit(key, maxRequests, windowMs);
  }
}

/** مسح عدّاد مشارك بعد نجاح تسجيل دخول الأدمن (المرادف اللاخطي للـ resetRateLimit). */
export async function resetRateLimitShared(key: string): Promise<void> {
  if (process.env.VERCEL !== '1') {
    resetRateLimit(key);
    return;
  }
  try {
    const { createHash } = await import('crypto');
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const docId = createHash('sha256').update(key).digest('hex');
    await getAdminDb().collection('rateLimits').doc(docId).delete();
  } catch (err) {
    console.warn('Shared rate-limit reset failed:', err);
  }
}