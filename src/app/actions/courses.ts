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
  try {
    const session = await getSessionAction();
    if (!session) return [];

    await dbConnect();
    
    let query: any = {};
    if (session.role === 'student') {
      // Find classrooms student belongs to
      const Classroom = (await import('@/models/Classroom')).default;
      const classrooms = await Classroom.find({ students: session.id }).lean();
      const courseIds = classrooms.reduce((acc: any[], curr: any) => {
        return [...acc, ...(curr.courses || [])];
      }, []);
      query = { _id: { $in: courseIds }, isPublished: true };
    } else if (session.role === 'teacher') {
      query = { faculty: session.id };
    } else if (['administrator', 'superadmin'].includes(session.role)) {
      query = {}; // View all
    }

    const courses = await CourseModel.find(query).sort({ createdAt: -1 }).lean();
    return toDTO<any>(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

export async function getCourseDetail(courseId: string) {
  try {
    const session = await getSessionAction();
    if (!session) return null;

    await dbConnect();
    const course = await CourseModel.findById(courseId).lean();
    if (!course) return null;

    // Strict RBAC Access Check
    if (session.role === 'student') {
       const Classroom = (await import('@/models/Classroom')).default;
       const isAssigned = await Classroom.exists({ courses: course._id, students: session.id });
       if (!isAssigned) return null; // Forbidden
    } else if (session.role === 'teacher') {
       if (course.faculty?.toString() !== session.id) return null; // Forbidden
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
       if (faculty) {
         facultyName = `${faculty.firstName} ${faculty.lastName}`;
       }
    }

    // High-performance mapping for clean client-side hydration
    const courseDetail = {
      ...toDTO<any>(course),
      facultyName,
      notes: toDTO<any>(notes),
      quizzes: toDTO<any>(quizzes),
      assignments: toDTO<any>(assignments),
      announcements: toDTO<any>(announcements),
    };

    return courseDetail;
  } catch (error: any) {
    console.error('Error fetching course detail:', error);
    return null;
  }
}

export async function createCourse(data: any) {
  try {
    const session = await getSessionAction();
    if (!['administrator', 'superadmin'].includes(session?.role || '')) {
      logger.security('Unauthorized course creation attempt', { adminEmail: session?.email });
      return { success: false, error: "Only administrators can establish new courses." };
    }
    
    await dbConnect();
    
    const validated = CourseSchema.safeParse({
      ...data,
      targetLectures: Number(data.targetLectures) || 0,
      targetAssessments: Number(data.targetAssessments) || 0,
    });

    if (!validated.success) {
      return { success: false, error: "Invalid data: " + validated.error.errors[0].message };
    }

    const course = await CourseModel.create(validated.data);
    
    logger.info('Course created', { courseId: course._id, adminEmail: session?.email });
    revalidatePath('/admin');
    revalidatePath('/courses');
    
    return { success: true, id: course._id.toString() };
  } catch (error: any) {
    logger.error('createCourse error', { error: error.message });
    console.error('Server Action Error (createCourse):', error);
    
    // Handle Mongoose duplicate key error (code 11000)
    if (error.code === 11000) {
      return { success: false, error: "Course Code already exists. Please use a unique code." };
    }
    
    // Handle Validation Errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return { success: false, error: messages.join(', ') };
    }

    return { success: false, error: error.message || "An unexpected server error occurred." };
  }
}

export async function updateCourseStatus(courseId: string, isPublished: boolean) {
  try {
    await dbConnect();
    await CourseModel.findByIdAndUpdate(courseId, { isPublished });
    revalidatePath(`/admin`);
    revalidatePath(`/courses/${courseId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating course status:', error);
    return { success: false };
  }
}

export async function saveNote(data: { courseId: string; title: string; description?: string; fileUrl: string }) {
  try {
    const session = await getSessionAction();
    if (!session || !['administrator', 'teacher', 'superadmin'].includes(session.role)) {
      return { success: false, error: "Unauthorized" };
    }
    
    await dbConnect();
    const course = await CourseModel.findById(data.courseId).lean();
    if (!course || (session.role === 'teacher' && course.faculty?.toString() !== session.id)) {
      return { success: false, error: "You are not authorized to add materials to this course." };
    }

    await NoteModel.create({ ...data, course: data.courseId, fileType: 'pdf' });
    revalidatePath(`/courses/${data.courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error saving note:', error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

export async function saveAnnouncement(data: { courseId: string; title: string; content: string; attachmentUrl?: string; adminId: string }) {
  try {
    const session = await getSessionAction();
    if (!session || !['administrator', 'teacher', 'superadmin'].includes(session.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();
    const course = await CourseModel.findById(data.courseId).lean();
    if (!course || (session.role === 'teacher' && course.faculty?.toString() !== session.id)) {
      return { success: false, error: "You are not authorized to post announcements to this course." };
    }

    await AnnouncementModel.create({ ...data, course: data.courseId, postedBy: session.id });
    revalidatePath(`/courses/${data.courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error saving announcement:', error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

export async function saveAssignment(data: { courseId: string; title: string; description: string; deadline: Date; attachmentUrl?: string }) {
  try {
    const session = await getSessionAction();
    if (!session || !['administrator', 'teacher', 'superadmin'].includes(session.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();
    const course = await CourseModel.findById(data.courseId).lean();
    if (!course || (session.role === 'teacher' && course.faculty?.toString() !== session.id)) {
      return { success: false, error: "You are not authorized to create assignments for this course." };
    }

    await AssignmentModel.create({ ...data, course: data.courseId });
    revalidatePath(`/courses/${data.courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error saving assignment:', error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

export async function submitAssignment(data: { assignmentId: string; studentId: string; studentName: string; fileUrl: string }) {
  try {
    await dbConnect();
    await SubmissionModel.create({ ...data, assignment: data.assignmentId, student: data.studentId });
    return { success: true };
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return { success: false };
  }
}

export async function getSubmissions(assignmentId: string) {
  try {
    await dbConnect();
    const submissions = await SubmissionModel.find({ assignment: assignmentId }).sort({ createdAt: -1 }).lean();
    return submissions.map((s: any) => ({ ...s, id: s._id.toString() }));
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return [];
  }
}

export async function gradeSubmission(submissionId: string, grade: string, feedback: string) {
  try {
    await dbConnect();
    await SubmissionModel.findByIdAndUpdate(submissionId, { grade, feedback, status: 'graded' });
    return { success: true };
  } catch (error) {
    console.error('Error grading submission:', error);
    return { success: false };
  }
}

export async function enrollInCourse(courseId: string, studentId: string) {
  try {
    const session = await getSessionAction();
    if (!session || !['student', 'superadmin'].includes(session.role)) {
      return { success: false, error: "Only students can enroll in courses." };
    }

    await dbConnect();
    await EnrollmentModel.create({ course: courseId, student: studentId });
    revalidatePath(`/courses/${courseId}`);
    return { success: true };
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return { success: false };
  }
}

export async function getEnrolledCourses(studentId: string) {
  try {
    await dbConnect();
    const enrollments = await EnrollmentModel.find({ student: studentId }).lean();
    const courseIds = enrollments.map((e: any) => e.course);
    const courses = await CourseModel.find({ _id: { $in: courseIds } }).lean();
    return toDTO<any>(courses);
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    return [];
  }
}

export async function checkEnrollment(courseId: string, studentId: string) {
  try {
    await dbConnect();
    const enrollment = await EnrollmentModel.findOne({ course: courseId, student: studentId });
    return !!enrollment;
  } catch (error) {
    console.error('Error checking enrollment:', error);
    return false;
  }
}

export async function updateCourse(courseId: string, data: any) {
  try {
    const session = await getSessionAction();
    if (!['administrator', 'superadmin'].includes(session?.role || '')) {
      return { success: false, error: "Only administrators can modify course settings." };
    }
    
    await dbConnect();
    // Clean data
    const cleanData = {
      ...data,
      faculty: data.faculty === '' ? null : data.faculty,
      targetLectures: Number(data.targetLectures) || 0,
      targetAssessments: Number(data.targetAssessments) || 0,
    };
    
    await CourseModel.findByIdAndUpdate(courseId, cleanData);
    revalidatePath('/admin');
    revalidatePath(`/courses/${courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Server Action Error (updateCourse):', error);
    if (error.code === 11000) {
      return { success: false, error: "Course Code already exists." };
    }
    return { success: false, error: error.message || "Failed to update course." };
  }
}

export async function deleteCourse(courseId: string) {
  try {
    const session = await getSessionAction();
    if (!['administrator', 'superadmin'].includes(session?.role || '')) {
      return { success: false, error: "Only administrators can remove courses from the library." };
    }
    
    await dbConnect();
    // Also delete associated notes, quizzes, etc. to maintain database health
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
  } catch (error) {
    console.error('Error deleting course:', error);
    return { success: false };
  }
}

// ======================= CRUD For Notes =======================
export async function updateNote(noteId: string, data: { courseId: string; title: string; description?: string; fileUrl?: string }) {
  try {
    const session = await getSessionAction();
    if (!session || !['administrator', 'teacher', 'superadmin'].includes(session.role)) return { success: false, error: "Unauthorized" };
    
    await dbConnect();
    const course = await CourseModel.findById(data.courseId).lean();
    if (!course || (session.role === 'teacher' && course.faculty?.toString() !== session.id)) return { success: false, error: "Unauthorized" };

    await NoteModel.findByIdAndUpdate(noteId, data);
    revalidatePath(`/courses/${data.courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating note:', error);
    return { success: false, error: error.message || "Failed to update note" };
  }
}

export async function deleteNote(noteId: string, courseId: string) {
  try {
    const session = await getSessionAction();
    if (!session || !['administrator', 'teacher', 'superadmin'].includes(session.role)) return { success: false, error: "Unauthorized" };
    
    await dbConnect();
    const course = await CourseModel.findById(courseId).lean();
    if (!course || (session.role === 'teacher' && course.faculty?.toString() !== session.id)) return { success: false, error: "Unauthorized" };

    await NoteModel.findByIdAndDelete(noteId);
    revalidatePath(`/courses/${courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting note:', error);
    return { success: false, error: error.message || "Failed to delete note" };
  }
}

// ======================= CRUD For Announcements =======================
export async function updateAnnouncement(annId: string, data: { courseId: string; title: string; content: string; attachmentUrl?: string }) {
  try {
    const session = await getSessionAction();
    if (!session || !['administrator', 'teacher', 'superadmin'].includes(session.role)) return { success: false, error: "Unauthorized" };
    
    await dbConnect();
    const course = await CourseModel.findById(data.courseId).lean();
    if (!course || (session.role === 'teacher' && course.faculty?.toString() !== session.id)) return { success: false, error: "Unauthorized" };

    await AnnouncementModel.findByIdAndUpdate(annId, data);
    revalidatePath(`/courses/${data.courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating announcement:', error);
    return { success: false, error: error.message || "Failed to update announcement" };
  }
}

export async function deleteAnnouncement(annId: string, courseId: string) {
  try {
    const session = await getSessionAction();
    if (!session || !['administrator', 'teacher', 'superadmin'].includes(session.role)) return { success: false, error: "Unauthorized" };
    
    await dbConnect();
    const course = await CourseModel.findById(courseId).lean();
    if (!course || (session.role === 'teacher' && course.faculty?.toString() !== session.id)) return { success: false, error: "Unauthorized" };

    await AnnouncementModel.findByIdAndDelete(annId);
    revalidatePath(`/courses/${courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting announcement:', error);
    return { success: false, error: error.message || "Failed to delete announcement" };
  }
}

// ======================= CRUD For Assignments =======================
export async function updateAssignment(assignmentId: string, data: { courseId: string; title: string; description: string; deadline: Date; attachmentUrl?: string }) {
  try {
    const session = await getSessionAction();
    if (!session || !['administrator', 'teacher', 'superadmin'].includes(session.role)) return { success: false, error: "Unauthorized" };
    
    await dbConnect();
    const course = await CourseModel.findById(data.courseId).lean();
    if (!course || (session.role === 'teacher' && course.faculty?.toString() !== session.id)) return { success: false, error: "Unauthorized" };

    await AssignmentModel.findByIdAndUpdate(assignmentId, data);
    revalidatePath(`/courses/${data.courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating assignment:', error);
    return { success: false, error: error.message || "Failed to update assignment" };
  }
}

export async function deleteAssignment(assignmentId: string, courseId: string) {
  try {
    const session = await getSessionAction();
    if (!session || !['administrator', 'teacher', 'superadmin'].includes(session.role)) return { success: false, error: "Unauthorized" };
    
    await dbConnect();
    const course = await CourseModel.findById(courseId).lean();
    if (!course || (session.role === 'teacher' && course.faculty?.toString() !== session.id)) return { success: false, error: "Unauthorized" };

    await AssignmentModel.findByIdAndDelete(assignmentId);
    await SubmissionModel.deleteMany({ assignment: assignmentId }); // Cascade delete submissions
    revalidatePath(`/courses/${courseId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting assignment:', error);
    return { success: false, error: error.message || "Failed to delete assignment" };
  }
}
