import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { checkRateLimit } from '@/lib/rate-limit';

const RATING_KEYS = ['zahma', 'humidity', 'landlord', 'neighbors', 'cleanliness', 'safety', 'services', 'annoyance', 'elevator', 'maintenance', 'ac'] as const;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, retryAfterMs } = checkRateLimit(`reviews:${ip}`, 30, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      );
    }

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

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
    }

    const buildingId = body.buildingId as string | undefined;
    const rawRatings = body.ratings as Record<string, unknown> | undefined;
    const comment = (body.comment as string || '').slice(0, 500);
    const buildingNumber = (body.buildingNumber as string || '').slice(0, 50);
    const floor = (body.floor as string || '').slice(0, 20);
    const apartmentNumber = (body.apartmentNumber as string || '').slice(0, 20);

    if (!buildingId || !rawRatings) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const ratings: Record<string, number> = {};
    for (const key of RATING_KEYS) {
      const val = rawRatings[key];
      if (typeof val !== 'number' || val < 1 || val > 5) {
        return NextResponse.json({ error: 'تقييمات غير صالحة' }, { status: 400 });
      }
      ratings[key] = val;
    }

    const db = getAdminDb();
    const reviewDocId = `${buildingId}_${uid}`;

    const buildingRef = db.collection('buildings').doc(buildingId);
    const buildingSnap = await buildingRef.get();

    if (!buildingSnap.exists) {
      return NextResponse.json({ error: 'المبنى غير موجود' }, { status: 404 });
    }

    const reviewRef = db.collection('reviews').doc(reviewDocId);
    const existingSnap = await reviewRef.get();

    if (existingSnap.exists) {
      return NextResponse.json({ error: 'لقد قيّمت هذا المبنى بالفعل' }, { status: 409 });
    }

    const overall = RATING_KEYS.reduce((sum, k) => sum + ratings[k], 0) / RATING_KEYS.length;

    await reviewRef.set({
      buildingId,
      userId: uid,
      ratings,
      overall,
      comment,
      buildingNumber,
      floor,
      apartmentNumber,
      createdAt: Date.now(),
    });

    const b = buildingSnap.data()!;
    const count = b.reviewCount || 0;
    const avgRatings = (b.averageRatings || {}) as Record<string, number>;

    const avgObj: Record<string, number> = {};
    for (const k of RATING_KEYS) {
      const old = (avgRatings[k] || 0) * count;
      avgObj[k] = (old + ratings[k]) / (count + 1);
    }
    avgObj.overall = ((avgRatings.overall || 0) * count + overall) / (count + 1);

    await buildingRef.update({
      averageRatings: avgObj,
      reviewCount: count + 1,
      lastReviewAt: Date.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Submit review API failed:', err);
    return NextResponse.json({ error: 'فشل حفظ التقييم' }, { status: 500 });
  }
}
