// Middleware — protects API routes by returning 401 JSON for unauthenticated requests
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    // For API routes, return 401 JSON (not a redirect — client fetches expect JSON)
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    // For page routes, redirect to home (which shows the login form)
    const loginUrl = new URL('/', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Protect all /api routes except auth routes
export const config = {
  matcher: [
    '/api/((?!auth).*)',
  ],
};
