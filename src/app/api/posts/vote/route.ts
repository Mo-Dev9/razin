import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { checkRateLimitShared } from '@/lib/rate-limit';
import { authUid } from '@/lib/api-auth';
import { computeVoteDelta } from '@/lib/community';
import { isValidPostId } from '@/lib/post-ids';

export const dynamic = 'force-dynamic';

const VOTE_RATE = { max: 40, windowMs: 60_000 };

/**
 * تصويت أعلى/أسفل على منشور — مرة واحدة لكل رمز+منشور. القاعدة (computeVoteDelta):
 * تكرار نفس الاتجاه ⇔ إلغاء، طلب 0 ⇔ إلغاء، أي تغيير ⇔ تسجيل. التجميع في
 * transaction حتى لا يختل الرصيد عند تزامن الطلبات (Server-side فقط).
 */
export async function POST(req: NextRequest) {
  const uid = await authUid(req.headers.get('authorization'));
  if (!uid) {
    return NextResponse.json({ error: 'تسجيل الدخول مطلوب للتصويت' }, { status: 401 });
  }
  const limited = await checkRateLimitShared(`post-vote:${uid}`, VOTE_RATE.max, VOTE_RATE.windowMs);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: 'تصويتات كثيرة — انتظر قليلًا ثم حاول مجددًا' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limited.retryAfterMs / 1000)) } }
    );
  }

  let body: { postId?: unknown; vote?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }

  const postId = typeof body.postId === 'string' ? body.postId.trim() : '';
  if (!postId || postId.length > 200 || !isValidPostId(postId)) {
    return NextResponse.json({ error: 'معرّف المنشور مطلوب وصالح' }, { status: 400 });
  }
  const vote = typeof body.vote === 'number' ? body.vote : NaN;
  if (![1, -1, 0].includes(vote)) {
    return NextResponse.json({ error: 'التصويت يجب أن يكون 1 أو -1 أو 0' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const postRef = db.collection('posts').doc(postId);
    const outcome = await db.runTransaction(async (tx) => {
      const postSnap = await tx.get(postRef);
      if (!postSnap.exists) return { notFound: true as const };
      const data = postSnap.data() as { status?: string; upCount?: number; downCount?: number };
      if (data.status !== 'open') return { notFound: true as const };

      const voteRef = postRef.collection('votes').doc(uid);
      const prevSnap = await tx.get(voteRef);
      const prevRaw = prevSnap.exists ? (prevSnap.data()?.vote as unknown) : 0;
      const prev = typeof prevRaw === 'number' ? prevRaw : 0;
      const { next, upDelta, downDelta } = computeVoteDelta(prev, vote);

      const upCount = (data.upCount ?? 0) + upDelta;
      const downCount = (data.downCount ?? 0) + downDelta;
      await tx.set(postRef, { upCount, downCount, netVotes: upCount - downCount }, { merge: true });

      if (next === 0 && prevSnap.exists) {
        await tx.delete(voteRef);
      } else if (next !== 0) {
        await tx.set(voteRef, { vote: next, updatedAt: Date.now() });
      }

      return {
        notFound: false as const,
        result: { upCount, downCount, netVotes: upCount - downCount, myVote: next },
      };
    });

    if (outcome.notFound) {
      return NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 });
    }
    return NextResponse.json(outcome.result);
  } catch (err) {
    console.error('Post vote failed:', err);
    return NextResponse.json({ error: 'تعذر تسجيل التصويت' }, { status: 500 });
  }
}