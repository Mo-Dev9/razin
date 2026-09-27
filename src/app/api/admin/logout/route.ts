import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: process.env.VERCEL === '1',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return res;
}