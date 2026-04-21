'use server';

import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Course from '@/models/Course';
import Quiz from '@/models/Quiz';
import Attempt from '@/models/Attempt';
import { getSessionAction } from './auth';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';

/**
 * Super Admin: Get aggregate system statistics
 */
export async function getSystemStats() {
  try {
    const session = await getSessionAction();
    if (!session || session.role !== 'superadmin') {
      return { error: 'Unauthorized. Super Admin access required.' };
    }

    await dbConnect();

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
      success: true,
      stats: {
        totalUsers,
        roles,
        totalCourses,
        totalQuizzes,
        totalAttempts,
      },
      recentUsers: JSON.parse(JSON.stringify(recentUsers))
    };
  } catch (error: any) {
    logger.error('getSystemStats error', { error: error.message });
    return { error: 'Failed to fetch system metrics.' };
  }
}

/**
 * Super Admin: Update any user profile including role
 */
export async function manageUserRoleAction(userId: string, newRole: string) {
  try {
    const session = await getSessionAction();
    if (!session || session.role !== 'superadmin') {
      return { error: 'Unauthorized.' };
    }

    await dbConnect();
    
    // Prevent self-demotion or modifying other superadmins unless strictly necessary
    // But for this task, we enable it with security logging.
    const targetUser = await User.findById(userId);
    if (!targetUser) return { error: 'User not found' };

    const oldRole = targetUser.role;
    targetUser.role = newRole;
    await targetUser.save();

    logger.security('User role manually overridden by Super Admin', {
      superAdmin: session.email,
      targetUserId: userId,
      targetEmail: targetUser.email,
      oldRole,
      newRole
    });

    revalidatePath('/admin');
    revalidatePath('/superadmin');
    return { success: true, message: `Updated ${targetUser.email} to ${newRole}` };
  } catch (error: any) {
    logger.error('manageUserRoleAction error', { error: error.message });
    return { error: 'Failed to update user role.' };
  }
}

/**
 * Super Admin: Get system activity logs (simulated or from DB if exists)
 */
export async function getSystemActivityLogs() {
  try {
    const session = await getSessionAction();
    if (!session || session.role !== 'superadmin') {
      return { error: 'Unauthorized.' };
    }

    // In a real app, we'd query a 'Logs' collection. 
    // Here we return a success with dummy data or empty array if not implemented.
    return { success: true, logs: [] }; 
  } catch (error) {
    return { error: 'Log retrieval failed.' };
  }
}
