import { logger } from './logger';
import { z } from 'zod';

export type ActionState<T, E = string> = {
  success?: boolean;
  data?: T;
  error?: E;
  validationErrors?: Record<string, string[] | undefined>;
};

export function createSafeAction<Input, Output>(
  schema: z.Schema<Input>,
  handler: (validatedData: Input) => Promise<Output>
) {
  return async (data: unknown): Promise<ActionState<Output>> => {
    try {
      const parsedData = schema.safeParse(data);
      if (!parsedData.success) {
        return {
          success: false,
          error: 'Validation failed',
          validationErrors: parsedData.error.flatten().fieldErrors,
        };
      }

      const result = await handler(parsedData.data);
      return { success: true, data: result };
    } catch (error: any) {
      logger.error('SafeAction Execution Error', { message: error.message, stack: error.stack });
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };
}
