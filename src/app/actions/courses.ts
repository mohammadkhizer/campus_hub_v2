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
import { toDTO } from '@/lib/dto';
import { sendEmail, generateUpdateTemplate } from '@/lib/mail-service';
import { createAction } from '@/lib/action-factory';
import { USER_ROLES } from '@/lib/constants';

/**
 * Helper to notify all students in classrooms assigned to a course
 */
export async function notifyStudentsInCourse(courseId: string, type: 'Assignment' | 'Quiz' | 'Note' | 'Announcement', title: string, description?: string) {
  try {
    const Classroom = (await import('@/models/Classroom')).default;
    
    // 1. Get Course Info
    const course = await CourseModel.findById(courseId).select('title').lean();
    if (!course) return;

    // 2. Find all classrooms mapped to this course
    const classrooms = await Classroom.find({ courses: courseId }).populate('students', 'email').lean();
    
    // 3. Extract unique student emails
    const emails = new Set<string>();
    classrooms.forEach((cls: any) => {
      cls.students.forEach((student: any) => {
        if (student.email) emails.add(student.email);
      });
    });

    if (emails.size === 0) return;

    // 4. Send Email
    const recipientList = Array.from(emails);
    const html = generateUpdateTemplate(type, course.title, title, description);
    
    await sendEmail({
      to: recipientList,
      subject: `New ${type} in ${course.title}: ${title}`,
      html
    });

    logger.info('Student notifications sent', { courseId, type, recipientCount: recipientList.length });
  } catch (error: any) {
    logger.error('Failed to notify students', { error: error.message, courseId });
  }
}

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
  return createAction({
    name: 'getCourses',
    allowedRoles: [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async (_, { user: session }) => {
      let query: any = { institutionId: session!.institutionId };
      
      if (session!.role === 'student') {
        const Classroom = (await import('@/models/Classroom')).default;
        const classrooms = await Classroom.find({ students: session!.id, institutionId: session!.institutionId }).lean();
        const courseIds = classrooms.reduce((acc: any[], curr: any) => {
          return [...acc, ...(curr.courses || [])];
        }, []);
        query = { ...query, _id: { $in: courseIds }, isPublished: true };
      } else if (session!.role === 'teacher') {
        query = { ...query, faculty: session!.id };
      }

      const courses = await CourseModel.find(query).sort({ createdAt: -1 }).lean();
      return toDTO<any>(courses);
    }
  }, {});
}

export async function getCourseDetail(courseId: string) {
  return createAction({
    name: 'getCourseDetail',
    allowedRoles: [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({ courseId: z.string().length(24) }),
    handler: async ({ courseId }, { user: session }) => {
      const course = await CourseModel.findOne({ _id: courseId, institutionId: session!.institutionId }).lean();
      if (!course) throw new Error('Course not found or unauthorized');

      if (session!.role === 'student') {
        const Classroom = (await import('@/models/Classroom')).default;
        const isAssigned = await Classroom.exists({ courses: course._id, students: session!.id, institutionId: session!.institutionId });
        if (!isAssigned) throw new Error('Forbidden: You are not enrolled in this course.');
      } else if (session!.role === 'teacher') {
        if (course.faculty?.toString() !== session!.id) throw new Error('Forbidden: You are not the faculty for this course.');
      }

      const [notes, quizzes, assignments, announcements] = await Promise.all([
        NoteModel.find({ course: courseId, institutionId: session!.institutionId }).lean(),
        QuizModel.find({ course: courseId, institutionId: session!.institutionId }).lean(),
        AssignmentModel.find({ course: courseId, institutionId: session!.institutionId }).lean(),
        AnnouncementModel.find({ course: courseId, institutionId: session!.institutionId }).sort({ createdAt: -1 }).lean(),
      ]);

      let facultyName = 'University Faculty';
      if (course.faculty) {
        const User = (await import('@/models/User')).default;
        const faculty = await User.findById(course.faculty).select('firstName lastName').lean();
        if (faculty) {
          facultyName = `${faculty.firstName} ${faculty.lastName}`;
        }
      }

      return {
        ...toDTO<any>(course),
        facultyName,
        notes: toDTO<any>(notes),
        quizzes: toDTO<any>(quizzes),
        assignments: toDTO<any>(assignments),
        announcements: toDTO<any>(announcements),
      };
    }
  }, { courseId });
}

export async function createCourse(data: any) {
  return createAction({
    name: 'createCourse',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: CourseSchema,
    handler: async (validatedData, { user: session }) => {
      const course = await CourseModel.create({
        ...validatedData,
        institutionId: session!.institutionId
      });
      revalidatePath('/admin');
      revalidatePath('/courses');
      return { success: true, id: course._id.toString() };
    }
  }, data);
}

export async function updateCourseStatus(courseId: string, isPublished: boolean) {
  return createAction({
    name: 'updateCourseStatus',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      courseId: z.string().length(24),
      isPublished: z.boolean(),
    }),
    handler: async (validatedData, { user: session }) => {
      const updated = await CourseModel.findOneAndUpdate(
        { _id: validatedData.courseId, institutionId: session!.institutionId },
        { isPublished },
        { new: true }
      );
      if (!updated) throw new Error('Course not found or unauthorized');
      revalidatePath(`/admin`);
      revalidatePath(`/courses/${validatedData.courseId}`);
      return { success: true };
    }
  }, { courseId, isPublished });
}

export async function saveNote(data: { courseId: string; title: string; description?: string; fileUrl: string }) {
  return createAction({
    name: 'saveNote',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      courseId: z.string().length(24),
      title: z.string().min(3),
      description: z.string().optional(),
      fileUrl: z.string().url(),
    }),
    handler: async (validatedData, { user: session }) => {
      const course = await CourseModel.findOne({ _id: validatedData.courseId, institutionId: session!.institutionId }).lean();
      if (!course || (session!.role === 'teacher' && course.faculty?.toString() !== session!.id)) {
        throw new Error("You are not authorized to add materials to this course.");
      }
      await NoteModel.create({ ...validatedData, course: validatedData.courseId, fileType: 'pdf', institutionId: session!.institutionId });
      notifyStudentsInCourse(validatedData.courseId, 'Note', validatedData.title, validatedData.description);
      revalidatePath(`/courses/${validatedData.courseId}`);
      return { success: true };
    }
  }, data);
}

export async function saveAnnouncement(data: { courseId: string; title: string; content: string; attachmentUrl?: string }) {
  return createAction({
    name: 'saveAnnouncement',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      courseId: z.string().length(24),
      title: z.string().min(3),
      content: z.string().min(5),
      attachmentUrl: z.string().url().optional().or(z.literal('')),
    }),
    handler: async (validatedData, { user: session }) => {
      const course = await CourseModel.findOne({ _id: validatedData.courseId, institutionId: session!.institutionId }).lean();
      if (!course || (session!.role === 'teacher' && course.faculty?.toString() !== session!.id)) {
        throw new Error("You are not authorized to post announcements to this course.");
      }
      await AnnouncementModel.create({ ...validatedData, course: validatedData.courseId, postedBy: session!.id, institutionId: session!.institutionId });
      notifyStudentsInCourse(validatedData.courseId, 'Announcement', validatedData.title, validatedData.content);
      revalidatePath(`/courses/${validatedData.courseId}`);
      return { success: true };
    }
  }, data);
}

export async function saveAssignment(data: { courseId: string; title: string; description: string; deadline: Date; attachmentUrl?: string }) {
  return createAction({
    name: 'saveAssignment',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      courseId: z.string().length(24),
      title: z.string().min(3),
      description: z.string().min(10),
      deadline: z.coerce.date(),
      attachmentUrl: z.string().url().optional().or(z.literal('')),
    }),
    handler: async (validatedData, { user: session }) => {
      const course = await CourseModel.findOne({ _id: validatedData.courseId, institutionId: session!.institutionId }).lean();
      if (!course || (session!.role === 'teacher' && course.faculty?.toString() !== session!.id)) {
        throw new Error("You are not authorized to create assignments for this course.");
      }
      await AssignmentModel.create({ ...validatedData, course: validatedData.courseId, institutionId: session!.institutionId });
      notifyStudentsInCourse(validatedData.courseId, 'Assignment', validatedData.title, validatedData.description);
      revalidatePath(`/courses/${validatedData.courseId}`);
      return { success: true };
    }
  }, data);
}

export async function submitAssignment(data: { assignmentId: string; fileUrl: string }) {
  return createAction({
    name: 'submitAssignment',
    allowedRoles: [USER_ROLES.STUDENT],
    inputSchema: z.object({
      assignmentId: z.string().length(24),
      fileUrl: z.string().url(),
    }),
    idempotencyKey: (input, ctx) => `submit-assignment-${input.assignmentId}-${ctx.user?.id}`,
    handler: async (validatedData, { user: session }) => {
      const assignment = await AssignmentModel.findById(validatedData.assignmentId).lean();
      if (!assignment) throw new Error("Assignment not found");
      const now = new Date();
      if (now > new Date(assignment.deadline)) throw new Error("The deadline for this assignment has passed.");
      await SubmissionModel.create({ 
        ...validatedData, 
        assignment: validatedData.assignmentId, 
        student: session!.id,
        institutionId: session!.institutionId 
      });
      return { success: true };
    }
  }, data);
}

export async function getSubmissions(assignmentId: string) {
  return createAction({
    name: 'getSubmissions',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({ assignmentId: z.string().length(24) }),
    handler: async ({ assignmentId }, { user: session }) => {
      const submissions = await SubmissionModel.find({ assignment: assignmentId, institutionId: session!.institutionId }).sort({ createdAt: -1 }).lean();
      return toDTO<any>(submissions);
    }
  }, { assignmentId });
}

export async function enrollInCourse(courseId: string, studentId: string) {
  return createAction({
    name: 'enrollInCourse',
    allowedRoles: [USER_ROLES.STUDENT, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      courseId: z.string().length(24),
      studentId: z.string().length(24),
    }),
    handler: async (validatedData, { user: session }) => {
      if (session!.role === USER_ROLES.STUDENT && session!.id !== validatedData.studentId) throw new Error("Unauthorized enrollment attempt.");
      await EnrollmentModel.create({ course: validatedData.courseId, student: validatedData.studentId, institutionId: session!.institutionId });
      revalidatePath(`/courses/${validatedData.courseId}`);
      return { success: true };
    }
  }, { courseId, studentId });
}

export async function getEnrolledCourses(studentId: string) {
  return createAction({
    name: 'getEnrolledCourses',
    allowedRoles: [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({ studentId: z.string().length(24) }),
    handler: async ({ studentId }, { user: session }) => {
      const targetId = session!.role === USER_ROLES.STUDENT ? session!.id : studentId;
      const enrollments = await EnrollmentModel.find({ student: targetId, institutionId: session!.institutionId }).lean();
      const courseIds = enrollments.map((e: any) => e.course);
      const courses = await CourseModel.find({ _id: { $in: courseIds } }).lean();
      return toDTO<any>(courses);
    }
  }, { studentId });
}

export async function checkEnrollment(courseId: string, studentId: string) {
  return createAction({
    name: 'checkEnrollment',
    allowedRoles: [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      courseId: z.string().length(24),
      studentId: z.string().length(24),
    }),
    handler: async ({ courseId, studentId }, { user: session }) => {
      const enrollment = await EnrollmentModel.findOne({ course: courseId, student: studentId, institutionId: session!.institutionId });
      return !!enrollment;
    }
  }, { courseId, studentId });
}

export async function updateCourse(courseId: string, data: any) {
  return createAction({
    name: 'updateCourse',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: CourseSchema,
    handler: async (validatedData, { user: session }) => {
      const updated = await CourseModel.findOneAndUpdate(
        { _id: courseId, institutionId: session!.institutionId },
        validatedData,
        { new: true }
      );
      if (!updated) throw new Error('Course not found or unauthorized');
      revalidatePath('/admin');
      revalidatePath(`/courses/${courseId}`);
      return { success: true };
    }
  }, data);
}

export async function deleteCourse(courseId: string) {
  return createAction({
    name: 'deleteCourse',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({ courseId: z.string().length(24) }),
    handler: async ({ courseId }, { user: session }) => {
      const course = await CourseModel.findOne({ _id: courseId, institutionId: session!.institutionId });
      if (!course) throw new Error('Course not found or unauthorized');
      await Promise.all([
        CourseModel.findByIdAndDelete(courseId),
        NoteModel.deleteMany({ course: courseId, institutionId: session!.institutionId }),
        QuizModel.deleteMany({ course: courseId, institutionId: session!.institutionId }),
        AssignmentModel.deleteMany({ course: courseId, institutionId: session!.institutionId }),
        EnrollmentModel.deleteMany({ course: courseId, institutionId: session!.institutionId })
      ]);
      revalidatePath('/admin');
      revalidatePath('/courses');
      return { success: true };
    }
  }, { courseId });
}

// ======================= CRUD For Notes =======================
export async function updateNote(noteId: string, data: { courseId: string; title: string; description?: string; fileUrl?: string }) {
  return createAction({
    name: 'updateNote',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      noteId: z.string().length(24),
      courseId: z.string().length(24),
      title: z.string().min(3),
      description: z.string().optional(),
      fileUrl: z.string().url().optional(),
    }),
    handler: async (validatedData, { user: session }) => {
      const course = await CourseModel.findOne({ _id: validatedData.courseId, institutionId: session!.institutionId }).lean();
      if (!course || (session!.role === 'teacher' && course.faculty?.toString() !== session!.id)) throw new Error("Unauthorized");
      await NoteModel.findOneAndUpdate({ _id: validatedData.noteId, institutionId: session!.institutionId }, validatedData);
      revalidatePath(`/courses/${validatedData.courseId}`);
      return { success: true };
    }
  }, { noteId, ...data });
}

export async function deleteNote(noteId: string, courseId: string) {
  return createAction({
    name: 'deleteNote',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      noteId: z.string().length(24),
      courseId: z.string().length(24),
    }),
    handler: async ({ noteId, courseId }, { user: session }) => {
      const course = await CourseModel.findOne({ _id: courseId, institutionId: session!.institutionId }).lean();
      if (!course || (session!.role === 'teacher' && course.faculty?.toString() !== session!.id)) throw new Error("Unauthorized");
      await NoteModel.findOneAndDelete({ _id: noteId, institutionId: session!.institutionId });
      revalidatePath(`/courses/${courseId}`);
      return { success: true };
    }
  }, { noteId, courseId });
}

// ======================= CRUD For Announcements =======================
export async function updateAnnouncement(annId: string, data: { courseId: string; title: string; content: string; attachmentUrl?: string }) {
  return createAction({
    name: 'updateAnnouncement',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      annId: z.string().length(24),
      courseId: z.string().length(24),
      title: z.string().min(3),
      content: z.string().min(5),
      attachmentUrl: z.string().url().optional().or(z.literal('')),
    }),
    handler: async (validatedData, { user: session }) => {
      const course = await CourseModel.findOne({ _id: validatedData.courseId, institutionId: session!.institutionId }).lean();
      if (!course || (session!.role === 'teacher' && course.faculty?.toString() !== session!.id)) throw new Error("Unauthorized");
      await AnnouncementModel.findOneAndUpdate({ _id: validatedData.annId, institutionId: session!.institutionId }, validatedData);
      revalidatePath(`/courses/${validatedData.courseId}`);
      return { success: true };
    }
  }, { annId, ...data });
}

export async function deleteAnnouncement(annId: string, courseId: string) {
  return createAction({
    name: 'deleteAnnouncement',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      annId: z.string().length(24),
      courseId: z.string().length(24),
    }),
    handler: async ({ annId, courseId }, { user: session }) => {
      const course = await CourseModel.findOne({ _id: courseId, institutionId: session!.institutionId }).lean();
      if (!course || (session!.role === 'teacher' && course.faculty?.toString() !== session!.id)) throw new Error("Unauthorized");
      await AnnouncementModel.findOneAndDelete({ _id: annId, institutionId: session!.institutionId });
      revalidatePath(`/courses/${courseId}`);
      return { success: true };
    }
  }, { annId, courseId });
}

// ======================= CRUD For Assignments =======================
export async function updateAssignment(assignmentId: string, data: { courseId: string; title: string; description: string; deadline: Date; attachmentUrl?: string }) {
  return createAction({
    name: 'updateAssignment',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      assignmentId: z.string().length(24),
      courseId: z.string().length(24),
      title: z.string().min(3),
      description: z.string().min(10),
      deadline: z.coerce.date(),
      attachmentUrl: z.string().url().optional().or(z.literal('')),
    }),
    handler: async (validatedData, { user: session }) => {
      const course = await CourseModel.findOne({ _id: validatedData.courseId, institutionId: session!.institutionId }).lean();
      if (!course || (session!.role === 'teacher' && course.faculty?.toString() !== session!.id)) throw new Error("Unauthorized");
      await AssignmentModel.findOneAndUpdate({ _id: validatedData.assignmentId, institutionId: session!.institutionId }, validatedData);
      revalidatePath(`/courses/${validatedData.courseId}`);
      return { success: true };
    }
  }, { assignmentId, ...data });
}

export async function deleteAssignment(assignmentId: string, courseId: string) {
  return createAction({
    name: 'deleteAssignment',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      assignmentId: z.string().length(24),
      courseId: z.string().length(24),
    }),
    handler: async ({ assignmentId, courseId }, { user: session }) => {
      const course = await CourseModel.findOne({ _id: courseId, institutionId: session!.institutionId }).lean();
      if (!course || (session!.role === 'teacher' && course.faculty?.toString() !== session!.id)) throw new Error("Unauthorized");
      await AssignmentModel.findOneAndDelete({ _id: assignmentId, institutionId: session!.institutionId });
      await SubmissionModel.deleteMany({ assignment: assignmentId, institutionId: session!.institutionId }); 
      revalidatePath(`/courses/${courseId}`);
      return { success: true };
    }
  }, { assignmentId, courseId });
}

export async function gradeSubmission(submissionId: string, grade: string, feedback: string) {
  return createAction({
    name: 'gradeSubmission',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      submissionId: z.string().length(24),
      grade: z.string(),
      feedback: z.string(),
    }),
    handler: async (validatedData, { user: session }) => {
      const submission = await SubmissionModel.findOne({ _id: validatedData.submissionId, institutionId: session!.institutionId }).lean();
      if (!submission) throw new Error('Submission not found or unauthorized');
      await SubmissionModel.findByIdAndUpdate(validatedData.submissionId, { 
        grade: validatedData.grade, 
        feedback: validatedData.feedback, 
        status: 'graded' 
      });
      return { success: true };
    }
  }, { submissionId, grade, feedback });
}
