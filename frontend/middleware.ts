import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/vault', '/settings'];
// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/signup', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for Supabase auth token in cookies
  const hasAuthToken = request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  );

  // Redirect unauthenticated users from protected routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!hasAuthToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from auth routes
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (hasAuthToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/vault/:path*', '/settings/:path*', '/login', '/signup', '/forgot-password'],
};
