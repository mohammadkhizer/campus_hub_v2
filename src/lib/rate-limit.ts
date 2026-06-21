import { headers } from 'next/headers';
import { Redis } from '@upstash/redis';
import { env } from './env';

const redis = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

// Internal cache for rate limiting (in-memory fallback)
const rateLimitCache = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  limit: number;      // Max number of requests
  windowMs: number;  // Time window in milliseconds
}

export async function checkRateLimit(
  config: RateLimitConfig = { limit: 10, windowMs: 60 * 1000 },
  namespace: string = 'global',
  identifier?: string
) {
  let ip = identifier;

  if (!ip) {
    try {
      const headersList = await headers();
      ip = headersList.get('x-forwarded-for') || 'anonymous';
    } catch (e) {
      ip = 'anonymous-fallback';
    }
  }

  const now = Date.now();
  const key = `ratelimit:${namespace}:${ip}`;

  // UPSTASH REDIS APPROACH
  if (redis) {
    try {
      const count = await redis.incr(key);
      
      if (count === 1) {
        await redis.pexpire(key, config.windowMs);
      }
      
      if (count > config.limit) {
        const ttl = await redis.pttl(key);
        return {
          success: false,
          limit: config.limit,
          remaining: 0,
          reset: Math.ceil(Math.max(0, ttl) / 1000),
        };
      }

      const ttl = await redis.pttl(key);
      return {
        success: true,
        limit: config.limit,
        remaining: config.limit - count,
        reset: Math.ceil(Math.max(0, ttl) / 1000),
      };
    } catch (error) {
      console.warn(`[RateLimit] Redis failed for ${key}. Falling back to memory.`, error);
      // Fall through to memory approach if redis throws
    }
  }

  // MEMORY FALLBACK APPROACH
  let entry = rateLimitCache.get(key);

  // If no entry exists or the window has expired, reset
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  // Increment count
  entry.count += 1;
  rateLimitCache.set(key, entry);

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    reset: Math.ceil((entry.resetTime - now) / 1000),
  };
}
