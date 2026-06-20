import { logger } from './logger';
import { redis } from './redis';
import { crypto } from 'next/dist/compiled/@edge-runtime/primitives';

const INJECTION_PATTERNS = [
  /ignore (previous|all) instructions/i,
  /you are now/i,
  /system prompt/i,
  /jailbreak/i,
  /DAN mode/i,
  /forget everything/i,
  /new rule/i,
  /stop being/i,
];

const DAILY_TOKEN_LIMIT = 50000; // Hard limit per teacher per day

/**
 * AI Safety Guard for CampusHub.
 * Provides protection against prompt injection and PII leakage.
 */
export const AISafety = {
  /**
   * Detects common prompt injection patterns.
   * @param prompt - The user input to check.
   * @returns boolean - True if injection is detected.
   */
  detectInjection(prompt: string): boolean {
    const isInjection = INJECTION_PATTERNS.some(pattern => pattern.test(prompt));
    
    if (isInjection) {
      logger.security('AI Safety: Prompt Injection Detected', {
        promptSnippet: prompt.substring(0, 100),
      });
    }
    
    return isInjection;
  },

  /**
   * Sanitizes input to remove potential PII (basic email/phone removal).
   * @param input - The string to sanitize.
   * @returns string - Sanitized input.
   */
  sanitizePII(input: string): string {
    return input
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
      .replace(/\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, '[PHONE_REDACTED]');
  },

  /**
   * Validates and sanitizes prompt before AI submission.
   * @throws Error if injection is detected.
   */
  guard(prompt: string): string {
    if (this.detectInjection(prompt)) {
      throw new Error('Invalid prompt: Potential security threat detected.');
    }
    return this.sanitizePII(prompt);
  },

  /**
   * Logs AI response for hallucination and quality auditing.
   */
  logResponse(correlationId: string, prompt: string, response: string): void {
    logger.info('AI Response Audit', {
      correlationId,
      promptSnippet: prompt.substring(0, 50),
      responseLength: response.length,
      // In production, you would send this to a dedicated monitoring service like Arize Phoenix or LangSmith
    });
  },

  /**
   * Placeholder for semantic hallucination detection.
   */
  async checkHallucination(context: string, response: string): Promise<boolean> {
    // This would typically involve an NLI model or self-consistency check
    return false;
  },

  /**
   * Enforces a daily token budget per user.
   * @param userId - The ID of the user.
   * @param estimatedTokens - Tokens to deduct.
   * @throws Error if budget exceeded.
   */
  async enforceTokenBudget(userId: string, estimatedTokens: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `ai:tokens:${userId}:${today}`;
    
    const used = await redis.get<number>(key) || 0;
    
    if (used + estimatedTokens > DAILY_TOKEN_LIMIT) {
      logger.warn('AI Safety: Token budget exceeded', { userId, used, requested: estimatedTokens });
      throw new Error('Daily AI generation limit reached. Please try again tomorrow.');
    }
    
    await redis.incrby(key, estimatedTokens);
    await redis.expire(key, 86400); // 24h
  },

  /**
   * Simple hash-based semantic cache for AI responses.
   */
  async getCachedResponse(prompt: string): Promise<string | null> {
    const hash = await this.hashPrompt(prompt);
    const key = `ai:cache:${hash}`;
    const cached = await redis.get<string>(key);
    
    if (cached) {
      logger.info('AI Cache Hit', { promptSnippet: prompt.substring(0, 30) });
      this.logCacheStat(true);
      return cached;
    }
    
    this.logCacheStat(false);
    return null;
  },

  async setCachedResponse(prompt: string, response: string): Promise<void> {
    const hash = await this.hashPrompt(prompt);
    const key = `ai:cache:${hash}`;
    await redis.set(key, response, { ex: 3600 * 24 }); // Cache for 24 hours
  },

  async hashPrompt(prompt: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(prompt.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async logCacheStat(hit: boolean): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `ai:stats:cache:${today}`;
    const field = hit ? 'hits' : 'misses';
    await redis.hincrby(key, field, 1);
    await redis.expire(key, 3600 * 24 * 7); // Keep stats for 7 days
  }
};
