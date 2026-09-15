import type { Firestore } from 'firebase-admin/firestore';
import { computePriceStats, MIN_DISPLAY_SOURCES } from '@/lib/price-stats';

/**
 * كاتب الرسم الهرمي لبيانات الأحياء: neighborhoods/{id} مستند وحدة التجميع
 * (خلاصة إحصاءات الحي المُخفّاة)، وتحته subcollections listings (إعلانات السعر)
 * و questions («صوت الحارة»). كل الكتابات من السيرفر عبر Admin SDK فقط.
 */

export function neighborhoodDocRef(db: Firestore, neighborhoodId: string) {
  return db.collection('neighborhoods').doc(neighborhoodId);
}

export function neighborhoodListingsRef(db: Firestore, neighborhoodId: string) {
  return neighborhoodDocRef(db, neighborhoodId).collection('listings');
}

/**
 * هل هذا الإعلان يمثل «إيجارًا شهريًا» يدخل في وسيط الحي؟
 * القاعدة: شهري فقط (أو بلا تردد معلن = يُفترض شهري). إيجارات
 * اليومي/الأسبوعي/السنوي مستثناة — مكتب اليومي (روف/شاليه مفروش) سوق
 * مختلف لا يلوّث متوسط إيجار السكن الشهري.
 */
export function isMonthlyListing(data: { rentalFrequency?: string | null }): boolean {
  const f = data.rentalFrequency ?? null;
  return f === null || f === 'monthly';
}

export interface NeighborhoodMetaInput {
  city?: string;
  governorate?: string;
}

/**
 * يعيد حساب خلاصة الحي من صفر من كل إعلاناته النشطة ويحدّث مستند
 * neighborhoods/{id} (نمط الوسيط/النطاق §5.3 + حالة readiness). يُستدعى
 * بعد كل إضافة/حذف إعلان أو دفعة زحف حتى تبقى قراءات الواجهة O(1).
 */
export async function recomputeNeighborhoodMeta(
  db: Firestore,
  neighborhoodId: string,
  info: NeighborhoodMetaInput = {}
) {
  const snap = await neighborhoodListingsRef(db, neighborhoodId).where('status', '==', 'active').get();
  const stats = computePriceStats(
    snap.docs
      .map((d) => d.data() as { price?: unknown; rentalFrequency?: string | null })
      .filter((d) => isMonthlyListing(d))
      .map((d) => ({ price: Number(d.price) }))
  );
  const meta = {
    city: info.city ?? null,
    governorate: info.governorate ?? null,
    count: stats.count,
    min: stats.min,
    median: stats.median,
    max: stats.max,
    p25: stats.p25,
    p75: stats.p75,
    ready: stats.count >= MIN_DISPLAY_SOURCES,
    lastUpdated: Date.now(),
  };
  if (stats.count === 0) {
    // لا مستندات بلا بيانات — يُحذف مستند الحي تلقائيًا (خلق كسول بـ lazily).
    await neighborhoodDocRef(db, neighborhoodId).delete().catch(() => {});
    return null;
  }
  await neighborhoodDocRef(db, neighborhoodId).set(meta, { merge: true });
  return meta;
}