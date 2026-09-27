import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { checkRateLimitShared, resetRateLimitShared, getRequestIp } from '@/lib/rate-limit';
import { adminSessionValue } from '@/lib/admin';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 60 * 1000;

// تأخذ آخر قيمة موثوقة من XFF (يُلحقها Vercel) — لا الأولى القابلة للتزوير
function getRateKey(req: NextRequest): string {
  return `admin_login:${getRequestIp(req.headers)}`;
}

function passwordMatches(input: string, expected: string): boolean {
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(expected).digest();
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const rateKey = getRateKey(req);
  const { allowed, retryAfterMs } = await checkRateLimitShared(rateKey, MAX_ATTEMPTS, LOCKOUT_MS);

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
  if (typeof password !== 'string' || !password.trim()) {
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

  await resetRateLimitShared(rateKey);

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', adminSessionValue(), {
    httpOnly: true,
    secure: process.env.VERCEL === '1',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60,
    path: '/',
  });
  return res;
}