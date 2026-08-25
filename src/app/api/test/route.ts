import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin');
    const db = getAdminDb();
    const snap = await db.collection('buildings').limit(1).get();
    return NextResponse.json({ ok: true, count: snap.size });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
