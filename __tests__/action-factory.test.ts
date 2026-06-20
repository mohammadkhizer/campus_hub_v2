import { z } from 'zod';
import { createAction } from '@/lib/action-factory';
import * as auth from '@/app/actions/auth';
import { USER_ROLES } from '@/lib/constants';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the auth module to simulate session state
jest.mock('@/app/actions/auth', () => ({
  getSessionAction: jest.fn(),
}));

// Mock mongoose model interactions if necessary
jest.mock('@/lib/mongoose', () => jest.fn().mockResolvedValue(true));

describe('Action Factory (RBAC & Validation)', () => {
  const mockInputSchema = z.object({
    data: z.string().min(3),
  });

  const mockHandler = jest.fn().mockResolvedValue('success_data');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should block execution if user is unauthorized (no session) and roles are required', async () => {
    (auth.getSessionAction as jest.Mock).mockResolvedValue(null);

    const result = await createAction(
      {
        name: 'TestAction',
        allowedRoles: [USER_ROLES.STUDENT],
        handler: mockHandler,
      },
      {}
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Unauthorized/);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should block execution if user lacks the required role', async () => {
    (auth.getSessionAction as jest.Mock).mockResolvedValue({
      id: '123',
      role: USER_ROLES.STUDENT,
    });

    const result = await createAction(
      {
        name: 'TeacherAction',
        allowedRoles: [USER_ROLES.TEACHER],
        handler: mockHandler,
      },
      {}
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Forbidden/);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should allow execution if user has the correct role', async () => {
    (auth.getSessionAction as jest.Mock).mockResolvedValue({
      id: '123',
      role: USER_ROLES.TEACHER,
    });

    const result = await createAction(
      {
        name: 'TeacherAction',
        allowedRoles: [USER_ROLES.TEACHER],
        handler: mockHandler,
      },
      {}
    );

    expect(result.success).toBe(true);
    expect(result.data).toBe('success_data');
    expect(mockHandler).toHaveBeenCalled();
  });

  it('should block execution if input validation fails', async () => {
    (auth.getSessionAction as jest.Mock).mockResolvedValue({
      id: '123',
      role: USER_ROLES.STUDENT,
    });

    const result = await createAction(
      {
        name: 'ValidAction',
        inputSchema: mockInputSchema,
        allowedRoles: [USER_ROLES.STUDENT],
        handler: mockHandler,
      },
      { data: 'ab' } // Invalid input (min length is 3)
    );

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Invalid input/);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it('should succeed with valid input and correct role', async () => {
    (auth.getSessionAction as jest.Mock).mockResolvedValue({
      id: '123',
      role: USER_ROLES.STUDENT,
    });

    const result = await createAction(
      {
        name: 'ValidAction',
        inputSchema: mockInputSchema,
        allowedRoles: [USER_ROLES.STUDENT],
        handler: mockHandler,
      },
      { data: 'valid string' }
    );

    expect(result.success).toBe(true);
    expect(result.data).toBe('success_data');
    expect(mockHandler).toHaveBeenCalledWith({ data: 'valid string' }, expect.any(Object));
  });
});
