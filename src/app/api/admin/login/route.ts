import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const MAX_ATTEMPTS = 2;
const LOCKOUT_MS = 30 * 60 * 1000;

function getRateKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
  return `admin_login_${ip}`;
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const rateKey = getRateKey(req);

  const rateData = cookieStore.get(rateKey);
  if (rateData) {
    const { attempts, lockedUntil } = JSON.parse(rateData.value);
    if (lockedUntil && Date.now() < lockedUntil) {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 60000);
      return NextResponse.json(
        { error: `محظور. حاول بعد ${remaining} دقيقة` },
        { status: 429 }
      );
    }
    if (attempts >= MAX_ATTEMPTS) {
      const lockedUntilMs = Date.now() + LOCKOUT_MS;
      const res = NextResponse.json(
        { error: `تم تجاوز الحد. حاول بعد 30 دقيقة` },
        { status: 429 }
      );
      res.cookies.set(rateKey, JSON.stringify({ attempts: 0, lockedUntil: lockedUntilMs }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: LOCKOUT_MS / 1000,
        path: '/',
      });
      return res;
    }
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

  if (password !== adminPassword) {
    const prev = rateData ? JSON.parse(rateData.value) : { attempts: 0, lockedUntil: 0 };
    const newAttempts = prev.attempts + 1;
    const res = NextResponse.json(
      { error: 'كلمة المرور غير صحيحة' },
      { status: 401 }
    );
    res.cookies.set(rateKey, JSON.stringify({ attempts: newAttempts, lockedUntil: 0 }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: LOCKOUT_MS / 1000,
      path: '/',
    });
    return res;
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', 'authenticated', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60,
    path: '/',
  });
  res.cookies.set(rateKey, JSON.stringify({ attempts: 0, lockedUntil: 0 }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return res;
}
