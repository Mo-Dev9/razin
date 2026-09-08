import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase-admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { applyVote } from '@/lib/vote-logic';

interface VoteDoc {
  reviewId: string;
  buildingId: string;
  userId: string;
  type: 'up' | 'down';
  createdAt: number;
}

function parseType(raw: unknown): 'up' | 'down' | null {
  if (raw === 'up' || raw === 'down') return raw;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const { allowed, retryAfterMs } = checkRateLimit(`votes:${ip}`, 60, 60_000);
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
      if (decoded.firebase?.sign_in_provider === 'anonymous') {
        return NextResponse.json({ error: 'سجّل بـ Google أولاً' }, { status: 401 });
      }
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

    const reviewId = (body.reviewId as string | undefined)?.slice(0, 200);
    const buildingId = (body.buildingId as string | undefined)?.slice(0, 200);
    const type = parseType(body.type);

    if (!reviewId || !buildingId || !type) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
    }

    const db = getAdminDb();
    const reviewRef = db.collection('reviews').doc(reviewId);
    const voteRef = db.collection('votes').doc(`${reviewId}_${uid}`);

    const result = await db.runTransaction(async (tx) => {
      const reviewSnap = await tx.get(reviewRef);
      if (!reviewSnap.exists) {
        throw new Error('REVIEW_NOT_FOUND');
      }

      const reviewData = reviewSnap.data() as Record<string, unknown>;
      if (reviewData.buildingId !== buildingId) {
        throw new Error('BUILDING_MISMATCH');
      }

      const voteSnap = await tx.get(voteRef);
      const existing = voteSnap.exists ? ((voteSnap.data() as VoteDoc).type ?? null) : null;

      const current = ({
        up: reviewData.upvotes && typeof reviewData.upvotes === 'number' ? (reviewData.upvotes as number) : 0,
        down: reviewData.downvotes && typeof reviewData.downvotes === 'number' ? (reviewData.downvotes as number) : 0,
      });

      const applied = applyVote({
        existing,
        requested: type,
        upvotes: current.up,
        downvotes: current.down,
      });

      // userVote === null -> vote removed; otherwise -> added or switched
      if (applied.userVote === null) {
        await tx.delete(voteRef);
      } else {
        if (existing) await tx.delete(voteRef);
        await tx.set(voteRef, {
          reviewId,
          buildingId,
          userId: uid,
          type,
          createdAt: Date.now(),
        });
      }

      await tx.update(reviewRef, { upvotes: applied.upvotes, downvotes: applied.downvotes });

      return {
        upvotes: applied.upvotes,
        downvotes: applied.downvotes,
        userVote: applied.userVote,
        net: applied.upvotes - applied.downvotes,
      };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof Error && err.message === 'REVIEW_NOT_FOUND') {
      return NextResponse.json({ error: 'التقييم غير موجود' }, { status: 404 });
    }
    if (err instanceof Error && err.message === 'BUILDING_MISMATCH') {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }
    console.error('Vote API failed:', err);
    return NextResponse.json({ error: 'فشل التصويت' }, { status: 500 });
  }
}