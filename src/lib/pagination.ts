/**
 * @fileOverview Production-grade pagination utilities.
 * Used across all list-returning Server Actions and API routes.
 * Enforces consistent pagination contracts to prevent unbounded DB reads.
 */

import { z } from 'zod';

/** Validated pagination input schema */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100, 'Max page size is 100')
    .default(20),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

/** Pagination metadata returned alongside data */
export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

/** Full paginated response shape */
export type PaginatedResult<T> = {
  data: T[];
  meta: PaginationMeta;
};

/**
 * Builds the `skip` offset from validated pagination params.
 */
export function getPaginationOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Assembles the standard pagination meta object.
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Convenience wrapper: given a Mongoose query factory, executes it with
 * correct skip/limit and returns a fully typed paginated result.
 *
 * @param countFn  - Async function returning total document count
 * @param queryFn  - Async function accepting (skip, limit) and returning data
 * @param params   - Raw pagination params (page, limit)
 */
export async function paginate<T>(
  countFn: () => Promise<number>,
  queryFn: (skip: number, limit: number) => Promise<T[]>,
  params: PaginationInput
): Promise<PaginatedResult<T>> {
  const { page, limit } = params;
  const skip = getPaginationOffset(page, limit);

  const [total, data] = await Promise.all([countFn(), queryFn(skip, limit)]);

  return {
    data,
    meta: buildPaginationMeta(page, limit, total),
  };
}
