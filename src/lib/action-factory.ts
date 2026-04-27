'use server';

import { z } from 'zod';
import dbConnect from './mongoose';
import { getSessionAction } from '@/app/actions/auth';
import { logger } from './logger';
import { UserRole } from './constants';

/**
 * Standardized Context for all Server Actions
 */
export type ActionContext = {
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  } | null;
};

/**
 * Options for creating an action
 */
type ActionOptions<I extends z.ZodType, O> = {
  name: string;
  inputSchema?: I;
  allowedRoles?: UserRole[];
  handler: (input: z.infer<I>, context: ActionContext) => Promise<O>;
};

/**
 * Standardized Response format
 */
export type ActionResponse<T> = 
  | { success: true; data: T; error?: never } 
  | { success: false; error: string; code?: string; data?: never };

/**
 * Core wrapper for Server Actions.
 * Handles DB connection, authentication, authorization, validation, and error logging.
 */
export async function createAction<I extends z.ZodType, O>(
  options: ActionOptions<I, O>,
  input: z.infer<I>
): Promise<ActionResponse<O>> {
  const { name, inputSchema, allowedRoles, handler } = options;

  try {
    // 1. Database Connection (Cached via mongoose.ts)
    await dbConnect();

    // 2. Authentication & Authorization
    const session = await getSessionAction();
    
    if (allowedRoles) {
      if (!session) {
        return { success: false, error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' };
      }
      if (!allowedRoles.includes(session.role as UserRole)) {
        logger.warn(`Access Denied [${name}]`, { userId: session.id, role: session.role });
        return { success: false, error: 'Forbidden. You do not have permission.', code: 'FORBIDDEN' };
      }
    }

    // 3. Input Validation
    let validatedInput = input;
    if (inputSchema) {
      const result = inputSchema.safeParse(input);
      if (!result.success) {
        const errorMsg = result.error.errors.map(e => e.message).join(', ');
        return { 
          success: false, 
          error: `Invalid input: ${errorMsg}`, 
          code: 'VALIDATION_ERROR' 
        };
      }
      validatedInput = result.data;
    }

    // 4. Execution
    const data = await handler(validatedInput, { user: session as any });
    
    return { success: true, data };
  } catch (error: any) {
    logger.error(`Action Failure [${name}]`, { 
      error: error.message, 
      stack: error.stack,
      input: inputSchema ? 'Redacted' : input // Be careful with logging raw input
    });
    
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred.', 
      code: 'INTERNAL_ERROR' 
    };
  }
}
