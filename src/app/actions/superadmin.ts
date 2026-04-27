'use server';

import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Course from '@/models/Course';
import Quiz from '@/models/Quiz';
import Attempt from '@/models/Attempt';
import SystemLog from '@/models/SystemLog';
import { getSessionAction } from './auth';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import { generateAnalysisReport } from '@/ai/flows/generate-analysis-report';
import { createAction, ActionResponse } from '@/lib/action-factory';
import { USER_ROLES, UserRole } from '@/lib/constants';
import { z } from 'zod';


/**
 * Super Admin: Get aggregate system statistics
 */
export async function getSystemStats(): Promise<ActionResponse<{ stats: any, recentUsers: any[] }>> {
  return createAction({
    name: 'getSystemStats',
    allowedRoles: [USER_ROLES.SUPERADMIN],
    handler: async () => {
      const [
        totalUsers,
        roleDistribution,
        totalCourses,
        totalQuizzes,
        totalAttempts,
        recentUsers
      ] = await Promise.all([
        User.countDocuments(),
        User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
        Course.countDocuments(),
        Quiz.countDocuments(),
        Attempt.countDocuments(),
        User.find().sort({ createdAt: -1 }).limit(10).select('-password').lean()
      ]);

      // Format role distribution for easier UI consumption
      const roles = {
        student: 0,
        teacher: 0,
        administrator: 0,
        superadmin: 0
      };
      roleDistribution.forEach((item: any) => {
        if (roles.hasOwnProperty(item._id)) {
          (roles as any)[item._id] = item.count;
        }
      });

      return {
        stats: {
          totalUsers,
          roles,
          totalCourses,
          totalQuizzes,
          totalAttempts,
        },
        recentUsers: JSON.parse(JSON.stringify(recentUsers))
      };
    }
  }, {});
}

/**
 * Super Admin: Update any user profile including role
 */
export async function manageUserRoleAction(userId: string, newRole: UserRole): Promise<ActionResponse<{ message: string }>> {
  return createAction({
    name: 'manageUserRoleAction',
    allowedRoles: [USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      userId: z.string().min(1),
      newRole: z.nativeEnum(USER_ROLES),
    }),
    handler: async (input, { user: admin }) => {
      const { userId, newRole } = input;
      
      const targetUser = await User.findById(userId);
      if (!targetUser) throw new Error('User not found');

      const oldRole = targetUser.role;
      targetUser.role = newRole;
      await targetUser.save();

      const logMsg = `User role manually overridden by Super Admin: ${targetUser.email} from ${oldRole} to ${newRole}`;
      logger.security(logMsg, {
        superAdmin: admin!.email,
        targetUserId: userId,
        targetEmail: targetUser.email,
        oldRole,
        newRole
      });
      
      revalidatePath('/admin');
      revalidatePath('/superadmin');
      
      return { message: `Updated ${targetUser.email} to ${newRole}` };
    }
  }, { userId, newRole });
}

/**
 * Super Admin: Get system activity logs
 */
export async function getSystemActivityLogs(): Promise<ActionResponse<{ logs: any[] }>> {
  return createAction({
    name: 'getSystemActivityLogs',
    allowedRoles: [USER_ROLES.SUPERADMIN],
    handler: async () => {
      const logs = await SystemLog.find().sort({ timestamp: -1 }).limit(100).lean();
      return { logs: JSON.parse(JSON.stringify(logs)) }; 
    }
  }, {});
}

/**
 * Super Admin: Generate an AI analysis report
 */
export async function generateSystemAnalysisAction(): Promise<ActionResponse<{ reportMarkdown: string }>> {
  return createAction({
    name: 'generateSystemAnalysisAction',
    allowedRoles: [USER_ROLES.SUPERADMIN],
    handler: async (input, { user: admin }) => {
      // 1. Gather stats
      const statsResult = await getSystemStats();
      if (!statsResult.success) throw new Error(statsResult.error);

      // 2. Gather recent logs
      const logs = await SystemLog.find().sort({ timestamp: -1 }).limit(20).lean();

      // 3. Generate Report via Genkit
      const report = await generateAnalysisReport({
        stats: statsResult.data.stats,
        recentLogs: JSON.parse(JSON.stringify(logs))
      });

      logger.info('AI System Analysis Report Generated', { admin: admin!.email, persist: true });

      return { reportMarkdown: report.reportMarkdown };
    }
  }, {});
}
