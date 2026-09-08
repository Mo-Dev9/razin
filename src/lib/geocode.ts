export interface ReverseGeocodeResult {
  governorate: string | null;
  city: string | null;
  area: string | null;
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  try {
    const res = await fetch(`/api/geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
    if (!res.ok) return { governorate: null, city: null, area: null };
    const data = (await res.json()) as Partial<ReverseGeocodeResult>;
    return {
      governorate: data.governorate ?? null,
      city: data.city ?? null,
      area: data.area ?? null,
    };
  } catch {
    return { governorate: null, city: null, area: null };
  }
}