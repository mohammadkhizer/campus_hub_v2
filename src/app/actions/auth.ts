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

export async function loginAction(formData: FormData) {
  console.log('--- [DEBUG] loginAction started ---');
  try {
    // 1. Rate Limiting
    console.log('Checking rate limit...');
    const rateLimit = await checkRateLimit({ limit: 20, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      console.log('Rate limit exceeded');
      return { error: `Too many attempts. Try again in ${rateLimit.reset} seconds.` };
    }

    // 2. Database connection
    console.log('Connecting to database...');
    await dbConnect();
    
    // 3. Validation
    console.log('Validating data...');
    const rawData = Object.fromEntries(formData.entries());
    const validated = loginSchema.safeParse(rawData);
    
    if (!validated.success) {
      console.log('Validation failed');
      return { error: 'Invalid input data' };
    }

    const { email, password } = validated.data;

    // 4. User lookup
    console.log('Looking up user:', email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      logger.warn('Failed login attempt: User not found', { email });
      return { error: 'Invalid credentials' };
    }

    // 5. Password comparison
    console.log('Comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch');
      logger.warn('Failed login attempt: Invalid password', { email });
      return { error: 'Invalid credentials' };
    }

    // 6. Token generation and Cookie setting
    console.log('Generating token...');
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is missing!');
      return { error: 'Server configuration error' };
    }

    const token = jwt.sign({ userId: user._id.toString(), pv: user.passwordVersion || 0 }, JWT_SECRET, { expiresIn: '7d' });
    
    console.log('Setting cookie...');
    const cookieStore = await cookies();
    cookieStore.set('authToken', token, { 
      httpOnly: true, 
      secure: env.NODE_ENV === 'production', 
      path: '/', 
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'strict'
    });

    console.log('Login successful');
    logger.info('User logged in', { userId: user._id, email });
    return { success: true };
  } catch (error: any) {
    console.error('--- [DEBUG] loginAction FATAL ERROR ---', error);
    logger.error('Login action error', { error: error.message, stack: error.stack });
    return { error: 'An unexpected error occurred: ' + (error.message || 'Unknown error') };
  }
}

export async function signupAction(formData: FormData) {
  try {
    // 1. Rate Limiting
    const rateLimit = await checkRateLimit({ limit: 3, windowMs: 60 * 60 * 1000 }); // 3 signups per hour per IP
    if (!rateLimit.success) {
      return { error: 'Signup limit exceeded. Please try again later.' };
    }

    await dbConnect();

    // 2. Validation
    const rawData = Object.fromEntries(formData.entries());
    const validated = signupSchema.safeParse(rawData);
    
    if (!validated.success) {
      return { error: 'Invalid input: ' + validated.error.errors[0].message };
    }

    const { email, password, firstName, lastName, role, enrollmentNumber, contactNumber } = validated.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { error: 'Email already exists' };
    }

    if (enrollmentNumber) {
      const existingEnrollment = await User.findOne({ enrollmentNumber });
      if (existingEnrollment) return { error: 'Enrollment Number already in use' };
    }

    const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      enrollmentNumber,
      contactNumber
    });

    const token = jwt.sign({ userId: user._id.toString(), pv: user.passwordVersion || 0 }, JWT_SECRET, { expiresIn: '7d' });
    const cookieStore = await cookies();
    cookieStore.set('authToken', token, { 
      httpOnly: true, 
      secure: env.NODE_ENV === 'production', 
      path: '/', 
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'strict'
    });

    logger.security('New user registered', { userId: user._id, email, role });
    return { success: true };
  } catch (error: any) {
    logger.error('Signup action error', { error: error.message, stack: error.stack });
    return { error: error.message || 'Account creation failed' };
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('authToken');
    logger.info('User logged out');
    return { success: true };
  } catch (error: any) {
    logger.error('Logout action error', { error: error.message });
    return { success: false, error: 'Logout failed' };
  }
}

export async function getSessionAction() {
  try {
    await dbConnect();
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; pv?: number };
    const user = await User.findById(decoded.userId).select('-password').lean();
    if (!user) return null;
    
    // Revoke zombie sessions if password changed
    if ((user as any).passwordVersion !== undefined && decoded.pv !== undefined) {
      if ((user as any).passwordVersion > decoded.pv) return null;
    }
    return {
      id: (user as any)._id.toString(),
      email: (user as any).email,
      firstName: (user as any).firstName,
      lastName: (user as any).lastName,
      role: (user as any).role,
      enrollmentNumber: (user as any).enrollmentNumber,
      contactNumber: (user as any).contactNumber
    };
  } catch (error: any) {
    logger.warn('Invalid session or session error', { error: error.message });
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
  try {
    const session = await getSessionAction();
    if (!session || !['administrator', 'superadmin'].includes(session.role)) {
      return [];
    }

    await dbConnect();
    const users = await User.find({ role: { $in: roles } }).select('-password').lean();
    return toDTO<any[]>(users);
  } catch (error: any) {
    logger.error('getUsersByRoleAction error', { error: error.message });
    return [];
  }
}

export async function promoteToAdmin(email: string) {
  try {
    const session = await getSessionAction();
    if (!session || !['administrator', 'superadmin'].includes(session.role)) {
      logger.security('Unauthorized promoteToAdmin attempt', { email: session?.email });
      return { success: false, error: 'Unauthorized' };
    }

    await dbConnect();
    const user = await User.findOneAndUpdate(
      { email }, 
      { role: 'administrator' },
      { new: true }
    );
    if (!user) return { success: false, error: 'User not found' };
    
    logger.security('User promoted to Administrator', { targetEmail: email, adminEmail: session.email });
    return { success: true, message: `User ${email} is now an Administrator` };
  } catch (error: any) {
    logger.error('promoteToAdmin error', { error: error.message });
    return { success: false, error: 'Operation failed' };
  }
}

export async function createTeacherAction(data: { firstName: string, lastName: string, email: string, password: string }) {
  try {
    const session = await getSessionAction();
    if (!session || !['administrator', 'superadmin'].includes(session.role)) {
      logger.security('Unauthorized createTeacherAction attempt', { adminEmail: session?.email });
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();
    
    // Basic validation for manual data object
    if (!data.email || !data.password || data.password.length < 6) {
      return { success: false, error: "Invalid input data" };
    }

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) return { success: false, error: "Email already exists" };

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const newTeacher = await User.create({
      ...data,
      password: hashedPassword,
      role: 'teacher'
    });

    logger.security('New teacher created', { teacherId: newTeacher._id, adminEmail: session.email });
    return { success: true };
  } catch (error: any) {
    logger.error('createTeacherAction error', { error: error.message });
    return { success: false, error: 'Could not create teacher' };
  }
}

export async function createStudentAction(data: { 
  firstName: string, 
  lastName: string, 
  email: string, 
  password: string,
  enrollmentNumber: string,
  contactNumber: string 
}) {
  try {
    const session = await getSessionAction();
    if (!session || !['administrator', 'teacher', 'superadmin'].includes(session.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();
    
    if (!data.email || !data.password || data.password.length < 6) {
      return { success: false, error: "Invalid email or password (min 6 chars)" };
    }

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) return { success: false, error: "Email already exists" };

    if (data.enrollmentNumber) {
      const existingEnrollment = await User.findOne({ enrollmentNumber: data.enrollmentNumber });
      if (existingEnrollment) return { success: false, error: "Enrollment Number already assigned" };
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const newStudent = await User.create({
      ...data,
      password: hashedPassword,
      role: 'student'
    });

    logger.security('New student created', { studentId: newStudent._id, creatorEmail: session.email });
    return { success: true };
  } catch (error: any) {
    logger.error('createStudentAction error', { error: error.message });
    return { success: false, error: error.message || 'Could not onboard student' };
  }
}

export async function updateCoordinatorAction(coordinatorId: string, data: { firstName: string, lastName: string, email: string, password?: string }) {
  try {
    const session = await getSessionAction();
    if (!session || !['administrator', 'superadmin'].includes(session.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();
    const existing = await User.findOne({ email: data.email, _id: { $ne: coordinatorId } });
    if (existing) return { success: false, error: "Email already in use by another user." };

    const updateData: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
    };

    if (data.password && data.password.trim().length > 0) {
      if (data.password.length < 6) return { success: false, error: "Password too short (min 6)" };
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    const updated = await User.findByIdAndUpdate(coordinatorId, updateData, { new: true }).select('-password').lean();
    if (!updated) return { success: false, error: "Coordinator not found." };

    logger.security('Coordinator updated', { coordinatorId, adminEmail: session.email });
    return { success: true };
  } catch (error: any) {
    logger.error('updateCoordinatorAction error', { error: error.message });
    return { success: false, error: "Update failed" };
  }
}

export async function deleteCoordinatorAction(coordinatorId: string) {
  try {
    const session = await getSessionAction();
    if (!session || !['administrator', 'superadmin'].includes(session.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();
    const user = await User.findById(coordinatorId);
    if (!user) return { success: false, error: "Coordinator not found." };
    if (user.role !== 'teacher') return { success: false, error: "This user is not a coordinator." };

    const Course = (await import('@/models/Course')).default;
    await Course.updateMany({ faculty: coordinatorId }, { $unset: { faculty: 1 } });

    await User.findByIdAndDelete(coordinatorId);

    logger.security('Coordinator deleted', { coordinatorId, adminEmail: session.email });
    return { success: true };
  } catch (error: any) {
    logger.error('deleteCoordinatorAction error', { error: error.message });
    return { success: false, error: "Deletion failed" };
  }
}

import { OAuth2Client } from 'google-auth-library';
export async function googleLoginAction(credential: string) {
  try {
    const rateLimit = await checkRateLimit({ limit: 5, windowMs: 60 * 1000 });
    if (!rateLimit.success) return { error: 'Rate limit exceeded' };

    await dbConnect();
    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return { error: 'Invalid Google token' };
    
    let user = await User.findOne({ email: payload.email });
    
    if (!user) {
      user = await User.create({
        email: payload.email,
        firstName: payload.given_name || 'Google User',
        lastName: payload.family_name || '',
        authProvider: 'google',
        role: 'student',
      });
    }

    const token = jwt.sign({ userId: user._id.toString(), pv: user.passwordVersion || 0 }, JWT_SECRET, { expiresIn: '7d' });
    const cookieStore = await cookies();
    cookieStore.set('authToken', token, { 
      httpOnly: true, 
      secure: env.NODE_ENV === 'production', 
      path: '/', 
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'strict'
    });

    logger.info('User logged in via Google', { userId: user._id, email: payload.email });
    return { success: true };
  } catch (error: any) {
    logger.error('Google login error', { error: error.message });
    return { error: 'Google login failed' };
  }
}
