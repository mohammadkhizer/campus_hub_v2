import { z } from 'zod';
import { USER_ROLES } from '@/lib/constants';

/**
 * User Schema & Types
 */
export const UserSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.nativeEnum(USER_ROLES).default(USER_ROLES.STUDENT),
  enrollmentNumber: z.string().optional(),
  contactNumber: z.string().optional(),
  authProvider: z.enum(['local', 'google']).default('local'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * System Log Schema & Types
 */
export const SystemLogSchema = z.object({
  id: z.string().optional(),
  level: z.enum(['info', 'warn', 'error', 'security']),
  message: z.string(),
  context: z.record(z.any()).optional(),
  timestamp: z.date().default(() => new Date()),
});

export type SystemLog = z.infer<typeof SystemLogSchema>;

/**
 * Action Response Type (Re-export for convenience)
 */
export type { ActionResponse } from '@/lib/action-factory';
