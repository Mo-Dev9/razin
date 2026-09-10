import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: [
    '/((?!api|admin|_next/static|_next/image|favicon.ico|logo-128\\.png|logo-16\\.png|logo-192\\.png|logo-32\\.png|logo-512\\.png|manifest\\.json|sw\\.js|.*\\.png$).*)',
  ],
};