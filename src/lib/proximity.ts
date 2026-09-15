import { EGYPT_GOVERNORATES } from '@/lib/egypt-cities';

/**
 * منطق «صوت الحارة» المرتبط بالموقع: هل السؤال/المشاركة قريبة من المستخدم؟
 * الفكرة (§رؤية المنتج): بجانب السؤال تُعرض جهة المُرسل إذا كان ضمن مدى القرب،
 * وإلا «بعيد» فقط — لا عنوان ولا موقع دقيق لأي من الطرفين.
 */

/** مدى القرب الافتراضي بالكيلومتر — قابل للضبط من هنا. */
export const NEAR_KM = 5;

/** أقصى نصف قطر لتسمية المنطقة القريبة من الإحداثيات (حوالي تقريبية من egypt-cities). */
const LABEL_RADIUS_KM = 10;

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** مسافة «الطائر» (Haversine) بين نقطتين بالكيلومترات. */
export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** هل النقطة ب (مؤلف السؤال) ضمن مدى القرب من النقطة أ (المستخدم)؟ */
export function isNearKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
  nearKm: number = NEAR_KM
): boolean {
  return haversineKm(aLat, aLng, bLat, bLng) <= nearKm;
}

/**
 * يسمّي أقرب منطقة معروفة للإحداثيات من جدول egypt-cities (تقريبي).
 * يعيد null إذا كانت الإحداثيات أبعد من LABEL_RADIUS_KM عن أي مكان معروف
 * (مثلًا إحداثيات في الخارج أو بلا موضع) — عندها نعرض «قريب منك» فقط.
 */
export function nearestPlaceName(lat: number, lng: number): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const gov of EGYPT_GOVERNORATES) {
    for (const place of gov.places) {
      const d = haversineKm(lat, lng, place.lat, place.lng);
      if (d < bestDist) {
        bestDist = d;
        best = place.name;
      }
    }
  }
  return best && bestDist <= LABEL_RADIUS_KM ? best : null;
}

/**
 * تسمية قرب السؤال لعارضه: يخزن الموجِد — هل المُرسل قريب من المستخدم؟
 * القاعدة: بدون إحداثيات ⇒ «بعيد» (لا نكشف شيئًا). بعيد ⇒ «بعيد» فقط.
 * قريب ⇒ نكشف اسم الحي (area) المحفوظة عند الإرسال أو «قريب منك».
 */
export function proximityLabel(
  userLat: number,
  userLng: number,
  q: { lat?: number | null; lng?: number | null; area?: string | null }
): { kind: 'near' | 'far' | 'unknown'; label: string } {
  if (q.lat == null || q.lng == null) return { kind: 'unknown', label: 'بعيد' };
  const near = isNearKm(userLat, userLng, q.lat, q.lng, NEAR_KM);
  return near
    ? { kind: 'near', label: q.area ? `قريب · ${q.area}` : 'قريب منك' }
    : { kind: 'far', label: 'بعيد' };
}