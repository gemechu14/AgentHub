import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth/verify',
  '/oauth/google/callback',
  '/auth/callback',
];

// Routes that should be accessible without auth (like static files)
const publicPaths = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/vercel.svg',
  '/next.svg',
  '/file.svg',
  '/globe.svg',
  '/window.svg',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths (static files, API routes, etc.)
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for authentication token
  const accessToken = request.cookies.get('access_token')?.value;
  
  // For now, we're using localStorage, so we can't check cookies
  // But we can check if the user is trying to access a protected route
  // If they don't have a token, they'll be redirected by the client-side hooks
  
  // Allow all routes for now since we're using localStorage
  // The client-side auth hooks will handle redirects
  return NextResponse.next();
}

// Don't run middleware on these paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};


