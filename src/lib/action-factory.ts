'use server';

import { z } from 'zod';
import dbConnect from './mongoose';
import { getSessionAction } from '@/app/actions/auth';
import { logger } from './logger';
import { UserRole, USER_ROLES } from './constants';
import { crypto } from 'next/dist/compiled/@edge-runtime/primitives';
import { withIdempotency } from './idempotency';
import { RequestContext } from './context';

/**
 * Standardized Context for all Server Actions
 */
export type ActionContext = {
  correlationId: string;
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    institutionId?: string;
  } | null;
};

/**
 * Options for creating an action
 */
type ActionOptions<I extends z.ZodType, O> = {
  name: string;
  inputSchema?: I;
  allowedRoles?: UserRole[];
  idempotencyKey?: (input: z.infer<I>, context: ActionContext) => string;
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
  const correlationId = typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).substring(7);
  const startTime = Date.now();

  try {
    // 1. Database Connection
    await dbConnect();

    // 2. Authentication & Authorization
    const session = await getSessionAction();
    
    if (allowedRoles) {
      if (!session) {
        logger.warn(`Action Unauthorized [${name}]`, { correlationId, code: 'UNAUTHORIZED' });
        return { success: false, error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' };
      }
      if (!allowedRoles.includes(session.role as UserRole)) {
        logger.warn(`Action Forbidden [${name}]`, { 
          correlationId, 
          userId: session.id, 
          role: session.role,
          code: 'FORBIDDEN' 
        });
        return { success: false, error: 'Forbidden. You do not have permission.', code: 'FORBIDDEN' };
      }

      // Mandatory Institution Scoping check (Defense in Depth)
      if (session.role !== USER_ROLES.SUPERADMIN && !session.institutionId) {
        logger.error(`Critical: Session without institutionId detected [${name}]`, { 
          correlationId, 
          userId: session.id 
        });
        return { success: false, error: 'Tenant isolation failure. Please re-login.', code: 'TENANT_ERROR' };
      }
    }

    // 3. Input Validation
    let validatedInput = input;
    if (inputSchema) {
      const result = inputSchema.safeParse(input);
      if (!result.success) {
        const errorMsg = result.error.errors.map(e => e.message).join(', ');
        logger.warn(`Action Validation Error [${name}]`, { correlationId, error: errorMsg });
        return { 
          success: false, 
          error: `Invalid input: ${errorMsg}`, 
          code: 'VALIDATION_ERROR' 
        };
      }
      validatedInput = result.data;
    }

    // 4. Execution
    const context: ActionContext = { 
      correlationId,
      user: session as any 
    };

    return await RequestContext.run({
      institutionId: session?.institutionId,
      userId: session?.id,
      role: session?.role,
      correlationId
    }, async () => {
      let data: O;
      if (options.idempotencyKey) {
        const iKey = options.idempotencyKey(validatedInput, context);
        data = await withIdempotency(iKey, 86400, () => handler(validatedInput, context));
      } else {
        data = await handler(validatedInput, context);
      }
      
      const duration = Date.now() - startTime;
      logger.info(`Action Success [${name}]`, { 
        correlationId, 
        duration: `${duration}ms`,
        userId: session?.id,
        institutionId: session?.institutionId
      });

      return { success: true, data };
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error(`Action Failure [${name}]`, { 
      correlationId,
      duration: `${duration}ms`,
      error: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      userId: (await getSessionAction())?.id // Try to get user if session failed earlier
    });
    
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred.', 
      code: 'INTERNAL_ERROR' 
    };
  }
}
