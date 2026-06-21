import { Redis } from '@upstash/redis';
import { env } from './env';
import { logger } from './logger';

const redis = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const DEFAULT_TTL = 60 * 10; // 10 minutes

export async function checkIdempotency(userId: string, requestId: string): Promise<any | null> {
  if (!redis) return null;
  if (!requestId) return null;

  try {
    const key = `idempotency:${userId}:${requestId}`;
    const cached = await redis.get(key);
    
    if (cached) {
      logger.info('Idempotency hit', { userId, requestId });
      return cached;
    }
  } catch (error) {
    logger.warn('Idempotency check failed', { error });
  }
  
  return null;
}

export async function saveIdempotency(userId: string, requestId: string, result: any, ttl = DEFAULT_TTL) {
  if (!redis) return;
  if (!requestId) return;

  try {
    const key = `idempotency:${userId}:${requestId}`;
    await redis.set(key, result, { ex: ttl });
    logger.info('Idempotency saved', { userId, requestId });
  } catch (error) {
    logger.warn('Idempotency save failed', { error });
  }
}
