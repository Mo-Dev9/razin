import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let body: { address?: string; city?: string; area?: string; district?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  const address = body.address?.trim();
  const city = body.city?.trim();
  const area = body.area?.trim();

  if (!address || !city || !area) {
    return NextResponse.json({ error: 'العنوان والمدينة والحي مطلوبين' }, { status: 400 });
  }

  if (address.length > 200 || city.length > 100 || area.length > 100) {
    return NextResponse.json({ error: 'البيانات أطول من المسموح' }, { status: 400 });
  }

  try {
    const db = getAdminDb();

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    try {
      const dupSnap = await db
        .collection('buildings')
        .where('address', '==', address)
        .where('city', '==', city)
        .where('area', '==', area)
        .where('createdAt', '>', oneDayAgo)
        .limit(1)
        .get();

      if (!dupSnap.empty) {
        return NextResponse.json({ buildingId: dupSnap.docs[0].id, duplicate: true });
      }
    } catch (dupErr) {
      console.warn('Duplicate detection query failed (continuing with create):', dupErr);
    }

    const docRef = await db.collection('buildings').add({
      address,
      city,
      area,
      district: body.district?.trim() || '',
      averageRatings: {
        zahma: 0,
        humidity: 0,
        landlord: 0,
        neighbors: 0,
        cleanliness: 0,
        safety: 0,
        services: 0,
        annoyance: 0,
        elevator: 0,
        maintenance: 0,
        ac: 0,
        overall: 0,
      },
      reviewCount: 0,
      createdAt: now,
      source: 'user',
    });

    return NextResponse.json({ buildingId: docRef.id });
  } catch (err) {
    console.error('Add building API failed:', err);
    return NextResponse.json({ error: 'فشل إضافة المبنى' }, { status: 500 });
  }
}
