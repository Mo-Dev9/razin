import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { recomputeBuildingStats } from '@/lib/review-stats';

const RATING_KEYS = [
  'zahma', 'humidity', 'landlord', 'neighbors', 'cleanliness',
  'safety', 'services', 'annoyance', 'elevator', 'maintenance', 'ac', 'condition',
] as const;

function parseRatings(rawRatings: unknown): Record<string, number> | null {
  if (!rawRatings || typeof rawRatings !== 'object') return null;
  const ratings: Record<string, number> = {};
  for (const key of RATING_KEYS) {
    const val = (rawRatings as Record<string, unknown>)[key];
    if (typeof val !== 'number' || val < 1 || val > 5) return null;
    ratings[key] = val;
  }
  return ratings;
}

class ReviewApiError extends Error {
  constructor(public code: 'BUILDING_NOT_FOUND' | 'ALREADY_REVIEWED') {
    super(code);
  }
}

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
    const comment = (body.comment as string || '').slice(0, 500);
    const buildingNumber = (body.buildingNumber as string || '').slice(0, 50);
    const floor = (body.floor as string || '').slice(0, 20);
    const apartmentNumber = (body.apartmentNumber as string || '').slice(0, 20);

    if (!buildingId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const ratings = parseRatings(body.ratings);
    if (!ratings) {
      return NextResponse.json({ error: 'تقييمات غير صالحة' }, { status: 400 });
    }

    const db = getAdminDb();
    const reviewDocId = `${buildingId}_${uid}`;
    const overall = RATING_KEYS.reduce((sum, k) => sum + ratings[k], 0) / RATING_KEYS.length;

    // The whole check-and-write is one transaction so the one-review-per-user
    // rule cannot be bypassed by legacy reviews stored under random doc ids.
    try {
      await db.runTransaction(async (tx) => {
        const buildingRef = db.collection('buildings').doc(buildingId);
        const buildingSnap = await tx.get(buildingRef);

        if (!buildingSnap.exists) {
          throw new ReviewApiError('BUILDING_NOT_FOUND');
        }

        const reviewRef = db.collection('reviews').doc(reviewDocId);
        const existingSnap = await tx.get(reviewRef);

        if (existingSnap.exists) {
          throw new ReviewApiError('ALREADY_REVIEWED');
        }

        const dupSnap = await tx.get(
          db.collection('reviews')
            .where('buildingId', '==', buildingId)
            .where('userId', '==', uid)
            .limit(1)
        );

        if (!dupSnap.empty) {
          throw new ReviewApiError('ALREADY_REVIEWED');
        }

        tx.set(reviewRef, {
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

        tx.update(buildingRef, {
          averageRatings: avgObj,
          reviewCount: count + 1,
          lastReviewAt: Date.now(),
        });
      });
    } catch (err) {
      if (err instanceof ReviewApiError) {
        if (err.code === 'BUILDING_NOT_FOUND') {
          return NextResponse.json({ error: 'المبنى غير موجود' }, { status: 404 });
        }
        return NextResponse.json({ error: 'لقد قيّمت هذا المبنى بالفعل' }, { status: 409 });
      }
      throw err;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Submit review API failed:', err);
    return NextResponse.json({ error: 'فشل حفظ التقييم' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, retryAfterMs } = checkRateLimit(`reviews:${ip}`, 60, 60_000);
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
    const comment = (body.comment as string || '').slice(0, 500);
    const buildingNumber = (body.buildingNumber as string || '').slice(0, 50);
    const floor = (body.floor as string || '').slice(0, 20);
    const apartmentNumber = (body.apartmentNumber as string || '').slice(0, 20);

    if (!buildingId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const ratings = parseRatings(body.ratings);
    if (!ratings) {
      return NextResponse.json({ error: 'تقييمات غير صالحة' }, { status: 400 });
    }

    const overall = RATING_KEYS.reduce((sum, k) => sum + ratings[k], 0) / RATING_KEYS.length;

    const db = getAdminDb();
    const reviewRef = db.collection('reviews').doc(`${buildingId}_${uid}`);
    const reviewSnap = await reviewRef.get();

    if (!reviewSnap.exists) {
      return NextResponse.json({ error: 'التقييم غير موجود' }, { status: 404 });
    }
    if (reviewSnap.data()!.userId !== uid) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    await reviewRef.update({
      ratings,
      overall,
      comment,
      buildingNumber,
      floor,
      apartmentNumber,
    });

    await recomputeBuildingStats(buildingId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Update review API failed:', err);
    return NextResponse.json({ error: 'فشل تحديث التقييم' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, retryAfterMs } = checkRateLimit(`reviews:${ip}`, 60, 60_000);
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

    const url = new URL(req.url);
    const buildingId = url.searchParams.get('buildingId');
    if (!buildingId) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const db = getAdminDb();
    const reviewId = `${buildingId}_${uid}`;
    const reviewRef = db.collection('reviews').doc(reviewId);
    const reviewSnap = await reviewRef.get();

    if (!reviewSnap.exists) {
      return NextResponse.json({ error: 'التقييم غير موجود' }, { status: 404 });
    }
    if (reviewSnap.data()!.userId !== uid) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    await reviewRef.delete();

    // Clean up orphaned votes referencing this review (posts from other users)
    try {
      const votesSnap = await db
        .collection('votes')
        .where('reviewId', '==', reviewId)
        .get();
      const batch = db.batch();
      votesSnap.forEach((vDoc) => batch.delete(vDoc.ref));
      if (votesSnap.size > 0) await batch.commit();
    } catch (err) {
      console.warn('Failed to clean up votes for deleted review:', err);
    }

    await recomputeBuildingStats(buildingId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Delete review API failed:', err);
    return NextResponse.json({ error: 'فشل حذف التقييم' }, { status: 500 });
  }
}
