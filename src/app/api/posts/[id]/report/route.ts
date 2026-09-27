import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { checkRateLimitShared, getRequestIp } from '@/lib/rate-limit';
import { authGoogleUid } from '@/lib/api-auth';
import { isValidPostId } from '@/lib/post-ids';

export const dynamic = 'force-dynamic';

const MAX_REASON = 200;
const REPORT_RATE = { max: 5, windowMs: 10 * 60_000 };

/**
 * الإبلاغ عن منشور — قراران (٥): (1) الهوية **موفّر جوجل إلزامي** (لا مجهول —
 * يمنع سبام الإخفاء بحسابات وهمية)، و(2) **بلاغان من حسابين مختلفين ⇒ hide
 * فوري**؛ البلاغ الأول مجرد إشارة للأدمن في لوحة الإشراف (post.reported=true).
 * الخصوصية: لا يمكن للعميل إخفاء مشاركة ببصمة واحدة.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidPostId(id)) {
    return NextResponse.json({ error: 'معرّف المنشور غير صالح' }, { status: 400 });
  }
  const uid = await authGoogleUid(req.headers.get('authorization'));
  if (!uid) {
    return NextResponse.json(
      { error: 'الإبلاغ يتطلب تسجيل الدخول بحساب جوجل — اربط حسابك أولًا ثم أبلغ' },
      { status: 401 }
    );
  }
  const limited = await checkRateLimitShared(
    `post-report:${uid}:${getRequestIp(req.headers)}`,
    REPORT_RATE.max,
    REPORT_RATE.windowMs
  );
  if (!limited.allowed) {
    return NextResponse.json(
      { error: 'إبلاغات كثيرة — انتظر قليلًا ثم حاول مجددًا' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(limited.retryAfterMs / 1000)) } }
    );
  }

  let body: { text?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }
  const reason = typeof body.text === 'string' ? body.text.trim() : '';
  if (reason.length > MAX_REASON) {
    return NextResponse.json({ error: 'سبب الإبلاغ بحد أقصى 200 حرف' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const postRef = db.collection('posts').doc(id);
    const snap = await postRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 });
    }
    const data = snap.data() as { status?: string };
    if (data.status !== 'open') {
      return NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 });
    }

    // تحديد هوية البلاغ بمعرّف الحساب — منع تكرار إبلاغ نفس الشخص لنفس المنشور.
    const reportRef = postRef.collection('reports').doc(uid);
    const existing = await reportRef.get();
    if (existing.exists) {
      return NextResponse.json({ ok: true, alreadyReported: true });
    }
    // العدّاد المحفوظ على المنشور (M4): لوحة الإشراف تقرأ reportCount مباشرة
    // بلا استعلام subcollection N+1 لكل صف.
    await reportRef.set({ userId: uid, text: reason || null, createdAt: Date.now() });
    await postRef.set({ reportCount: FieldValue.increment(1) }, { merge: true });

    // عتبة القرار: عدد المبلّغين المختلفين (خفيف — تحقيق دفعة واحد).
    const reportsSnap = await postRef.collection('reports').get();
    const distinctReporters = new Set(reportsSnap.docs.map((d) => d.data().userId as string)).size;

    if (distinctReporters >= 2) {
      await postRef.set({ status: 'hidden', reported: true }, { merge: true });
    } else {
      await postRef.set({ reported: true }, { merge: true });
    }
    return NextResponse.json({ ok: true, hidden: distinctReporters >= 2 });
  } catch (err) {
    console.error('Report create failed:', err);
    return NextResponse.json({ error: 'تعذر الإبلاغ عن المنشور' }, { status: 500 });
  }
}