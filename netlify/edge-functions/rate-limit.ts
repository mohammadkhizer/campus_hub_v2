// @ts-nocheck
import { Context } from 'netlify:edge';
import { Redis } from 'https://deno.land/x/upstash_redis@v1.22.0/mod.ts';

/**
 * Netlify Edge Function for Global Rate Limiting.
 * This runs at the network edge, blocking brute-force attempts
 * before they even reach the serverless compute layer.
 */
export default async (request: Request, context: Context) => {
  try {
    const ip = context.ip;
    
    // Skip rate limiting for static assets
    const url = new URL(request.url);
    if (url.pathname.startsWith('/_next/') || url.pathname.includes('.')) {
      return context.next();
    }

    const redis = new Redis({
      url: Netlify.env.get('UPSTASH_REDIS_REST_URL')!,
      token: Netlify.env.get('UPSTASH_REDIS_REST_TOKEN')!,
    });

    const key = `ratelimit:edge:${ip}`;
    
    // Stricter limit for Auth endpoints
    const isAuth = url.pathname.startsWith('/api/auth') || url.pathname.startsWith('/login') || url.pathname.startsWith('/signup');
    const limit = isAuth ? 10 : 60; // 10 req/min for auth, 60 for others
    const window = 60;

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, window);
    }

    if (count > limit) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return context.next();
  } catch (error) {
    // Fail open if Redis is down to avoid blocking legitimate users
    console.error('Edge Rate Limit Error:', error);
    return context.next();
  }
};

export const config = {
  path: '/*',
  excludedPath: ['/favicon.ico', '/robots.txt'],
};
