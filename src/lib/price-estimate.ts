import { computePriceStats, MIN_FILTER_SOURCES, type PriceStats } from '@/lib/price-stats';

/**
 * تقدير سعر بالإيجار الحقيقي حسب عدد الغرف/الحمامات مع بدائل أذكية:
 * إذا لم توجد عينات تطابق المواصفات حرفيًا (مثل فيلّا 6 غرف أو حمّامان)،
 * لا نردّ بـ«لا يوجد» — ننزل درجة تراخٍ واحدة في كل مرة حتى نجد أقرب
 * مجموعة بيانات متاحة (غرفها + نوعها ← حمّاماتها + نوعها ← كل إعلانات الحي)
 * ونوضّح للمستخدم هذا الأساس بدلًا من ترك خانة فارغة.
 *
 * حارس الكفاية: مراحل التراخي (rooms/baths) لا تُقبل إلا بعدد عينات
 * ≥ MIN_FILTER_SOURCES. عينة واحدة من إعلان غرف3 حمّامين أما غرفتان
 * فتُعرض كأنها الجواب (فيصل: ‏13000 من بين 1) — وسيط مستودع من عينة
 * وحيدة خادع، فننزل للمرحلة الأوسع (قرار «الصحة فوق السرعة»). المطابقة
 * الحرفية exact تبقى أولوية حتى بعينة واحدة (تنبيه «عينات محدودة» يظهر
 * جانبًا) وall ملاذ أخير دائم.
 */

export type EstimateBasis = 'exact' | 'rooms' | 'baths' | 'all';

export interface EstimateFilters {
  rooms: number | null;
  bathrooms: number | null;
  propertyType?: string | null;
  furnished?: boolean | null;
}

export interface EstimateResult {
  stats: PriceStats;
  basis: EstimateBasis;
}

export function roomsMatch(rooms: number | null | undefined, sel: number | null): boolean {
  if (rooms == null) return false;
  if (sel === null) return true;
  if (sel === 6) return rooms >= 6;
  return rooms === sel;
}

export function bathsMatch(bathrooms: number | null | undefined, sel: number | null): boolean {
  if (bathrooms == null) return false;
  if (sel === null) return true;
  if (sel === 4) return bathrooms >= 4;
  return bathrooms === sel;
}

interface EstimableListing {
  rooms?: number | null;
  bathrooms?: number | null;
  propertyType?: string | null;
  furnished?: boolean | null;
  price: number;
}

export function typeMatch(propertyType: string | null | undefined, sel: string | null | undefined): boolean {
  if (sel == null || sel === '') return true;
  return propertyType === sel;
}

export function furnishedMatch(furnished: boolean | null | undefined, sel: boolean | null): boolean {
  if (sel == null) return true;
  return furnished === sel;
}

export function estimatePriceFromListings(
  listings: EstimableListing[],
  filters: EstimateFilters
): EstimateResult {
  const { rooms, bathrooms, propertyType = null, furnished = null } = filters;
  const stages: Array<{ basis: EstimateBasis; set: EstimableListing[] }> = [
    {
      basis: 'exact',
      set: listings.filter(
        (l) =>
          roomsMatch(l.rooms, rooms) &&
          bathsMatch(l.bathrooms, bathrooms) &&
          typeMatch(l.propertyType, propertyType) &&
          furnishedMatch(l.furnished, furnished)
      ),
    },
    {
      basis: 'rooms',
      set: listings.filter(
        (l) => roomsMatch(l.rooms, rooms) && typeMatch(l.propertyType, propertyType) && furnishedMatch(l.furnished, furnished)
      ),
    },
    {
      basis: 'baths',
      set: listings.filter(
        (l) => bathsMatch(l.bathrooms, bathrooms) && typeMatch(l.propertyType, propertyType) && furnishedMatch(l.furnished, furnished)
      ),
    },
    { basis: 'all', set: listings },
  ];

  for (const stage of stages) {
    const stats = computePriceStats(stage.set);
    if (stats.count > 0) {
      if (stage.basis === 'exact' || stage.basis === 'all' || stats.count >= MIN_FILTER_SOURCES) {
        return { stats, basis: stage.basis };
      }
    }
  }
  return { stats: computePriceStats([]), basis: 'all' };
}