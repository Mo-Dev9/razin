import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getNeighborhoodListings } from '@/lib/neighborhood-data';
import { isValidNeighborhoodId } from '@/lib/neighborhood-ids';

/**
 * جلب إعلانات حي واحد (نشطة فقط) — يغذّي جدول الإعلانات وصفحة الحاسبة §7.2.
 * GET /api/neighborhoods/listings?neighborhoodId=...
 * Query params: neighborhoodId (مطلوب)، limit (اختياري، بحد أقصى 300، افتراضي 100).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const neighborhoodId = searchParams.get('neighborhoodId');
  if (!neighborhoodId || !isValidNeighborhoodId(neighborhoodId)) {
    return NextResponse.json({ error: 'neighborhoodId مطلوب وصالح' }, { status: 400 });
  }
  const rawLimit = Number(searchParams.get('limit')) || 100;
  const limit = Math.max(1, Math.min(300, rawLimit));
  try {
    const db = getAdminDb();
    const listings = await getNeighborhoodListings(neighborhoodId, limit, db);
    return NextResponse.json({ listings, count: listings.length });
  } catch (err) {
    console.error('Neighborhood listings fetch failed:', err);
    return NextResponse.json({ error: 'تعذر تحميل إعلانات الحي' }, { status: 500 });
  }
}