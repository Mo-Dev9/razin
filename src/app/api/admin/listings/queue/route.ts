import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snap = await db.collection('collectionQueue').orderBy('addedAt', 'desc').limit(200).get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ items });
  } catch (err) {
    console.error('List queue failed:', err);
    return NextResponse.json({ error: 'تعذر تحميل قائمة الجمع اليدوي' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let body: { id?: unknown; status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  const { id, status } = body;
  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'معرّف العنصر مطلوب' }, { status: 400 });
  }
  if (status !== 'collected' && status !== 'skipped') {
    return NextResponse.json({ error: 'الحالة غير صالحة' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const updates = status === 'collected'
      ? { status: 'collected' as const, collectedAt: Date.now() }
      : { status: 'skipped' as const, collectedAt: 0 };
    await db.collection('collectionQueue').doc(id).update(updates);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Update queue item failed:', err);
    return NextResponse.json({ error: 'تعذر تحديث حالة العنصر' }, { status: 500 });
  }
}