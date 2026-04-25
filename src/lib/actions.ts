import { logger } from './logger';
import { z } from 'zod';

export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
};

/**
 * A standardized wrapper for Next.js Server Actions to provide consistent
 * error handling, logging, and response formatting.
 */
export async function safeAction<T, P>(
  action: (params: P) => Promise<T>,
  params: P,
  context: { name: string; schema?: z.ZodSchema }
): Promise<ActionResponse<T>> {
  try {
    // 1. Optional Validation
    if (context.schema) {
      const validated = context.schema.safeParse(params);
      if (!validated.success) {
        logger.warn(`Validation failed for ${context.name}`, { 
          errors: validated.error.errors[0].message 
        });
        return { 
          success: false, 
          error: `Invalid input: ${validated.error.errors[0].message}`,
          code: 'VALIDATION_ERROR'
        };
      }
    }

    // 2. Execute Action
    const result = await action(params);

    return { success: true, data: result };
  } catch (error: any) {
    // 3. Centralized Error Handling
    const errorMessage = error.message || 'An unexpected server error occurred';
    
    logger.error(`Server Action Error (${context.name})`, { 
      message: errorMessage, 
      stack: error.stack 
    });

    // Handle specific errors (e.g. Mongoose duplicate key)
    if (error.code === 11000) {
      return { 
        success: false, 
        error: 'A record with this unique value already exists.',
        code: 'DUPLICATE_KEY_ERROR'
      };
    }

    return { 
      success: false, 
      error: errorMessage,
      code: error.code || 'INTERNAL_SERVER_ERROR'
    };
  }
}
