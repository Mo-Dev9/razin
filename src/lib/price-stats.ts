/**
 * إحصاءات أسعار حي واحد حسب §5.3: أقل/وسيط/أعلى + النطاق الأكثر شيوعًا (25%–75%).
 * نستخدم الوسيط لا المعدل حتى لا يحرك إعلان شاذ النتيجة. الوسيط هو الرقم الذي
 * يقع في المنتصف بعد الترتيب — نصف الإعلانات أقل منه ونصفها أعلى.
 */

export interface PriceStatsInput {
  price: number;
}

export interface PriceStats {
  count: number;
  min: number | null;
  max: number | null;
  median: number | null;
  p25: number | null;
  p75: number | null;
}

/** أقل عدد إعلانات لعرض أرقام ملفتة (وسيط/أعلى/أقل) — أقل من ذلك «بيانات محدودة». */
export const MIN_DISPLAY_SOURCES = 10;

function percentile(sorted: number[], q: number): number {
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const lo = sorted[base] as number;
  const hi = (sorted[base + 1] as number | undefined) ?? lo;
  return lo + (hi - lo) * rest;
}

export function computePriceStats(inputs: PriceStatsInput[]): PriceStats {
  const prices = inputs
    .map((i) => i.price)
    .filter((p): p is number => typeof p === 'number' && Number.isFinite(p) && p > 0);

  if (prices.length === 0) {
    return { count: 0, min: null, max: null, median: null, p25: null, p75: null };
  }

  const sorted = [...prices].sort((a, b) => a - b);
  return {
    count: prices.length,
    min: sorted[0] as number,
    max: sorted[sorted.length - 1] as number,
    median: percentile(sorted, 0.5),
    p25: percentile(sorted, 0.25),
    p75: percentile(sorted, 0.75),
  };
}

/** هل نعرض أرقامًا فعلية أم «بيانات محدودة»؟ */
export function dataSufficient(count: number): boolean {
  return count >= MIN_DISPLAY_SOURCES;
}