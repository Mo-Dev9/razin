import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { matchLocation } from '@/lib/egypt-cities';

export const dynamic = 'force-dynamic';

interface GeoResult {
  governorate: string | null;
  city: string | null;
  area: string | null;
}

const cache = new Map<string, GeoResult>();

function getRequestIp(req: Request): string {
  return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
}

export async function GET(req: Request) {
  const ip = getRequestIp(req);
  const { allowed, retryAfterMs } = checkRateLimit(`geocode:${ip}`, 300, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const { searchParams } = new URL(req.url);
  const latRaw = searchParams.get('lat');
  const lngRaw = searchParams.get('lng');

  if (latRaw === null || lngRaw === null) {
    return NextResponse.json({ error: 'إحداثيات ناقصة' }, { status: 400 });
  }

  const lat = Number(latRaw);
  const lng = Number(lngRaw);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: 'إحداثيات غير صالحة' }, { status: 400 });
  }

  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&accept-language=ar&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RentRate/0.1 (https://github.com/Mo-Dev9/rentrate)',
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`Nominatim responded with ${res.status}`);

    const data = (await res.json()) as { address?: Record<string, string> };
    const address = data.address ?? {};

    const located = matchLocation([
      address.state,
      address.county,
      address.city,
      address.town,
      address.village,
    ]);

    let area =
      address.suburb ||
      address.residential ||
      address.neighbourhood ||
      address.district ||
      address.town ||
      address.county ||
      address.city ||
      '';

    if (located.city && area === located.city) area = '';
    if (located.governorate && !located.city && area === located.governorate) area = '';

    const result: GeoResult = {
      governorate: located.governorate,
      city: located.city,
      area: area || null,
    };

    cache.set(cacheKey, result);
    if (cache.size > 200) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) cache.delete(oldestKey);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Geocode failed:', err);
    return NextResponse.json({ city: null, area: null });
  }
}