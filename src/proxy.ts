import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminSession } from '@/lib/session-token';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    if (!isAdminSession(request.cookies.get('admin_session')?.value)) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logo-128\\.png|logo-16\\.png|logo-192\\.png|logo-32\\.png|logo-512\\.png|manifest\\.json|sw\\.js|.*\\.png$).*)',
  ],
};