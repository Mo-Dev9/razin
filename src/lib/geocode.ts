export interface ReverseGeocodeResult {
  city: string | null;
  area: string | null;
}

export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  try {
    const res = await fetch(`/api/geocode?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`);
    if (!res.ok) return { city: null, area: null };
    const data = (await res.json()) as Partial<ReverseGeocodeResult>;
    return { city: data.city ?? null, area: data.area ?? null };
  } catch {
    return { city: null, area: null };
  }
}