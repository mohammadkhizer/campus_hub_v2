'use server';

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { env } from '@/lib/env';
import { toDTO } from '@/lib/dto';
import { createAction, ActionResponse } from '@/lib/action-factory';
import { USER_ROLES } from '@/lib/constants';
import AuditLog from '@/models/AuditLog';
import { headers } from 'next/headers';

const JWT_SECRET = env.JWT_SECRET;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  role: z.nativeEnum(USER_ROLES).default(USER_ROLES.STUDENT),
  enrollmentNumber: z.string().optional(),
  contactNumber: z.string().optional(),
});

import { signIn, signOut } from '@/auth';

export async function loginAction(formData: FormData) {
  try {
    const rateLimit = await checkRateLimit({ limit: 5, windowMs: 60 * 1000 });
    if (!rateLimit.success) return { error: 'Too many attempts.' };

    const rawData = Object.fromEntries(formData.entries());
    const validated = loginSchema.safeParse(rawData);
    if (!validated.success) return { error: 'Invalid input' };

    const { email, password } = validated.data;

    await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error: any) {
    if (error.type === 'CredentialsSignin') return { error: 'Invalid credentials' };
    return { error: error.message || 'Login failed' };
  }
}

export async function logoutAction() {
  await signOut();
}

export async function signupAction(formData: FormData) {
  try {
    const rateLimit = await checkRateLimit({ limit: 3, windowMs: 60 * 60 * 1000 });
    if (!rateLimit.success) return { error: 'Signup limit exceeded.' };

    await dbConnect();
    const rawData = Object.fromEntries(formData.entries());
    const validated = signupSchema.safeParse(rawData);
    
    if (!validated.success) return { error: 'Invalid input' };

    const { email, password, firstName, lastName, enrollmentNumber, contactNumber } = validated.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) return { error: 'Email already exists' };

    if (enrollmentNumber) {
      const existingEnrollment = await User.findOne({ enrollmentNumber });
      if (existingEnrollment) return { error: 'Enrollment Number already in use' };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: USER_ROLES.STUDENT,
      enrollmentNumber,
      contactNumber
    });

    logger.security('New user registered', { userId: user._id, email });
    
    return { success: true };
  } catch (error: any) {
    logger.error('Signup action error', { error: error.message });
    return { error: 'Account creation failed' };
  }
}

import { auth } from '@/auth';

export async function getSessionAction() {
  try {
    const session = await auth();
    if (!session || !session.user) return null;

    // Hardening: Verify user still exists and is not locked out
    // This catches revoked users before the JWT expires
    await dbConnect();
    const user = await User.findById(session.user.id).select('role institutionId passwordVersion lockoutUntil').lean();
    
    if (!user) return null;

    // Check for account lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      logger.warn('Session rejected: Account locked', { userId: user._id });
      return null;
    }

    // Check password version (revocation support)
    if ((session.user as any).passwordVersion !== user.passwordVersion) {
      logger.warn('Session rejected: Password version mismatch', { userId: user._id });
      return null;
    }

    return {
      id: user._id.toString(),
      email: session.user.email as string,
      name: session.user.name as string,
      role: user.role,
      institutionId: user.institutionId?.toString(),
      passwordVersion: user.passwordVersion
    };
  } catch (error: any) {
    logger.warn('Session retrieval error', { error: error.message });
    return null;
  }
}

export async function updateProfileAction(data: { 
  firstName: string, 
  lastName: string, 
  email: string, 
  enrollmentNumber?: string, 
  contactNumber?: string,
  password?: string 
}): Promise<ActionResponse<{ success: boolean }>> {
  return createAction({
    name: 'updateProfileAction',
    allowedRoles: [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      email: z.string().email(),
      enrollmentNumber: z.string().optional(),
      contactNumber: z.string().optional(),
      password: z.string().min(6).optional().or(z.literal('')),
    }),
    handler: async (validatedData, { user: session }) => {
      // Check for email collision
      if (validatedData.email !== session!.email) {
        const existing = await User.findOne({ email: validatedData.email });
        if (existing) throw new Error('Email already in use');
      }

      // Check for enrollment collision
      if (validatedData.enrollmentNumber && validatedData.enrollmentNumber !== (session as any).enrollmentNumber) {
        const existing = await User.findOne({ enrollmentNumber: validatedData.enrollmentNumber });
        if (existing) throw new Error('Enrollment Number already in use');
      }

      const updateData: any = {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        enrollmentNumber: validatedData.enrollmentNumber,
        contactNumber: validatedData.contactNumber,
      };

      if (validatedData.password && validatedData.password.trim().length > 0) {
        updateData.password = await bcrypt.hash(validatedData.password, 12);
        updateData.$inc = { passwordVersion: 1 };
      }

      await User.findByIdAndUpdate(session!.id, updateData);
      logger.info('Profile updated', { userId: session!.id, email: validatedData.email });
      
      return { success: true };
    }
  }, data);
}


export async function getStudentsAction(): Promise<any[]> {
  const result = await createAction({
    name: 'getStudentsAction',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.TEACHER, USER_ROLES.SUPERADMIN],
    handler: async () => {
      const students = await User.find({ role: USER_ROLES.STUDENT }).select('-password').lean();
      return JSON.parse(JSON.stringify(students)).map((s: any) => ({
        ...s,
        id: s._id.toString()
      }));
    }
  }, {});
  
  if (!result.success) return [];
  return result.data;
}

export async function getUsersByRoleAction(roles: string[]) {
  return createAction({
    name: 'getUsersByRoleAction',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({ roles: z.array(z.string()) }),
    handler: async ({ roles }, { user: session }) => {
      const users = await User.find({ 
        role: { $in: roles }, 
        institutionId: session!.institutionId 
      }).select('-password').lean();
      return toDTO<any[]>(users);
    }
  }, { roles });
}

export async function promoteToAdmin(email: string) {
  return createAction({
    name: 'promoteToAdmin',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({ email: z.string().email() }),
    handler: async ({ email }, { user: admin }) => {
      const filter: any = { email };
      if (admin?.institutionId) filter.institutionId = admin.institutionId;

      const user = await User.findOneAndUpdate(
        filter, 
        { role: USER_ROLES.ADMINISTRATOR },
        { new: true }
      );
      if (!user) throw new Error('User not found in your institution');
      
      logger.security('User promoted to Administrator', { targetEmail: email, adminEmail: admin!.email });
      return { success: true, message: `User ${email} is now an Administrator` };
    }
  }, { email });
}

export async function createTeacherAction(data: { firstName: string, lastName: string, email: string, password: string }) {
  return createAction({
    name: 'createTeacherAction',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
    }),
    handler: async (validatedData, { user: admin }) => {
      const existingUser = await User.findOne({ email: validatedData.email });
      if (existingUser) throw new Error("Email already exists");

      const hashedPassword = await bcrypt.hash(validatedData.password, 12);
      const newTeacher = await User.create({
        ...validatedData,
        password: hashedPassword,
        role: USER_ROLES.TEACHER,
        institutionId: admin!.institutionId // Inherit institution from creator
      });

      logger.security('New teacher created', { teacherId: newTeacher._id, adminEmail: admin!.email });
      return { success: true };
    }
  }, data);
}

export async function createStudentAction(data: { 
  firstName: string, 
  lastName: string, 
  email: string, 
  password: string,
  enrollmentNumber: string,
  contactNumber: string 
}) {
  return createAction({
    name: 'createStudentAction',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.TEACHER, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      enrollmentNumber: z.string().min(1),
      contactNumber: z.string().min(1),
    }),
    handler: async (validatedData, { user: creator }) => {
      const existingUser = await User.findOne({ email: validatedData.email });
      if (existingUser) throw new Error("Email already exists");

      if (validatedData.enrollmentNumber) {
        const existingEnrollment = await User.findOne({ enrollmentNumber: validatedData.enrollmentNumber });
        if (existingEnrollment) throw new Error("Enrollment Number already assigned");
      }

      const hashedPassword = await bcrypt.hash(validatedData.password, 12);
      const newStudent = await User.create({
        ...validatedData,
        password: hashedPassword,
        role: USER_ROLES.STUDENT,
        institutionId: creator!.institutionId // Inherit institution
      });

      logger.security('New student created', { studentId: newStudent._id, creatorEmail: creator!.email });
      return { success: true };
    }
  }, data);
}

export async function updateCoordinatorAction(coordinatorId: string, data: { firstName: string, lastName: string, email: string, password?: string }) {
  return createAction({
    name: 'updateCoordinatorAction',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      firstName: z.string().min(2),
      lastName: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6).optional().or(z.literal('')),
    }),
    handler: async (validatedData, { user: admin }) => {
      // Ensure the coordinator belongs to the same institution
      const filter: any = { _id: coordinatorId };
      if (admin?.institutionId) filter.institutionId = admin.institutionId;

      const target = await User.findOne(filter);
      if (!target) throw new Error("Coordinator not found or unauthorized");

      const emailCollision = await User.findOne({ 
        email: validatedData.email, 
        _id: { $ne: coordinatorId } 
      });
      if (emailCollision) throw new Error("Email already in use by another user.");

      const updateData: any = {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
      };

      if (validatedData.password && validatedData.password.trim().length > 0) {
        updateData.password = await bcrypt.hash(validatedData.password, 12);
        updateData.$inc = { passwordVersion: 1 };
      }

      await User.findByIdAndUpdate(coordinatorId, updateData);
      logger.security('Coordinator updated', { coordinatorId, adminEmail: admin!.email });
      return { success: true };
    }
  }, data);
}

export async function deleteCoordinatorAction(coordinatorId: string) {
  return createAction({
    name: 'deleteCoordinatorAction',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async (_, { user: admin }) => {
      const filter: any = { _id: coordinatorId };
      if (admin?.institutionId) filter.institutionId = admin.institutionId;

      const user = await User.findOne(filter);
      if (!user) throw new Error("Coordinator not found or unauthorized");
      if (user.role !== USER_ROLES.TEACHER) throw new Error("This user is not a coordinator.");

      const Course = (await import('@/models/Course')).default;
      await Course.updateMany({ faculty: coordinatorId }, { $unset: { faculty: 1 } });

      await User.findByIdAndDelete(coordinatorId);

      logger.security('Coordinator deleted', { coordinatorId, adminEmail: admin!.email });
      return { success: true };
    }
  }, {});
}


