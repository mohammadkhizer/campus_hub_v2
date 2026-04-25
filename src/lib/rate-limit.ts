/**
 * @fileOverview A persistent rate limiting utility for Next.js Server Actions.
 *
 * This implementation uses Upstash Redis to ensure rate limits are enforced
 * across multiple serverless instances (e.g., on Vercel). It provides a 
 * sliding window algorithm and falls back to a permissive state if Redis
 * credentials are missing, ensuring high availability.
 */


import { headers } from 'next/headers';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from './env';

// Initialize Redis client
// Note: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be in .env
const redis = (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) 
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * Creates a rate limiter instance with the given configuration.
 */
function createLimiter(limit: number, windowMs: number) {
  if (!redis) {
    console.warn('RATE_LIMIT: Redis not configured. Falling back to permissive mode.');
    return null;
  }

  return new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    analytics: true,
    prefix: '@campus-hub/ratelimit',
  });
}

interface RateLimitConfig {
  limit: number;      
  windowMs: number;  
}

/**
 * Checks if a request should be rate-limited.
 * Uses Upstash Redis for persistent state across serverless instances.
 */
export async function checkRateLimit(
  config: RateLimitConfig = { limit: 10, windowMs: 60 * 1000 },
  identifier?: string
) {
  let ip = identifier;

  if (!ip) {
    try {
      const headersList = await headers();
      ip = headersList.get('x-forwarded-for')?.split(',')[0] || 'anonymous';
    } catch (e) {
      ip = 'anonymous-fallback';
    }
  }

  const limiter = createLimiter(config.limit, config.windowMs);
  
  if (!limiter) {
    // Permissive fallback if Redis is missing
    return { success: true, limit: config.limit, remaining: config.limit, reset: 0 };
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(ip);
    
    // Convert reset timestamp to seconds from now
    const resetSeconds = Math.ceil((reset - Date.now()) / 1000);

    if (!success) {
      console.warn('Rate limit exceeded', { ip, limit, remaining });
    }

    return {
      success,
      limit,
      remaining,
      reset: resetSeconds,
    };
  } catch (error: any) {
    console.error('Rate limit execution error', { error: error.message });
    // Fail safe (allow) on infrastructure errors to prevent blocking users
    return { success: true, limit: config.limit, remaining: 1, reset: 0 };
  }
}

