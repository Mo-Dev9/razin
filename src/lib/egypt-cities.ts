export interface EgyptCity {
  name: string;
  lat: number;
  lng: number;
}

const CITIES: EgyptCity[] = [
  { name: 'القاهرة', lat: 30.0444, lng: 31.2357 },
  { name: 'الجيزة', lat: 30.0131, lng: 31.2089 },
  { name: 'الإسكندرية', lat: 31.2001, lng: 29.9187 },
  { name: 'الدقهلية', lat: 31.036, lng: 31.38 },
  { name: 'البحيرة', lat: 31.0409, lng: 30.4685 },
  { name: 'الشرقية', lat: 30.5873, lng: 31.5029 },
  { name: 'كفر الشيخ', lat: 31.1119, lng: 30.94 },
  { name: 'الغربية', lat: 30.7871, lng: 31.0019 },
  { name: 'المنوفية', lat: 30.5539, lng: 31.0096 },
  { name: 'القليوبية', lat: 30.462, lng: 31.1844 },
  { name: 'بني سويف', lat: 29.0661, lng: 31.0998 },
  { name: 'الفيوم', lat: 29.3068, lng: 30.8418 },
  { name: 'المنيا', lat: 28.0877, lng: 30.7353 },
  { name: 'أسيوط', lat: 27.1783, lng: 31.1859 },
  { name: 'سوهاج', lat: 26.5569, lng: 31.6948 },
  { name: 'قنا', lat: 26.1644, lng: 32.7271 },
  { name: 'الأقصر', lat: 25.6872, lng: 32.6396 },
  { name: 'أسوان', lat: 24.0889, lng: 32.8998 },
  { name: 'البحر الأحمر', lat: 27.2574, lng: 33.8116 },
  { name: 'الوادي الجديد', lat: 25.495, lng: 30.557 },
  { name: 'مطروح', lat: 31.3541, lng: 27.2373 },
  { name: 'شمال سيناء', lat: 31.1318, lng: 33.7984 },
  { name: 'جنوب سيناء', lat: 28.2418, lng: 33.6225 },
  { name: 'بورسعيد', lat: 31.2565, lng: 32.2841 },
  { name: 'الإسماعيلية', lat: 30.6109, lng: 32.2722 },
  { name: 'السويس', lat: 29.9668, lng: 32.5498 },
  { name: 'دمياط', lat: 31.4175, lng: 31.8144 },
];

function normalize(name: string): string {
  return name
    .replace(/محافظة/g, '')
    .replace(/مدينة/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ال/g, '')
    .replace(/[^\u0600-\u06FF]/g, '')
    .trim();
}

const CITY_BY_NAME = new Map<string, EgyptCity>();
for (const city of CITIES) {
  CITY_BY_NAME.set(normalize(city.name), city);
}

export const EGYPT_CITIES: readonly EgyptCity[] = CITIES;

export function findCityCenter(name: string): { lat: number; lng: number } | null {
  const city = CITY_BY_NAME.get(normalize(name));
  return city ? { lat: city.lat, lng: city.lng } : null;
}

export function matchCityName(parts: string[]): string | null {
  for (const part of parts) {
    if (!part) continue;
    const city = CITY_BY_NAME.get(normalize(part));
    if (city) return city.name;
  }
  return null;
}