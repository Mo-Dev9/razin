import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { checkRateLimitShared, getRequestIp } from '@/lib/rate-limit';
import { authUid } from '@/lib/api-auth';
import { generateAnonymousName } from '@/lib/utils';
import { isValidPostId } from '@/lib/post-ids';
import type { PostComment } from '@/types';

export const dynamic = 'force-dynamic';

const MAX_COMMENT = 300;
const COMMENT_RATE = { max: 10, windowMs: 10 * 60_000 };

async function loadOpenPostOrNull(db: ReturnType<typeof getAdminDb>, id: string) {
  const snap = await db.collection('posts').doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if ((data as { status?: string }).status !== 'open') return null;
  return data;
}

/** قائمة تعليقات منشور — عامة القراءة، بلا هويات (اسم مستعار فقط). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidPostId(id)) {
    return NextResponse.json({ error: 'معرّف المنشور غير صالح' }, { status: 400 });
  }
  const sp = req.nextUrl.searchParams;
  const limitRaw = Number(sp.get('limit'));
  const offsetRaw = Number(sp.get('offset'));
  // ترقيم محدود (L5): سقف 50 لكل صفحة للحفاظ على القراءات محدودة، والعميل
  // يتنقل للخيوط الأطول عبر offset (قيمتا limit/offset تقعدان بصرامة).
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, Math.round(limitRaw))) : 50;
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, Math.round(offsetRaw)) : 0;
  try {
    const db = getAdminDb();
    const post = await loadOpenPostOrNull(db, id);
    if (!post) {
      return NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 });
    }
    const snap = await db
      .collection('posts')
      .doc(id)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .offset(offset)
      .limit(limit + 1)
      .get();
    const hasMore = snap.docs.length > limit;
    const page = snap.docs.slice(0, limit).map((d) => {
      const data = d.data() as PostComment;
      return { id: d.id, displayName: data.displayName, text: data.text, createdAt: data.createdAt };
    });
    const nextOffset = offset + page.length;
    return NextResponse.json({ comments: page, hasMore, nextOffset });
  } catch (err) {
    console.error('Comments fetch failed:', err);
    return NextResponse.json({ error: 'تعذر تحميل التعليقات' }, { status: 500 });
  }
}

/** إضافة تعليق مسطّح — يتطلب هوية مجهولة + rate-limit. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidPostId(id)) {
    return NextResponse.json({ error: 'معرّف المنشور غير صالح' }, { status: 400 });
  }
  const uid = await authUid(req.headers.get('authorization'));
  if (!uid) {
    return NextResponse.json({ error: 'تسجيل الدخول مطلوب للتعليق' }, { status: 401 });
  }
  const limited = await checkRateLimitShared(
    `post-comment:${uid}:${getRequestIp(req.headers)}`,
    COMMENT_RATE.max,
    COMMENT_RATE.windowMs
  );
  if (!limited.allowed) {
    return NextResponse.json(
      { error: 'علّقت كثيرًا — انتظر قليلًا ثم حاول مجددًا' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limited.retryAfterMs / 1000)) } }
    );
  }

  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text || text.length < 2 || text.length > MAX_COMMENT) {
    return NextResponse.json({ error: 'التعليق يجب أن يكون بين 2 و 300 حرف' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const post = await loadOpenPostOrNull(db, id);
    if (!post) {
      return NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 });
    }
    const now = Date.now();
    const ref = await db.collection('posts').doc(id).collection('comments').add({
      userId: uid,
      displayName: generateAnonymousName(uid),
      text,
      createdAt: now,
    });
    await db.collection('posts').doc(id).set(
      { numComments: FieldValue.increment(1) },
      { merge: true }
    );
    const comment = { id: ref.id, displayName: generateAnonymousName(uid), text, createdAt: now };
    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error('Comment create failed:', err);
    return NextResponse.json({ error: 'تعذر حفظ التعليق' }, { status: 500 });
  }
}