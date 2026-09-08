import type { Building } from '@/types';
import { normalizeSearchText } from '@/lib/egypt-cities';

export function matchesBuildingSearch(building: Building, query: string): boolean {
  const nq = normalizeSearchText(query);
  // الاستعلام الفارغ/المسافات = «بلا قيد» → يطابق كل المبانٍ.
  // هذه هي نفس عقد سابق: «الصفحة الرئيسية» تستدعي searchBuildings('') للحصول على كل المباني
  // ثم تفلتر تقييمات السكان محليًا (HomePageInner) — لا يجب أن يفشل الاستعلام الفارغ.
  if (!nq) return true;
  const fields = [
    building.area,
    building.city,
    building.address,
    building.district,
    building.buildingNumber,
    building.floor,
    building.apartmentNumber,
  ].filter(Boolean).map((f) => normalizeSearchText(f!));
  return fields.some((f) => f.includes(nq));
}