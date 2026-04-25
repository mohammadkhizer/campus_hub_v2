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
import { safeAction } from '@/lib/actions';
import { fromLean, toDTO } from '@/lib/dto';

const JWT_SECRET = env.JWT_SECRET;

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(64).regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  role: z.enum(['student', 'teacher', 'administrator', 'superadmin']).default('student'),
  enrollmentNumber: z.string().optional(),
  contactNumber: z.string().optional(),
});

const profileSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  enrollmentNumber: z.string().optional(),
  contactNumber: z.string().optional(),
  password: z.string().min(8).max(64).regex(/[A-Z]/).regex(/[0-9]/).optional().or(z.literal('')),
});

export async function loginAction(formData: FormData) {
  return safeAction(async () => {
    // Tightened Rate Limit for Login
    const rateLimit = await checkRateLimit({ limit: 3, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      logger.security('Brute-force attempt detected', { email: formData.get('email') });
      throw new Error(`Too many attempts. Try again in ${rateLimit.reset} seconds.`);
    }

    await dbConnect();
    const rawData = Object.fromEntries(formData.entries());
    const { email, password } = loginSchema.parse(rawData);

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      logger.warn('Failed login attempt', { email });
      throw new Error('Invalid credentials');
    }

    if (!JWT_SECRET) throw new Error('Server configuration error');

    // Include passwordVersion in JWT for session revocation
    const token = jwt.sign(
      { userId: user._id.toString(), pv: user.passwordVersion || 1 }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    const cookieStore = await cookies();
    cookieStore.set('authToken', token, { 
      httpOnly: true, 
      secure: env.NODE_ENV === 'production', 
      path: '/', 
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'strict'
    });

    logger.info('User logged in', { userId: user._id, email });
    return { success: true };
  }, formData, { name: 'loginAction' });
}

export async function signupAction(formData: FormData) {
  return safeAction(async () => {
    const rateLimit = await checkRateLimit({ limit: 3, windowMs: 60 * 60 * 1000 });
    if (!rateLimit.success) throw new Error('Signup limit exceeded. Please try again later.');

    await dbConnect();
    const rawData = Object.fromEntries(formData.entries());
    const data = signupSchema.parse(rawData);

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) throw new Error('Email already exists');

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await User.create({ ...data, password: hashedPassword, passwordVersion: 1 });

    const token = jwt.sign(
      { userId: user._id.toString(), pv: 1 }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    const cookieStore = await cookies();
    cookieStore.set('authToken', token, { 
      httpOnly: true, 
      secure: env.NODE_ENV === 'production', 
      path: '/', 
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'strict'
    });

    logger.security('New user registered', { userId: user._id, email: data.email, role: data.role });
    return { success: true };
  }, formData, { name: 'signupAction' });
}

export async function logoutAction() {
  return safeAction(async () => {
    const cookieStore = await cookies();
    cookieStore.delete('authToken');
    logger.info('User logged out');
    return { success: true };
  }, null, { name: 'logoutAction' });
}

export async function getSessionAction() {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    if (!token || !JWT_SECRET) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string, pv: number };
    const user = await User.findById(decoded.userId).select('-password').lean();
    
    if (!user) return null;

    // Session Revocation Check: If passwordVersion changed, invalidate the old token
    if (user.passwordVersion && decoded.pv !== user.passwordVersion) {
      logger.security('Stale session detected and revoked', { userId: user._id });
      return null;
    }
    
    return fromLean<any>(user);
  } catch (error: any) {
    logger.warn('Invalid session or session error', { error: error.message });
    return null;
  }
}

export async function updateProfileAction(data: any) {
  return safeAction(async () => {
    const session = await getSessionAction();
    if (!session) throw new Error('Unauthorized');

    await dbConnect();
    const validated = profileSchema.parse(data);

    if (validated.email !== session.email) {
      if (await User.exists({ email: validated.email })) throw new Error('Email already in use');
    }

    const updateData: any = { ...validated };
    
    // If password is changed, increment passwordVersion to invalidate all other sessions
    if (validated.password) {
      updateData.password = await bcrypt.hash(validated.password, 12);
      updateData.$inc = { passwordVersion: 1 };
      delete updateData.passwordVersion; // Use $inc instead
    } else {
      delete updateData.password;
    }

    await User.findByIdAndUpdate(session.id, updateData);
    logger.info('Profile updated', { userId: session.id, email: validated.email });
    return { success: true };
  }, data, { name: 'updateProfileAction' });
}

export async function getStudentsAction() {
  return safeAction(async () => {
    const session = await getSessionAction();
    if (!session || !['administrator', 'teacher', 'superadmin'].includes(session.role)) {
      throw new Error("Unauthorized");
    }

    await dbConnect();
    const students = await User.find({ role: 'student' }).select('-password').lean();
    return fromLean<any[]>(students);
  }, null, { name: 'getStudentsAction' });
}

export async function getUsersByRoleAction(roles: string[]) {
  return safeAction(async () => {
    const session = await getSessionAction();
    if (!session || !['administrator', 'superadmin'].includes(session.role)) {
      throw new Error("Unauthorized");
    }

    await dbConnect();
    const users = await User.find({ role: { $in: roles } }).select('-password').lean();
    return fromLean<any[]>(users);
  }, roles, { name: 'getUsersByRoleAction' });
}

export async function promoteToAdmin(email: string) {
  return safeAction(async () => {
    const session = await getSessionAction();
    if (!session || !['administrator', 'superadmin'].includes(session.role)) {
      throw new Error("Unauthorized");
    }

    await dbConnect();
    const user = await User.findOneAndUpdate({ email }, { role: 'administrator' }, { new: true });
    if (!user) throw new Error('User not found');
    
    logger.security('User promoted to Administrator', { targetEmail: email, adminEmail: session.email });
    return { success: true };
  }, email, { name: 'promoteToAdmin' });
}

export async function createTeacherAction(data: any) {
  return safeAction(async () => {
    const session = await getSessionAction();
    if (!session || !['administrator', 'superadmin'].includes(session.role)) throw new Error("Unauthorized");

    await dbConnect();
    const validated = signupSchema.parse({ ...data, role: 'teacher' });

    if (await User.exists({ email: validated.email })) throw new Error("Email already exists");

    const hashedPassword = await bcrypt.hash(validated.password, 12);
    await User.create({ ...validated, password: hashedPassword, passwordVersion: 1 });

    logger.security('New teacher created', { adminEmail: session.email });
    return { success: true };
  }, data, { name: 'createTeacherAction' });
}

export async function deleteCoordinatorAction(coordinatorId: string) {
  return safeAction(async () => {
    const session = await getSessionAction();
    if (!session || !['administrator', 'superadmin'].includes(session.role)) throw new Error("Unauthorized");

    await dbConnect();
    const user = await User.findById(coordinatorId);
    if (!user) throw new Error("Coordinator not found");

    const Course = (await import('@/models/Course')).default;
    await Course.updateMany({ faculty: coordinatorId }, { $unset: { faculty: 1 } });
    await User.findByIdAndDelete(coordinatorId);

    logger.security('Coordinator deleted', { coordinatorId, adminEmail: session.email });
    return { success: true };
  }, coordinatorId, { name: 'deleteCoordinatorAction' });
}
