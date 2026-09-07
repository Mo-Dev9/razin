import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { cairoDateString } from '@/lib/date';

export const dynamic = 'force-dynamic';

function getRequestIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
}

function getValidPath(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const path = raw;
  if (path.length > 120) return null;
  if (!path.startsWith('/')) return null;
  if (path.startsWith('/admin')) return null;
  if (path.startsWith('/api')) return null;
  if (path.includes('_next')) return null;
  return path;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getRequestIp(req);
    const { allowed, retryAfterMs } = checkRateLimit(`visit:${ip}`, 300, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
      );
    }

    let body: { path?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
    }

    const path = getValidPath(body.path);
    if (!path) {
      return NextResponse.json({ ok: false });
    }

    const db = getAdminDb();
    const today = cairoDateString();

    await db.collection('visitDays').doc(today).set(
      { count: FieldValue.increment(1), date: today },
      { merge: true }
    );

    const pageKey = encodeURIComponent(path);
    await db.collection('visitPages').doc(pageKey).set(
      { count: FieldValue.increment(1), path, lastVisitAt: Date.now() },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Visit API failed:', err);
    return NextResponse.json({ ok: false });
  }
}