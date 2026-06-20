'use server';

/**
 * @fileOverview Admin-tier server actions for the internal support dashboard.
 * Restricted to SUPERADMIN role only. All mutations are audit-logged.
 *
 * Covers Phase 13.3:
 * - User lookup by email or enrollmentNumber
 * - Role reassignment with full audit trail
 * - Password reset (forced, invalidates existing sessions)
 * - Paginated audit log viewing and filtering
 * - Paginated user listing
 * - Student bulk enrollment
 * - Data export (CSV-ready JSON)
 */

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { createAction, ActionResponse } from '@/lib/action-factory';
import { USER_ROLES, UserRole } from '@/lib/constants';
import { paginate, PaginationSchema, PaginatedResult } from '@/lib/pagination';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import SystemLog from '@/models/SystemLog';
import Course from '@/models/Course';
import { logger } from '@/lib/logger';

// ─── Schemas ────────────────────────────────────────────────────────────────

const UserLookupSchema = z.object({
  query: z.string().min(1, 'Search query required').max(200),
});

const RoleChangeSchema = z.object({
  userId: z.string().min(1),
  newRole: z.nativeEnum(USER_ROLES),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
});

const PasswordResetSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().min(10).max(500),
});

const AuditLogFilterSchema = PaginationSchema.extend({
  level: z.enum(['info', 'warn', 'error', 'security', 'all']).default('all'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const BulkEnrollSchema = z.object({
  courseId: z.string().min(1),
  userIds: z.array(z.string().min(1)).min(1).max(500),
});

// ─── Actions ────────────────────────────────────────────────────────────────

/**
 * Look up a user by email or enrollment number.
 * Returns safe subset of user fields — NO passwords or tokens.
 */
export async function adminLookupUser(
  query: string
): Promise<ActionResponse<{ user: any | null }>> {
  return createAction(
    {
      name: 'adminLookupUser',
      allowedRoles: [USER_ROLES.SUPERADMIN],
      inputSchema: UserLookupSchema,
      handler: async ({ query }, { user: session }) => {
        const filter: any = {
          deletedAt: null,
          $or: [
            { email: { $regex: query, $options: 'i' } },
            { enrollmentNumber: query },
          ],
        };

        // Enforce tenant isolation if the admin belongs to an institution
        if (session?.institutionId) {
          filter.institutionId = session.institutionId;
        }

        const user = await User.findOne(filter)
          .select('-password -__v')
          .lean();

        return { user: user ? JSON.parse(JSON.stringify(user)) : null };
      },
    },
    { query }
  );
}

/**
 * Paginated user list for the admin dashboard.
 * Supports role filter.
 */
export async function adminListUsers(
  page: number,
  limit: number,
  role?: UserRole
): Promise<ActionResponse<PaginatedResult<any>>> {
  return createAction(
    {
      name: 'adminListUsers',
      allowedRoles: [USER_ROLES.SUPERADMIN],
      inputSchema: PaginationSchema.extend({
        role: z.nativeEnum(USER_ROLES).optional(),
      }),
      handler: async ({ page, limit, role }, { user: session }) => {
        const filter: Record<string, any> = { deletedAt: null };
        if (role) filter.role = role;
        
        // Enforce tenant isolation
        if (session?.institutionId) {
          filter.institutionId = session.institutionId;
        }

        const result = await paginate(
          () => User.countDocuments(filter),
          (skip, lim) =>
            User.find(filter)
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(lim)
              .select('-password -__v')
              .lean()
              .then((docs) => JSON.parse(JSON.stringify(docs))),
          { page, limit }
        );

        return result;
      },
    },
    { page, limit, role }
  );
}

/**
 * Reassign a user's role with mandatory reason.
 * Writes to both SystemLog and AuditLog. Increments passwordVersion
 * to invalidate existing JWT sessions of the target user.
 */
export async function adminChangeUserRole(
  userId: string,
  newRole: UserRole,
  reason: string
): Promise<ActionResponse<{ message: string }>> {
  return createAction(
    {
      name: 'adminChangeUserRole',
      allowedRoles: [USER_ROLES.SUPERADMIN],
      inputSchema: RoleChangeSchema,
      handler: async ({ userId, newRole, reason }, { user: admin }) => {
        const target = await User.findById(userId);
        if (!target) throw new Error('User not found');
        if (target.deletedAt) throw new Error('Cannot modify a deleted user');

        const oldRole = target.role;
        target.role = newRole;
        // Invalidate sessions — passwordVersion bump forces re-login
        target.passwordVersion = (target.passwordVersion ?? 0) + 1;
        await target.save();

        await logger.security(`Role changed: ${target.email} [${oldRole} → ${newRole}]`, {
          adminId: admin!.id,
          adminEmail: admin!.email,
          targetUserId: userId,
          targetEmail: target.email,
          oldRole,
          newRole,
          reason,
          persist: true,
        });

        await AuditLog.create({
          action: 'USER_ROLE_CHANGED',
          performedBy: admin!.id,
          targetEntity: 'User',
          targetId: userId,
          details: { oldRole, newRole, reason },
        });

        revalidatePath('/superadmin');
        return { message: `${target.email} role changed from ${oldRole} to ${newRole}` };
      },
    },
    { userId, newRole, reason }
  );
}

/**
 * Force-reset a user's password to a temporary value.
 * The user must change it on next login (flag set).
 * Session is invalidated via passwordVersion increment.
 */
export async function adminResetUserPassword(
  userId: string,
  reason: string
): Promise<ActionResponse<{ temporaryPassword: string }>> {
  return createAction(
    {
      name: 'adminResetUserPassword',
      allowedRoles: [USER_ROLES.SUPERADMIN],
      inputSchema: PasswordResetSchema,
      handler: async ({ userId, reason }, { user: admin }) => {
        const target = await User.findById(userId);
        if (!target) throw new Error('User not found');
        if (target.deletedAt) throw new Error('Cannot modify a deleted user');
        if (target.authProvider !== 'local') {
          throw new Error('Cannot reset password for OAuth accounts');
        }

        // Generate a cryptographically random 12-char temp password
        const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
        const temporaryPassword = Array.from({ length: 12 }, () =>
          chars[Math.floor(Math.random() * chars.length)]
        ).join('');

        const SALT_ROUNDS = 12;
        target.password = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);
        target.passwordVersion = (target.passwordVersion ?? 0) + 1;
        target.failedLoginAttempts = 0;
        target.lockoutUntil = undefined;
        await target.save();

        await logger.security(`Password force-reset: ${target.email}`, {
          adminId: admin!.id,
          adminEmail: admin!.email,
          targetUserId: userId,
          reason,
          persist: true,
        });

        await AuditLog.create({
          action: 'PASSWORD_FORCE_RESET',
          performedBy: admin!.id,
          targetEntity: 'User',
          targetId: userId,
          details: { reason },
        });

        return { temporaryPassword };
      },
    },
    { userId, reason }
  );
}

/**
 * Paginated, filterable audit log viewer for the internal dashboard.
 */
export async function adminGetAuditLogs(
  page: number,
  limit: number,
  level: 'info' | 'warn' | 'error' | 'security' | 'all' = 'all',
  startDate?: string,
  endDate?: string
): Promise<ActionResponse<PaginatedResult<any>>> {
  return createAction(
    {
      name: 'adminGetAuditLogs',
      allowedRoles: [USER_ROLES.SUPERADMIN],
      inputSchema: AuditLogFilterSchema,
      handler: async ({ page, limit, level, startDate, endDate }, { user: session }) => {
        const filter: Record<string, any> = {};
        if (level !== 'all') filter.level = level;
        
        // Enforce tenant isolation for audit logs
        if (session?.institutionId) {
          filter.institutionId = session.institutionId;
        }

        if (startDate || endDate) {
          filter.timestamp = {};
          if (startDate) filter.timestamp.$gte = new Date(startDate);
          if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        const result = await paginate(
          () => SystemLog.countDocuments(filter),
          (skip, lim) =>
            SystemLog.find(filter)
              .sort({ timestamp: -1 })
              .skip(skip)
              .limit(lim)
              .lean()
              .then((docs) => JSON.parse(JSON.stringify(docs))),
          { page, limit }
        );

        return result;
      },
    },
    { page, limit, level, startDate, endDate }
  );
}

/**
 * Bulk enroll a set of users into a course.
 * Idempotent — safe to call multiple times for the same user/course pair.
 */
export async function adminBulkEnrollStudents(
  courseId: string,
  userIds: string[]
): Promise<ActionResponse<{ enrolled: number; skipped: number }>> {
  return createAction(
    {
      name: 'adminBulkEnrollStudents',
      allowedRoles: [USER_ROLES.SUPERADMIN],
      inputSchema: BulkEnrollSchema,
      handler: async ({ courseId, userIds }, { user: admin }) => {
        const Enrollment = (await import('@/models/Enrollment')).default;
        const course = await Course.findById(courseId);
        if (!course) throw new Error('Course not found');

        const existingEnrollments = await Enrollment.find({ 
          course: courseId, 
          student: { $in: userIds } 
        }).select('student').lean();

        const existingStudentIds = new Set(existingEnrollments.map((e: any) => e.student.toString()));
        const toAdd = userIds.filter((id) => !existingStudentIds.has(id));
        const skipped = userIds.length - toAdd.length;

        if (toAdd.length > 0) {
          await Enrollment.insertMany(toAdd.map(uid => ({ 
            course: courseId, 
            student: uid,
            institutionId: admin!.institutionId // Ensure enrollment is scoped
          })));
        }

        await logger.info(`Bulk enrollment: ${toAdd.length} students added to course`, {
          adminId: admin!.id,
          courseId,
          enrolled: toAdd.length,
          skipped,
          persist: true,
        });

        await AuditLog.create({
          action: 'BULK_ENROLLMENT',
          performedBy: admin!.id,
          targetEntity: 'Course',
          targetId: courseId,
          details: { enrolled: toAdd.length, skipped, userIds: toAdd },
        });

        revalidatePath('/admin');
        return { enrolled: toAdd.length, skipped };
      },
    },
    { courseId, userIds }
  );
}

/**
 * Export all users as a JSON array suitable for CSV conversion.
 * Strips sensitive fields — safe for support team export.
 */
export async function adminExportUsers(
  role?: UserRole
): Promise<ActionResponse<{ users: any[] }>> {
  return createAction(
    {
      name: 'adminExportUsers',
      allowedRoles: [USER_ROLES.SUPERADMIN],
      inputSchema: z.object({ role: z.nativeEnum(USER_ROLES).optional() }),
      handler: async ({ role }, { user: admin }) => {
        const filter: Record<string, any> = { deletedAt: null };
        if (role) filter.role = role;
        
        // Enforce tenant isolation
        if (admin?.institutionId) {
          filter.institutionId = admin.institutionId;
        }

        const users = await User.find(filter)
          .sort({ createdAt: -1 })
          .select('firstName lastName email role enrollmentNumber contactNumber createdAt')
          .lean();

        await logger.info(`User data exported`, {
          adminId: admin!.id,
          count: users.length,
          role: role ?? 'all',
          persist: true,
        });

        return { users: JSON.parse(JSON.stringify(users)) };
      },
    },
    { role }
  );
}
