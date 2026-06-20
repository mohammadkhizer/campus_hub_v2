import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { createAction } from '@/lib/action-factory';
import { z } from 'zod';
import { getSessionAction } from '@/app/actions/auth';
import { logger } from '@/lib/logger';
import { USER_ROLES } from '@/lib/constants';

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

jest.mock('@/app/actions/auth');
jest.mock('@/lib/mongoose', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve(true)),
}));
jest.mock('@/lib/logger');

describe('Tenant Isolation Guard (Action Factory)', () => {
  const mockAction = async (input: any) => {
    return createAction({
      name: 'testAction',
      allowedRoles: [USER_ROLES.STUDENT],
      inputSchema: z.object({ foo: z.string() }),
      handler: async (data, context) => {
        return { message: 'Success', institutionId: context.user?.institutionId };
      }
    }, input);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should block execution if session is missing institutionId', async () => {
    (getSessionAction as any).mockResolvedValue({
      id: 'user123',
      role: USER_ROLES.STUDENT,
      // institutionId is missing!
    });

    const result = await mockAction({ foo: 'bar' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('TENANT_ERROR');
    }
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Session without institutionId detected'),
      expect.any(Object)
    );
  });

  it('should allow execution if session has valid institutionId', async () => {
    (getSessionAction as any).mockResolvedValue({
      id: 'user123',
      role: USER_ROLES.STUDENT,
      institutionId: 'inst999'
    });

    const result = await mockAction({ foo: 'bar' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.institutionId).toBe('inst999');
    }
  });

  it('should allow SuperAdmin to bypass institutionId check', async () => {
    (getSessionAction as any).mockResolvedValue({
      id: 'admin1',
      role: USER_ROLES.SUPERADMIN,
      institutionId: null // SuperAdmin doesn't need it
    });

    const result = await mockAction({ foo: 'bar' });

    expect(result.success).toBe(true);
  });
});
