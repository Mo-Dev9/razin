import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { isReportReason } from '@/types';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const { allowed, retryAfterMs } = checkRateLimit(`reports:${ip}`, 10, 60_000);
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

  const reviewId = body.reviewId;
  const buildingId = body.buildingId;
  const reason = body.reason;

  if (typeof reviewId !== 'string' || !reviewId) {
    return NextResponse.json({ error: 'reviewId ناقص' }, { status: 400 });
  }
  if (typeof buildingId !== 'string' || !buildingId) {
    return NextResponse.json({ error: 'buildingId ناقص' }, { status: 400 });
  }
  if (!isReportReason(reason)) {
    return NextResponse.json({ error: 'سبب غير صالح' }, { status: 400 });
  }

  try {
    const db = getAdminDb();

    const reviewSnap = await db.collection('reviews').doc(reviewId).get();
    if (!reviewSnap.exists) {
      return NextResponse.json({ error: 'المراجعة غير موجودة' }, { status: 404 });
    }
    if (reviewSnap.data()?.buildingId !== buildingId) {
      return NextResponse.json({ error: 'المراجعة ليست لهذا المبنى' }, { status: 400 });
    }

    // One report per user per review.
    const dupSnap = await db
      .collection('reports')
      .where('reporterUid', '==', uid)
      .where('reviewId', '==', reviewId)
      .limit(1)
      .get();
    if (!dupSnap.empty) {
      return NextResponse.json({ error: 'سبق أن أبلغت عن هذه المراجعة' }, { status: 409 });
    }

    await db.collection('reports').add({
      reviewId,
      buildingId,
      reporterUid: uid,
      reason,
      status: 'pending',
      createdAt: Date.now(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Report review API failed:', err);
    return NextResponse.json({ error: 'فشل إرسال البلاغ' }, { status: 500 });
  }
}