import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const { allowed, retryAfterMs } = checkRateLimit(`reviews:${ip}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  try {
    const db = getAdminDb();

    const reviewsSnapshot = await db
      .collectionGroup('reviews')
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();

    const reviews = await Promise.all(
      reviewsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        let building: { address?: string; city?: string; area?: string; district?: string } = {};

        try {
          const buildingDoc = await db.collection('buildings').doc(data.buildingId).get();
          if (buildingDoc.exists) {
            building = buildingDoc.data() as { address?: string; city?: string; area?: string; district?: string };
          }
        } catch {
          // Building may have been deleted
        }

        return {
          id: doc.id,
          buildingId: data.buildingId,
          overall: data.overall,
          comment: data.comment || '',
          createdAt: data.createdAt,
          building: {
            address: building.address || 'بلا عنوان',
            city: building.city || '',
            area: building.area || '',
            district: building.district || '',
          },
        };
      })
    );

    return NextResponse.json({ reviews });
  } catch (err) {
    console.error('Get latest reviews failed:', err);
    return NextResponse.json({ reviews: [] });
  }
}
