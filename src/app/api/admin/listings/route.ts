import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebase-admin';
import { neighborhoodKey } from '@/lib/listing-utils';
import { PROPERTY_TYPES, FINISHING_LEVELS } from '@/types';
import type { Listing, PropertyType, FinishingLevel, VerificationStatus } from '@/types';

export const dynamic = 'force-dynamic';

function isPropertyType(value: unknown): value is PropertyType {
  return typeof value === 'string' && PROPERTY_TYPES.some((p) => p.id === value);
}

function isFinishingLevel(value: unknown): value is FinishingLevel {
  return typeof value === 'string' && FINISHING_LEVELS.some((f) => f.id === value);
}

function isVerificationStatus(value: unknown): value is VerificationStatus {
  return value === 'verified' || value === 'unverified';
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  const governorate = typeof body.governorate === 'string' ? body.governorate.trim() : '';
  if (!governorate || governorate.length > 100) {
    return NextResponse.json({ error: 'المحافظة مطلوبة وبحد أقصى 100 حرف' }, { status: 400 });
  }

  const city = typeof body.city === 'string' ? body.city.trim() : '';
  if (!city || city.length > 100) {
    return NextResponse.json({ error: 'الحي/المدينة مطلوب وبحد أقصى 100 حرف' }, { status: 400 });
  }

  const propertyType = body.propertyType;
  if (!isPropertyType(propertyType)) {
    return NextResponse.json({ error: 'نوع العقار غير صالح' }, { status: 400 });
  }

  if (
    typeof body.rooms !== 'number' ||
    !Number.isInteger(body.rooms) ||
    body.rooms < 0 ||
    body.rooms > 10
  ) {
    return NextResponse.json({ error: 'عدد الغرف يجب أن يكون عددًا صحيحًا بين 0 و 10' }, { status: 400 });
  }
  const rooms = body.rooms;

  if (
    typeof body.bathrooms !== 'number' ||
    !Number.isInteger(body.bathrooms) ||
    body.bathrooms < 0 ||
    body.bathrooms > 10
  ) {
    return NextResponse.json({ error: 'عدد الحمامات يجب أن يكون عددًا صحيحًا بين 0 و 10' }, { status: 400 });
  }
  const bathrooms = body.bathrooms;

  const finishing = body.finishing;
  if (!isFinishingLevel(finishing)) {
    return NextResponse.json({ error: 'مستوى التشطيب غير صالح' }, { status: 400 });
  }

  if (
    typeof body.price !== 'number' ||
    !Number.isFinite(body.price) ||
    body.price <= 0 ||
    body.price > 5_000_000
  ) {
    return NextResponse.json({ error: 'السعر يجب أن يكون رقمًا بين 0 و 5,000,000' }, { status: 400 });
  }
  const price = body.price;

  const sourceName = typeof body.sourceName === 'string' ? body.sourceName.trim() : '';
  if (!sourceName || sourceName.length > 80) {
    return NextResponse.json({ error: 'اسم المصدر مطلوب وبحد أقصى 80 حرفًا' }, { status: 400 });
  }

  let sourceUrl: string | undefined;
  if (body.sourceUrl !== undefined && body.sourceUrl !== null && body.sourceUrl !== '') {
    if (typeof body.sourceUrl !== 'string' || body.sourceUrl.length > 500) {
      return NextResponse.json({ error: 'رابط المصدر غير صالح' }, { status: 400 });
    }
    let parsed: URL;
    try {
      parsed = new URL(body.sourceUrl);
    } catch {
      return NextResponse.json({ error: 'رابط المصدر غير صالح' }, { status: 400 });
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'رابط المصدر يجب أن يبدأ بـ http أو https' }, { status: 400 });
    }
    sourceUrl = body.sourceUrl;
  }

  const verif = body.verif;
  if (!isVerificationStatus(verif)) {
    return NextResponse.json({ error: 'حالة التحقق غير صالحة' }, { status: 400 });
  }

  let listedAt: number | undefined;
  if (body.listedAt !== undefined && body.listedAt !== null) {
    if (typeof body.listedAt !== 'number' || !Number.isInteger(body.listedAt) || body.listedAt <= 0) {
      return NextResponse.json({ error: 'تاريخ الإعلان غير صالح' }, { status: 400 });
    }
    listedAt = body.listedAt;
  }

  let note: string | undefined;
  if (body.note !== undefined && body.note !== null && body.note !== '') {
    if (typeof body.note !== 'string' || body.note.length > 500) {
      return NextResponse.json({ error: 'الملاحظة بحد أقصى 500 حرف' }, { status: 400 });
    }
    note = body.note.trim();
    if (!note) note = undefined;
  }

  try {
    const db = getAdminDb();
    const record: Omit<Listing, 'id'> = {
      governorate,
      city,
      neighborhoodId: neighborhoodKey(city),
      propertyType,
      rooms,
      bathrooms,
      finishing,
      price,
      sourceName,
      sourceType: 'manual',
      verif,
      recordedAt: Date.now(),
      status: 'active',
      ...(sourceUrl !== undefined ? { sourceUrl } : {}),
      ...(listedAt !== undefined ? { listedAt } : {}),
      ...(note !== undefined ? { note } : {}),
    };
    const ref = await db.collection('listings').add(record);
    return NextResponse.json({ listingId: ref.id });
  } catch (err) {
    console.error('Create listing failed:', err);
    return NextResponse.json({ error: 'تعذر حفظ الإعلان' }, { status: 500 });
  }
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snap = await db.collection('listings').orderBy('recordedAt', 'desc').limit(100).get();
    const listings = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ listings });
  } catch (err) {
    console.error('List listings failed:', err);
    return NextResponse.json({ error: 'تعذر تحميل الإعلانات' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let body: { listingId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  const { listingId } = body;
  if (typeof listingId !== 'string' || !listingId) {
    return NextResponse.json({ error: 'معرّف الإعلان مطلوب' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const ref = db.collection('listings').doc(listingId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'الإعلان غير موجود' }, { status: 404 });
    }
    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Delete listing failed:', err);
    return NextResponse.json({ error: 'تعذر حذف الإعلان' }, { status: 500 });
  }
}