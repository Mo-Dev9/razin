import { EGYPT_GOVERNORATES, normalizeSearchText } from '@/lib/egypt-cities';
import { neighborhoodKey } from '@/lib/listing-utils';

/**
 * بحث الأحياء/المدن في الصفحة الرئيسية (§7.2). يبحث في جدول egypt-cities
 * الرسمي (كل المحافظات) بمطابقة جزئية بعد التوحيد النصي: همزات/تاء مربوطة/
 * ألف مقصورة، ويقهر الأسماء المتكررة عبر محافظات بلاحقة المحافظة في المعرّف.
 * خالص (Pure) → يعمل في الـ client بلا طلب شبكة، وقابل مسبقًا لاختبارات سلوكية.
 */

export interface NeighborhoodSearchResult {
  name: string;
  governorate: string;
  neighborhoodId: string;
}

interface Scored extends NeighborhoodSearchResult {
  score: number;
}

export function neighborhoodSearchResults(query: string, limit = 8): NeighborhoodSearchResult[] {
  const q = normalizeSearchText(query);
  if (!q) return [];
  const scored: Scored[] = [];
  for (const gov of EGYPT_GOVERNORATES) {
    for (const place of gov.places) {
      const norm = normalizeSearchText(place.name);
      if (!norm.includes(q)) continue;
      let score = 1;
      if (norm === q) score = 100;
      else if (norm.startsWith(q)) score = 60;
      scored.push({
        name: place.name,
        governorate: gov.name,
        neighborhoodId: neighborhoodKey(place.name, gov.name),
        score,
      });
    }
  }
  scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'ar'));
  return scored
    .slice(0, limit)
    .map(
      (r): NeighborhoodSearchResult => ({
        name: r.name,
        governorate: r.governorate,
        neighborhoodId: r.neighborhoodId,
      })
    );
}

/** عكس المفتاح: يعيد الاسم الظاهر لصفحة الحي (لا يعتمد على مستند البيانات). */
export function placeByNeighborhoodId(
  neighborhoodId: string
): { name: string; governorate: string } | null {
  for (const gov of EGYPT_GOVERNORATES) {
    for (const place of gov.places) {
      if (neighborhoodKey(place.name, gov.name) === neighborhoodId) {
        return { name: place.name, governorate: gov.name };
      }
    }
  }
  return null;
}