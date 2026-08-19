import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminDb } from '@/lib/firebase-admin';

async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session?.value === 'authenticated';
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const snapshot = await db.collection('buildings').orderBy('createdAt', 'desc').get();
    const buildings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ buildings });
  } catch (err) {
    console.error('Admin get buildings failed:', err);
    return NextResponse.json({ error: 'فشل جلب البيانات' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  let body: { buildingId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  const { buildingId } = body;
  if (!buildingId) {
    return NextResponse.json({ error: 'buildingId مطلوب' }, { status: 400 });
  }

  try {
    const db = getAdminDb();
    const batch = db.batch();

    const reviewsSnap = await db.collection('reviews').where('buildingId', '==', buildingId).get();
    reviewsSnap.docs.forEach((doc) => batch.delete(doc.ref));

    const buildingRef = db.collection('buildings').doc(buildingId);
    batch.delete(buildingRef);

    await batch.commit();
    return NextResponse.json({ ok: true, deleted: reviewsSnap.size + 1 });
  } catch (err) {
    console.error('Admin delete building failed:', err);
    return NextResponse.json({ error: 'فشل الحذف' }, { status: 500 });
  }
}
