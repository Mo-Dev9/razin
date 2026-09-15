import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebase-admin';
import { checkRateLimit, getRequestIp } from '@/lib/rate-limit';
import { isValidPostId } from '@/lib/post-ids';

export const dynamic = 'force-dynamic';

const RATE = { max: 60, windowMs: 60_000 };

async function enforceRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const { allowed, retryAfterMs } = checkRateLimit(
    `admin-posts:${getRequestIp(req.headers)}`,
    RATE.max,
    RATE.windowMs
  );
  if (!allowed) {
    return NextResponse.json(
      { error: 'طلبات كثيرة، حاول لاحقًا' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }
  return null;
}

/**
 * إشراف «حارة»: منشورات مبلَّغ عنها (بلاغ واحد = reported، لا تُخفى فورًا؛
 * بلاغان مختلفان = hidden) تُراجع وتُستعاد أو تُحذف نهائيًا. الجلب يجمع القائمتين
 * (reported أو hidden) لأن البلاغ الأول لا يُخفي — وعلى الأدمن مراجعته أيضًا.
 * عند الحذف تُحذف مستندات الإبلاغ المرتبطة؛ عند الاستعادة يُصفَّر العدّاد
 * (يُحذف subcollection) ليبدأ الإبلاغ التالي من عتبة جديدة بعد فحص بشري.
 */
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  const limited = await enforceRateLimit(req);
  if (limited) return limited;

  try {
    const db = getAdminDb();
    const [reportedSnap, hiddenSnap] = await Promise.all([
      db.collection('posts').where('reported', '==', true).limit(100).get(),
      db.collection('posts').where('status', '==', 'hidden').limit(100).get(),
    ]);
    const byId = new Map<string, Record<string, unknown> & { id: string }>();
    for (const snap of [reportedSnap, hiddenSnap]) {
      for (const d of snap.docs) {
        if (!byId.has(d.id)) byId.set(d.id, { id: d.id, ...d.data() });
      }
    }
    const rows = [...byId.values()];
    rows.sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));

    // reportCount محفوظ على المنشور عند كل إبلاغ (راجع report/route.ts) —
    // لا استعلام N+1 على subcollection reports لكل صف (تحصين M4).
    const posts = rows.map((row) => ({
      ...row,
      reportCount:
        typeof row.reportCount === 'number'
          ? row.reportCount
          : row.reported === true
            ? 1
            : 0,
    }));
    return NextResponse.json({ posts });
  } catch (err) {
    console.error('Admin posts fetch failed:', err);
    return NextResponse.json({ error: 'تعذر تحميل منشورات الإشراف' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  const limited = await enforceRateLimit(req);
  if (limited) return limited;

  let body: { postId?: unknown; action?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }
  const postId = typeof body.postId === 'string' ? body.postId.trim() : '';
  const action = body.action;
  if (!postId || postId.length > 200 || !isValidPostId(postId)) {
    return NextResponse.json({ error: 'معرّف المنشور مطلوب وصالح' }, { status: 400 });
  }
  if (action !== 'restore' && action !== 'delete') {
    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const postRef = db.collection('posts').doc(postId);
    const snap = await postRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'المنشور غير موجود' }, { status: 404 });
    }

    if (action === 'delete') {
      const reports = await postRef.collection('reports').get();
      await Promise.all(reports.docs.map((d) => d.ref.delete()));
      await postRef.delete();
    } else {
      // استعادة: تُفتح + يُصفَّر عدّاد البلاغات (يبدأ الإبلاغ التالي من عتبة جديدة)
      const reports = await postRef.collection('reports').get();
      await Promise.all(reports.docs.map((d) => d.ref.delete()));
      await postRef.set({ status: 'open', reported: false, reportCount: 0 }, { merge: true });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Admin posts moderation failed:', err);
    return NextResponse.json({ error: 'تعذر تنفيذ الإجراء' }, { status: 500 });
  }
}