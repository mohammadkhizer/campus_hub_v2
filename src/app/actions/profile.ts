'use server';

import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { getSessionAction } from '@/app/actions/auth';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { z } from 'zod';

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
  const session = await getSessionAction();
  if (!session) return null;

  await dbConnect();
  const user = await User.findById(session.id).select('-password').lean();
  if (!user) return null;

  const userData = JSON.parse(JSON.stringify(user));

  // Role-specific stats
  let stats: Record<string, number> = {};

  if (session.role === 'student') {
    const EnrollmentModel = (await import('@/models/Enrollment')).default;
    const AttemptModel = (await import('@/models/Attempt')).default;
    const ClassroomModel = (await import('@/models/Classroom')).default;

    const [enrollmentCount, attemptCount, classroomCount] = await Promise.all([
      EnrollmentModel.countDocuments({ student: session.id }),
      AttemptModel.countDocuments({ studentId: session.id }),
      ClassroomModel.countDocuments({ students: session.id }),
    ]);

    stats = {
      coursesEnrolled: enrollmentCount,
      quizzesCompleted: attemptCount,
      classrooms: classroomCount,
    };
  } else if (session.role === 'teacher') {
    const CourseModel = (await import('@/models/Course')).default;
    const ClassroomModel = (await import('@/models/Classroom')).default;
    const QuizModel = (await import('@/models/Quiz')).default;

    const teacherCourses = await CourseModel.find({ faculty: session.id }).select('_id').lean();
    const courseIds = teacherCourses.map((c: any) => c._id);

    const [courseCount, classroomCount, quizCount] = await Promise.all([
      Promise.resolve(teacherCourses.length),
      ClassroomModel.countDocuments({ courses: { $in: courseIds } }),
      QuizModel.countDocuments({ course: { $in: courseIds } }),
    ]);

    stats = {
      coursesManaged: courseCount,
      classrooms: classroomCount,
      quizzesCreated: quizCount,
    };
  } else if (session.role === 'administrator') {
    const CourseModel = (await import('@/models/Course')).default;
    const ClassroomModel = (await import('@/models/Classroom')).default;
    const UserModel = (await import('@/models/User')).default;

    const [courseCount, classroomCount, userCount] = await Promise.all([
      CourseModel.countDocuments({}),
      ClassroomModel.countDocuments({}),
      UserModel.countDocuments({}),
    ]);

    stats = {
      totalCourses: courseCount,
      totalClassrooms: classroomCount,
      totalUsers: userCount,
    };
  }

  return {
    id: userData._id.toString(),
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    role: userData.role,
    enrollmentNumber: userData.enrollmentNumber,
    contactNumber: userData.contactNumber,
    createdAt: userData.createdAt,
    stats,
  };
}

/**
 * Update the currently logged-in user's own profile.
 */
export async function updateMyProfile(data: any) {
  const session = await getSessionAction();
  if (!session) {
    logger.security('Unauthenticated profile update attempt');
    return { success: false, error: 'Not authenticated.' };
  }

  await dbConnect();

  const validated = UpdateProfileSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: 'Invalid data: ' + validated.error.errors[0].message };
  }

  const { firstName, lastName, email, enrollmentNumber, contactNumber, currentPassword, newPassword } = validated.data;

  // Check email uniqueness (excluding current user)
  const existing = await User.findOne({ email, _id: { $ne: session.id } });
  if (existing) return { success: false, error: 'Email is already taken by another account.' };

  // Check enrollment uniqueness
  if (enrollmentNumber && enrollmentNumber.trim() !== '') {
    const existingEnrollment = await User.findOne({ enrollmentNumber: enrollmentNumber.trim(), _id: { $ne: session.id } });
    if (existingEnrollment) return { success: false, error: 'Enrollment Number is already in use.' };
  }

  const user = await User.findById(session.id);
  if (!user) return { success: false, error: 'User not found.' };

  const updateData: any = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim(),
    enrollmentNumber: enrollmentNumber?.trim() || null,
    contactNumber: contactNumber?.trim() || null,
  };

  // Password change — requires current password verification
  if (newPassword && newPassword.trim().length > 0) {
    if (!currentPassword) {
      return { success: false, error: 'Current password is required to set a new password.' };
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      logger.security('Failed password change attempt: Incorrect current password', { userId: session.id });
      return { success: false, error: 'Current password is incorrect.' };
    }
    updateData.password = await bcrypt.hash(newPassword, 12);
  }

  try {
    await User.findByIdAndUpdate(session.id, updateData);
    logger.info('Profile updated', { userId: session.id });
    revalidatePath('/profile');
    return { success: true };
  } catch (error: any) {
    logger.error('updateMyProfile error', { error: error.message });
    return { success: false, error: 'Profile update failed' };
  }
}
