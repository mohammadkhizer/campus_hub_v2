import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { checkRateLimit } from './lib/rate-limit';

export async function middleware(request: NextRequest) {
  // 1. Apply Security Headers
  const response = NextResponse.next();
  
  // Content Security Policy (CSP) - Basic hardened version
  // Adjust this based on your external scripts/styles needs
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://placehold.co https://images.unsplash.com https://picsum.photos;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocations=()');

  /*
  // 2. Global Rate Limiting for API and Actions
  if (request.nextUrl.pathname.startsWith('/api') || request.headers.get('next-action')) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               (request as any).ip || 
               'anonymous';
    const rateLimit = await checkRateLimit({ limit: 50, windowMs: 60 * 1000 }, ip); // 50 req/min
    if (!rateLimit.success) {
      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': rateLimit.reset.toString(),
        }
      });
    }
  }
  */

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (handled separately or allowed)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
