export interface LocationParts {
  governorate?: string | null;
  city?: string;
  area?: string;
}

export function buildingLocationLabel(b: LocationParts): string {
  const governorate = b.governorate?.trim();
  const city = b.city?.trim();
  const area = b.area?.trim();

  if (governorate) return [governorate, city || ''].filter(Boolean).join('، ');
  if (city) return city;
  return area || '';
}