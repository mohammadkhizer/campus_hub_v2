'use server';

import { createAction } from '@/lib/action-factory';
import { USER_ROLES } from '@/lib/constants';
import { toDTO } from '@/lib/dto';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

const UpdateProfileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  enrollmentNumber: z.string().optional(),
  contactNumber: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional().or(z.literal('')),
});

/**
 * Get full profile of the currently logged-in user, including stats.
 */
export async function getMyProfile() {
  return createAction({
    name: 'getMyProfile',
    allowedRoles: [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async (_, { user: session }) => {
      const user = await User.findOne({ _id: session!.id, institutionId: session!.institutionId }).select('-password').lean();
      if (!user) throw new Error('User not found or unauthorized');

      const userData = toDTO<any>(user);
      let stats: Record<string, number> = {};

      const instId = session!.institutionId;

      if (session!.role === USER_ROLES.STUDENT) {
        const EnrollmentModel = (await import('@/models/Enrollment')).default;
        const AttemptModel = (await import('@/models/Attempt')).default;
        const ClassroomModel = (await import('@/models/Classroom')).default;

        const [enrollmentCount, attemptCount, classroomCount] = await Promise.all([
          EnrollmentModel.countDocuments({ student: session!.id, institutionId: instId }),
          AttemptModel.countDocuments({ student: session!.id, institutionId: instId }),
          ClassroomModel.countDocuments({ students: session!.id, institutionId: instId }),
        ]);

        stats = {
          coursesEnrolled: enrollmentCount,
          quizzesCompleted: attemptCount,
          classrooms: classroomCount,
        };
      } else if (session!.role === USER_ROLES.TEACHER) {
        const CourseModel = (await import('@/models/Course')).default;
        const ClassroomModel = (await import('@/models/Classroom')).default;
        const QuizModel = (await import('@/models/Quiz')).default;

        const teacherCourses = await CourseModel.find({ faculty: session!.id, institutionId: instId }).select('_id').lean();
        const courseIds = teacherCourses.map((c: any) => c._id);

        const [classroomCount, quizCount] = await Promise.all([
          ClassroomModel.countDocuments({ courses: { $in: courseIds }, institutionId: instId }),
          QuizModel.countDocuments({ course: { $in: courseIds }, institutionId: instId }),
        ]);

        stats = {
          coursesManaged: teacherCourses.length,
          classrooms: classroomCount,
          quizzesCreated: quizCount,
        };
      } else if (session!.role === USER_ROLES.ADMINISTRATOR) {
        const CourseModel = (await import('@/models/Course')).default;
        const ClassroomModel = (await import('@/models/Classroom')).default;
        const UserModel = (await import('@/models/User')).default;

        const [courseCount, classroomCount, userCount] = await Promise.all([
          CourseModel.countDocuments({ institutionId: instId }),
          ClassroomModel.countDocuments({ institutionId: instId }),
          UserModel.countDocuments({ institutionId: instId }),
        ]);

        stats = {
          totalCourses: courseCount,
          totalClassrooms: classroomCount,
          totalUsers: userCount,
        };
      }

      return {
        ...userData,
        stats,
      };
    }
  }, {});
}

/**
 * Update the currently logged-in user's own profile.
 */
export async function updateMyProfile(data: any) {
  return createAction({
    name: 'updateMyProfile',
    allowedRoles: [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: UpdateProfileSchema,
    handler: async (validatedData, { user: session }) => {
      const { firstName, lastName, email, enrollmentNumber, contactNumber, currentPassword, newPassword } = validatedData;

      const instId = session!.institutionId;

      // Check email uniqueness (excluding current user)
      const existing = await User.findOne({ email, _id: { $ne: session!.id } });
      if (existing) throw new Error('Email is already taken by another account.');

      // Check enrollment uniqueness
      if (enrollmentNumber && enrollmentNumber.trim() !== '') {
        const existingEnrollment = await User.findOne({ 
          enrollmentNumber: enrollmentNumber.trim(), 
          _id: { $ne: session!.id },
          institutionId: instId
        });
        if (existingEnrollment) throw new Error('Enrollment Number is already in use.');
      }

      const user = await User.findOne({ _id: session!.id, institutionId: instId });
      if (!user) throw new Error('User not found.');

      const updateData: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        enrollmentNumber: enrollmentNumber?.trim() || null,
        contactNumber: contactNumber?.trim() || null,
      };

      if (newPassword && newPassword.trim().length > 0) {
        if (!currentPassword) throw new Error('Current password is required.');
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          logger.security('Failed password change: Incorrect current password', { userId: session!.id });
          throw new Error('Current password is incorrect.');
        }
        updateData.password = await bcrypt.hash(newPassword, 12);
        updateData.$inc = { passwordVersion: 1 };
      }

      await User.findByIdAndUpdate(session!.id, updateData);
      logger.info('Profile updated', { userId: session!.id });
      revalidatePath('/profile');
      return { success: true };
    }
  }, data);
}
