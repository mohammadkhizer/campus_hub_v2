import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().url(),
  MONGODB_BACKUP_URI: z.string().url().optional(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ENCRYPTION_KEY: z.string().min(32),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid environment variables');
  }
}

export const env = parsed.data || (process.env as any);
