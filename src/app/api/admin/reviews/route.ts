import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebase-admin';
import { recomputeBuildingStats } from '@/lib/review-stats';

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const buildingId = searchParams.get('buildingId');

  try {
    const db = getAdminDb();
    let q;
    if (buildingId) {
      q = db.collection('reviews').where('buildingId', '==', buildingId).orderBy('createdAt', 'desc');
    } else {
      q = db.collection('reviews').orderBy('createdAt', 'desc').limit(100);
    }
    const snapshot = await q.get();
    const reviews = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ reviews });
  } catch (err) {
    console.error('Admin get reviews failed:', err);
    return NextResponse.json({ error: 'فشل جلب البيانات' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let body: { reviewId?: string; buildingId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  const { reviewId, buildingId } = body;
  if (!reviewId || !buildingId) {
    return NextResponse.json({ error: 'reviewId و buildingId مطلوبين' }, { status: 400 });
  }

  try {
    const db = getAdminDb();

    const reviewRef = db.collection('reviews').doc(reviewId);
    const reviewSnap = await reviewRef.get();
    if (!reviewSnap.exists) {
      return NextResponse.json({ error: 'التقييم غير موجود' }, { status: 404 });
    }

    await reviewRef.delete();

    await recomputeBuildingStats(buildingId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin delete review failed:', err);
    return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 });
  }
}
