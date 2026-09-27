import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import { checkRateLimit, getRequestIp } from '@/lib/rate-limit';
import { cairoDateString } from '@/lib/date';

export const dynamic = 'force-dynamic';

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
    const ip = getRequestIp(req.headers);
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

    // مفتاح وثيقة مشتّت (sha256) بدل encodeURIComponent للمسار — مسارات عربية
    // طويلة كانت ستنتفخ كمعرّفات وثائق (L6)؛ المسار يُخزَّن كحقل قابل للعرض.
    const { createHash } = await import('crypto');
    const pageId = createHash('sha256').update(path).digest('hex');
    await db.collection('visitPages').doc(pageId).set(
      { count: FieldValue.increment(1), path, lastVisitAt: Date.now() },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Visit API failed:', err);
    return NextResponse.json({ ok: false });
  }
}