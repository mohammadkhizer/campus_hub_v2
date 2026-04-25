'use server';

import dbConnect from '@/lib/mongoose';
import CourseModel from '@/models/Course';
import NoteModel from '@/models/Note';
import QuizModel from '@/models/Quiz';
import AssignmentModel from '@/models/Assignment';
import SubmissionModel from '@/models/Submission';
import EnrollmentModel from '@/models/Enrollment';
import AnnouncementModel from '@/models/Announcement';
import { getSessionAction } from '@/app/actions/auth';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { safeAction } from '@/lib/actions';
import { fromLean, toDTO } from '@/lib/dto';

const CourseSchema = z.object({
  title: z.string().min(3),
  code: z.string().min(2),
  description: z.string().min(10),
  thumbnail: z.string().url().optional().or(z.literal('')),
  faculty: z.string().length(24).nullable().optional(),
  targetLectures: z.number().min(0),
  targetAssessments: z.number().min(0),
  isPublished: z.boolean().default(false),
});

export async function getCourses() {
  return safeAction(async () => {
    const session = await getSessionAction();
    if (!session) return [];

    await dbConnect();
    let query: any = {};
    if (session.role === 'student') {
      const Classroom = (await import('@/models/Classroom')).default;
      const classrooms = await Classroom.find({ students: session.id }).lean();
      const courseIds = classrooms.reduce((acc: any[], curr: any) => [...acc, ...(curr.courses || [])], []);
      query = { _id: { $in: courseIds }, isPublished: true };
    } else if (session.role === 'teacher') {
      query = { faculty: session.id };
    } else if (['administrator', 'superadmin'].includes(session.role)) {
      query = {};
    }

    const courses = await CourseModel.find(query).sort({ createdAt: -1 }).lean();
    return fromLean<any[]>(courses);
  }, null, { name: 'getCourses' });
}

export async function getCourseDetail(courseId: string) {
  return safeAction(async () => {
    const session = await getSessionAction();
    if (!session) throw new Error("Unauthorized");

    await dbConnect();
    const course = await CourseModel.findById(courseId).lean();
    if (!course) throw new Error("Course not found");

    if (session.role === 'student') {
       const Classroom = (await import('@/models/Classroom')).default;
       if (!(await Classroom.exists({ courses: course._id, students: session.id }))) throw new Error("Access denied");
    } else if (session.role === 'teacher' && course.faculty?.toString() !== session.id) {
       throw new Error("Access denied");
    }

    const [notes, quizzes, assignments, announcements] = await Promise.all([
      NoteModel.find({ course: courseId }).lean(),
      QuizModel.find({ course: courseId }).lean(),
      AssignmentModel.find({ course: courseId }).lean(),
      AnnouncementModel.find({ course: courseId }).sort({ createdAt: -1 }).lean(),
    ]);

    let facultyName = 'University Faculty';
    if (course.faculty) {
       const User = (await import('@/models/User')).default;
       const faculty = await User.findById(course.faculty).select('firstName lastName').lean();
       if (faculty) facultyName = `${faculty.firstName} ${faculty.lastName}`;
    }

    return {
      ...fromLean<any>(course),
      facultyName,
      notes: fromLean<any[]>(notes),
      quizzes: fromLean<any[]>(quizzes),
      assignments: fromLean<any[]>(assignments),
      announcements: fromLean<any[]>(announcements),
    };
  }, courseId, { name: 'getCourseDetail' });
}

export async function createCourse(data: any) {
  return safeAction(async () => {
    const session = await getSessionAction();
    if (!['administrator', 'superadmin'].includes(session?.role || '')) throw new Error("Unauthorized");
    
    await dbConnect();
    const validated = CourseSchema.parse({
      ...data,
      targetLectures: Number(data.targetLectures) || 0,
      targetAssessments: Number(data.targetAssessments) || 0,
    });

    const course = await CourseModel.create(validated);
    logger.info('Course created', { courseId: course._id, adminEmail: session?.email });
    revalidatePath('/admin');
    revalidatePath('/courses');
    return { success: true, id: course._id.toString() };
  }, data, { name: 'createCourse' });
}

export async function updateCourseStatus(courseId: string, isPublished: boolean) {
  return safeAction(async () => {
    await dbConnect();
    await CourseModel.findByIdAndUpdate(courseId, { isPublished });
    revalidatePath(`/admin`);
    revalidatePath(`/courses/${courseId}`);
    return { success: true };
  }, { courseId, isPublished }, { name: 'updateCourseStatus' });
}

export async function saveNote(data: { courseId: string; title: string; description?: string; fileUrl: string }) {
  return safeAction(async () => {
    const session = await getSessionAction();
    if (!session || !['administrator', 'teacher', 'superadmin'].includes(session.role)) throw new Error("Unauthorized");
    
    await dbConnect();
    const course = await CourseModel.findById(data.courseId).lean();
    if (!course || (session.role === 'teacher' && course.faculty?.toString() !== session.id)) throw new Error("Unauthorized");

    await NoteModel.create({ ...data, course: data.courseId, fileType: 'pdf' });
    revalidatePath(`/courses/${data.courseId}`);
    return { success: true };
  }, data, { name: 'saveNote' });
}

export async function saveAnnouncement(data: { courseId: string; title: string; content: string; attachmentUrl?: string; adminId: string }) {
  return safeAction(async () => {
    const session = await getSessionAction();
    if (!session || !['administrator', 'teacher', 'superadmin'].includes(session.role)) throw new Error("Unauthorized");

    await dbConnect();
    const course = await CourseModel.findById(data.courseId).lean();
    if (!course || (session.role === 'teacher' && course.faculty?.toString() !== session.id)) throw new Error("Unauthorized");

    await AnnouncementModel.create({ ...data, course: data.courseId, postedBy: session.id });
    revalidatePath(`/courses/${data.courseId}`);
    return { success: true };
  }, data, { name: 'saveAnnouncement' });
}

export async function saveAssignment(data: { courseId: string; title: string; description: string; deadline: Date; attachmentUrl?: string }) {
  return safeAction(async () => {
    const session = await getSessionAction();
    if (!session || !['administrator', 'teacher', 'superadmin'].includes(session.role)) throw new Error("Unauthorized");

    await dbConnect();
    const course = await CourseModel.findById(data.courseId).lean();
    if (!course || (session.role === 'teacher' && course.faculty?.toString() !== session.id)) throw new Error("Unauthorized");

    await AssignmentModel.create({ ...data, course: data.courseId });
    revalidatePath(`/courses/${data.courseId}`);
    return { success: true };
  }, data, { name: 'saveAssignment' });
}

export async function submitAssignment(data: { assignmentId: string; studentId: string; studentName: string; fileUrl: string }) {
  return safeAction(async () => {
    await dbConnect();
    await SubmissionModel.create({ ...data, assignment: data.assignmentId, student: data.studentId });
    return { success: true };
  }, data, { name: 'submitAssignment' });
}

export async function getSubmissions(assignmentId: string) {
  return safeAction(async () => {
    await dbConnect();
    const submissions = await SubmissionModel.find({ assignment: assignmentId }).sort({ createdAt: -1 }).lean();
    return fromLean<any[]>(submissions);
  }, assignmentId, { name: 'getSubmissions' });
}

export async function gradeSubmission(submissionId: string, grade: string, feedback: string) {
  return safeAction(async () => {
    await dbConnect();
    await SubmissionModel.findByIdAndUpdate(submissionId, { grade, feedback, status: 'graded' });
    return { success: true };
  }, { submissionId, grade, feedback }, { name: 'gradeSubmission' });
}

export async function enrollInCourse(courseId: string, studentId: string) {
  return safeAction(async () => {
    const session = await getSessionAction();
    if (!session || !['student', 'superadmin'].includes(session.role)) throw new Error("Unauthorized");

    await dbConnect();
    await EnrollmentModel.create({ course: courseId, student: studentId });
    revalidatePath(`/courses/${courseId}`);
    return { success: true };
  }, { courseId, studentId }, { name: 'enrollInCourse' });
}

export async function deleteCourse(courseId: string) {
  return safeAction(async () => {
    const session = await getSessionAction();
    if (!['administrator', 'superadmin'].includes(session?.role || '')) throw new Error("Unauthorized");
    
    await dbConnect();
    await Promise.all([
      CourseModel.findByIdAndDelete(courseId),
      NoteModel.deleteMany({ course: courseId }),
      QuizModel.deleteMany({ course: courseId }),
      AssignmentModel.deleteMany({ course: courseId }),
      EnrollmentModel.deleteMany({ course: courseId })
    ]);
    
    revalidatePath('/admin');
    revalidatePath('/courses');
    return { success: true };
  }, courseId, { name: 'deleteCourse' });
}
