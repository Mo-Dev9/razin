import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 60 * 1000;

function getRateKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return `admin_login:${ip}`;
}

function passwordMatches(input: string, expected: string): boolean {
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(expected).digest();
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const rateKey = getRateKey(req);
  const { allowed, retryAfterMs } = checkRateLimit(rateKey, MAX_ATTEMPTS, LOCKOUT_MS);

  if (!allowed) {
    const minutes = Math.max(1, Math.ceil(retryAfterMs / 60000));
    return NextResponse.json(
      { error: `محظور. حاول بعد ${minutes} دقيقة` },
      { status: 429 }
    );
  }

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }

  const { password } = body;
  if (!password) {
    return NextResponse.json({ error: 'كلمة المرور مطلوبة' }, { status: 400 });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json({ error: 'خدمة الإدارة غير مُعدّة' }, { status: 500 });
  }

  // Server-side, per-IP lockout: no attacker-controlled cookie to delete.
  if (!passwordMatches(password, adminPassword)) {
    return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
  }

  resetRateLimit(rateKey);

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60,
    path: '/',
  });
  return res;
}