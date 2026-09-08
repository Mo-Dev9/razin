import type { Building } from '@/types';
import { normalizeSearchText } from '@/lib/egypt-cities';

export function matchesBuildingSearch(building: Building, query: string): boolean {
  const nq = normalizeSearchText(query);
  if (!nq) return false;
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