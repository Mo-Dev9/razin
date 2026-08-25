import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const hasKey = !!process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    return NextResponse.json({ ok: true, projectId, clientEmail, hasKey });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
