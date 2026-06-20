import { redis } from './redis';
import { logger } from './logger';

/**
 * Ensures that an operation is idempotent by caching the result based on a unique key.
 * This prevents double-writes and accidental duplicate submissions.
 * 
 * @param key - A unique idempotency key (e.g., studentId + quizId + attemptNumber)
 * @param ttlSeconds - How long to cache the result (default 24 hours)
 * @param fn - The async function to execute if no cached result exists
 */
export async function withIdempotency<T>(
  key: string,
  ttlSeconds: number = 86400,
  fn: () => Promise<T>
): Promise<T> {
  const fullKey = `idempotency:${key}`;
  
  try {
    const cached = await redis.get(fullKey);
    if (cached) {
      logger.info('Idempotency hit', { key: fullKey });
      return cached as T;
    }

    const result = await fn();
    
    // Cache the result
    await redis.set(fullKey, JSON.stringify(result), { ex: ttlSeconds });
    
    return result;
  } catch (error: any) {
    logger.error('Idempotency error', { key: fullKey, error: error.message });
    throw error;
  }
}
