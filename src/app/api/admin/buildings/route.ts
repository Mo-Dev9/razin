import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebase-admin';
import { encodeGeohash } from '@/lib/geohash';

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection('buildings').orderBy('createdAt', 'desc').get();
    const buildings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ buildings });
  } catch (err) {
    console.error('Admin get buildings failed:', err);
    return NextResponse.json({ error: 'فشل جلب البيانات' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let body: { buildingId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  const { buildingId } = body;
  if (!buildingId) {
    return NextResponse.json({ error: 'buildingId مطلوب' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const batch = db.batch();

    const reviewsSnap = await db.collection('reviews').where('buildingId', '==', buildingId).get();
    reviewsSnap.docs.forEach((doc) => batch.delete(doc.ref));

    const buildingRef = db.collection('buildings').doc(buildingId);
    batch.delete(buildingRef);

    await batch.commit();
    return NextResponse.json({ ok: true, deleted: reviewsSnap.size + 1 });
  } catch (err) {
    console.error('Admin delete building failed:', err);
    return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 });
  }
}

// Validate + normalize location, return { location, geohash } or throws a 400 NextResponse
function parseLocation(body: { location?: { lat?: number; lng?: number } }): { location: { lat: number; lng: number }; geohash: string } {
  const lat = typeof body.location?.lat === 'number' ? body.location.lat : null;
  const lng = typeof body.location?.lng === 'number' ? body.location.lng : null;
  if (
    lat === null ||
    lng === null ||
    !isFinite(lat) ||
    !isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    throw NextResponse.json({ error: 'الموقع على الخريطة مطلوب لضمان الدقة' }, { status: 400 });
  }
  return { location: { lat, lng }, geohash: encodeGeohash(lat, lng) };
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let body: {
    address?: string;
    city?: string;
    area?: string;
    district?: string;
    governorate?: string;
    buildingNumber?: string;
    floor?: string;
    apartmentNumber?: string;
    location?: { lat?: number; lng?: number };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

const address = body.address?.trim();
const city = body.city?.trim();
const area = body.area?.trim();
const governorate = body.governorate?.trim();

  if (!address || !city || !area) {
    return NextResponse.json({ error: 'العنوان والمدينة والحي مطلوبين' }, { status: 400 });
  }
  if (address.length > 200 || city.length > 100 || area.length > 100 || (governorate && governorate.length > 100)) {
    return NextResponse.json({ error: 'البيانات أطول من المسموح' }, { status: 400 });
  }

  let location: { lat: number; lng: number };
  let geohash: string;
  try {
    const parsed = parseLocation(body);
    location = parsed.location;
    geohash = parsed.geohash;
  } catch (resp: unknown) {
    // NextResponse thrown as marker — return it directly
    return resp as NextResponse;
  }

  try {
    const db = getAdminDb();
    const now = Date.now();
    const docRef = await db.collection('buildings').add({
      address,
      city,
      area,
      district: body.district?.trim() || '',
      governorate: governorate || '',
      buildingNumber: body.buildingNumber?.trim() || '',
      floor: body.floor?.trim() || '',
      apartmentNumber: body.apartmentNumber?.trim() || '',
      location,
      geohash,
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
      source: 'admin',
    });
    return NextResponse.json({ buildingId: docRef.id });
  } catch (err) {
    console.error('Admin add building failed:', err);
    return NextResponse.json({ error: 'فشل إضافة المبنى' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let body: {
    buildingId?: string;
    address?: string;
    city?: string;
    area?: string;
    district?: string;
    governorate?: string;
    buildingNumber?: string;
    floor?: string;
    apartmentNumber?: string;
    location?: { lat?: number; lng?: number };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  const buildingId = body.buildingId;
  if (!buildingId) {
    return NextResponse.json({ error: 'buildingId مطلوب' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const docRef = db.collection('buildings').doc(buildingId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'المبنى غير موجود' }, { status: 404 });
    }

    const patch: Record<string, unknown> = {};

    if (typeof body.address === 'string') patch.address = body.address.trim();
    if (typeof body.city === 'string') patch.city = body.city.trim();
    if (typeof body.area === 'string') patch.area = body.area.trim();
    if (typeof body.district === 'string') patch.district = body.district.trim();
    if (typeof body.governorate === 'string') patch.governorate = body.governorate.trim();
    if (typeof body.buildingNumber === 'string') patch.buildingNumber = body.buildingNumber.trim();
    if (typeof body.floor === 'string') patch.floor = body.floor.trim();
    if (typeof body.apartmentNumber === 'string') patch.apartmentNumber = body.apartmentNumber.trim();

    if (!patch.address || !patch.city || !patch.area) {
      return NextResponse.json({ error: 'العنوان والمدينة والحي مطلوبين' }, { status: 400 });
    }

    if (body.location) {
      try {
        const parsed = parseLocation(body);
        patch.location = parsed.location;
        patch.geohash = parsed.geohash;
      } catch (resp: unknown) {
        return resp as NextResponse;
      }
    }

    await docRef.update(patch);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin update building failed:', err);
    return NextResponse.json({ error: 'فشل تحديث المبنى' }, { status: 500 });
  }
}
