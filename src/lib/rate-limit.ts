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

  // UPSTASH REDIS APPROACH
  if (redis) {
    try {
      const key = `ratelimit:${ip}`;
      
      const [response] = await redis.pipeline()
        .incr(key)
        .pexpire(key, config.windowMs)
        .exec();
      
      const count = Number(response);
      
      if (count > config.limit) {
        return {
          success: false,
          limit: config.limit,
          remaining: 0,
          reset: Math.ceil(config.windowMs / 1000), // simplistic reset
        };
      }

      return {
        success: true,
        limit: config.limit,
        remaining: config.limit - count,
        reset: Math.ceil(config.windowMs / 1000),
      };
    } catch (error) {
      console.warn(`[RateLimit] Redis failed for ${ip}. Falling back to memory.`, error);
      // Fall through to memory approach if redis throws
    }
  }

  // MEMORY FALLBACK APPROACH
  let entry = rateLimitCache.get(ip);

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
  rateLimitCache.set(ip, entry);

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    reset: Math.ceil((entry.resetTime - now) / 1000),
  };
}
