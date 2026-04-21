/**
 * @fileOverview A simple rate limiting utility for Next.js Server Actions.
 *
 * In a serverless environment (like Vercel or Firebase App Hosting), a standard in-memory
 * variable will not persist across different instances. For production use,
 * it is recommended to use Redis (e.g., Upstash) or a database (e.g., Firestore).
 *
 * This implementation uses an in-memory approach for demonstration/development
 * and can be easily extended to use a persistent store.
 */

import { headers } from 'next/headers';

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

// Internal cache for rate limiting (in-memory)
// Note: This only works for a single instance.
const rateLimitCache = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  limit: number;      // Max number of requests
  windowMs: number;  // Time window in milliseconds
}

/**
 * Checks if a request should be rate-limited.
 * @param config The rate limit configuration.
 * @param identifier Optional identifier (e.g., IP address). If not provided, it tries to get it from headers.
 * @returns {Promise<{ success: boolean; limit: number; remaining: number; reset: number }>}
 */
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
      // If headers() is called in Middleware, it will throw.
      // In that case, the caller MUST provide an identifier.
      ip = 'anonymous-fallback';
    }
  }

  const now = Date.now();
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
