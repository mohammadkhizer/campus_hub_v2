'use server';

import dbConnect from '@/lib/mongoose';
import ClassroomModel from '@/models/Classroom';
import CourseModel from '@/models/Course';
import UserModel from '@/models/User';
import { getSessionAction } from '@/app/actions/auth';
import { revalidatePath } from 'next/cache';

/**
 * Fetch all classrooms with populated student/course counts.
 * - Administrators see ALL classrooms.
 * - Teachers see classrooms that contain courses they are faculty of.
 */
export async function getClassrooms() {
  await dbConnect();
  const session = await getSessionAction();
  if (!session) return [];

  let query: any = {};

  if (session.role === 'teacher') {
    // Find courses assigned to this teacher
    const teacherCourses = await CourseModel.find({ faculty: session.id }).select('_id').lean();
    const courseIds = teacherCourses.map(c => c._id);
    query = { courses: { $in: courseIds } };
  }

  const classrooms = await ClassroomModel.find(query)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'firstName lastName')
    .lean();

  return JSON.parse(JSON.stringify(classrooms)).map((c: any) => ({
    ...c,
    id: c._id.toString(),
    studentIds: (c.students || []).map((s: any) => s.toString()),
    courseIds: (c.courses || []).map((co: any) => co.toString()),
    createdByName: c.createdBy ? `${c.createdBy.firstName} ${c.createdBy.lastName}` : 'System',
  }));
}

/**
 * Get a single classroom detail with fully resolved students & courses for editing.
 */
export async function getClassroomDetail(id: string) {
  await dbConnect();
  const classroom = await ClassroomModel.findById(id)
    .populate('students', 'firstName lastName email')
    .populate('courses', 'title code')
    .populate('createdBy', 'firstName lastName')
    .lean();

  if (!classroom) return null;

  return {
    ...JSON.parse(JSON.stringify(classroom)),
    id: classroom._id.toString(),
    studentIds: (classroom.students || []).map((s: any) => (s._id || s).toString()),
    courseIds: (classroom.courses || []).map((c: any) => (c._id || c).toString()),
    populatedStudents: JSON.parse(JSON.stringify(classroom.students || [])).map((s: any) => ({ ...s, id: (s._id || s).toString() })),
    populatedCourses: JSON.parse(JSON.stringify(classroom.courses || [])).map((c: any) => ({ ...c, id: (c._id || c).toString() })),
    createdByName: classroom.createdBy ? `${(classroom.createdBy as any).firstName} ${(classroom.createdBy as any).lastName}` : 'System',
  };
}

/**
 * Save (create or update) a classroom.
 * - Only administrators can CREATE classrooms.
 * - Teachers can add/remove students to classrooms containing their courses.
 * - Both administrators and teachers can assign courses.
 */
export async function saveClassroom(data: any) {
  try {
    const session = await getSessionAction();
    if (!session || (session.role !== 'administrator' && session.role !== 'teacher')) {
      return { error: 'Unauthorized: Only administrators and teachers can manage classrooms.' };
    }

    await dbConnect();
    const { id, studentIds, courseIds, ...rest } = data;

    const classroomData: any = {
      ...rest,
      students: studentIds || [],
      courses: courseIds || [],
    };

    if (id) {
      // Update existing
      const existing = await ClassroomModel.findById(id).lean();
      if (!existing) return { error: 'Classroom not found.' };

      // Teachers can only update students and courses, not name/description
      if (session.role === 'teacher') {
        await ClassroomModel.findByIdAndUpdate(id, {
          students: classroomData.students,
          courses: classroomData.courses,
        });
      } else {
        await ClassroomModel.findByIdAndUpdate(id, classroomData);
      }
    } else {
      // Create new — admin only
      if (session.role !== 'administrator') {
        return { error: 'Only administrators can create new classrooms.' };
      }
      classroomData.createdBy = session.id;
      await ClassroomModel.create(classroomData);
    }

    revalidatePath('/admin/classrooms');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving classroom:', error);
    return { error: error.message };
  }
}

/**
 * Delete a classroom — admin only.
 */
export async function deleteClassroom(id: string) {
  try {
    const session = await getSessionAction();
    if (!session || session.role !== 'administrator') {
      return { error: 'Only administrators can delete classrooms.' };
    }

    await dbConnect();
    await ClassroomModel.findByIdAndDelete(id);
    revalidatePath('/admin/classrooms');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting classroom:', error);
    return { error: error.message };
  }
}

/**
 * Returns courses filtered by the student's classroom assignment.
 */
export async function getStudentAccessibleCourses(studentId: string) {
  await dbConnect();
  // 1. Find the classroom(s) this student belongs to
  const classrooms = await ClassroomModel.find({ students: studentId }).lean();

  if (!classrooms || classrooms.length === 0) {
    return []; // No classroom, no courses (Strict security as per requirement)
  }

  // 2. Collect all course IDs from these classrooms
  const courseIds = classrooms.reduce((acc: string[], curr: any) => {
    return [...acc, ...(curr.courses || []).map((id: any) => id.toString())];
  }, []);

  // 3. Fetch these courses
  const courses = await CourseModel.find({
    _id: { $in: courseIds },
    isPublished: true
  }).lean();

  return JSON.parse(JSON.stringify(courses)).map((c: any) => ({
    ...c,
    id: c._id.toString()
  }));
}

/**
 * Get classrooms a student belongs to — for the student's classroom view.
 */
export async function getStudentClassrooms(studentId: string) {
  await dbConnect();
  const classrooms = await ClassroomModel.find({ students: studentId })
    .populate('courses', 'title code isPublished thumbnail description')
    .populate('createdBy', 'firstName lastName')
    .lean();

  return JSON.parse(JSON.stringify(classrooms)).map((c: any) => ({
    ...c,
    id: c._id.toString(),
    courseCount: (c.courses || []).length,
    studentCount: (c.students || []).length,
    createdByName: c.createdBy ? `${c.createdBy.firstName} ${c.createdBy.lastName}` : 'System',
    populatedCourses: (c.courses || []).map((co: any) => ({ ...co, id: (co._id || co).toString() })),
  }));
}

/**
 * Add a single student to a classroom — teacher action.
 */
export async function addStudentToClassroom(classroomId: string, studentId: string) {
  try {
    const session = await getSessionAction();
    if (!session || (session.role !== 'administrator' && session.role !== 'teacher')) {
      return { error: 'Unauthorized' };
    }

    await dbConnect();
    await ClassroomModel.findByIdAndUpdate(classroomId, {
      $addToSet: { students: studentId }
    });

    revalidatePath('/admin/classrooms');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Remove a single student from a classroom.
 */
export async function removeStudentFromClassroom(classroomId: string, studentId: string) {
  try {
    const session = await getSessionAction();
    if (!session || (session.role !== 'administrator' && session.role !== 'teacher')) {
      return { error: 'Unauthorized' };
    }

    await dbConnect();
    await ClassroomModel.findByIdAndUpdate(classroomId, {
      $pull: { students: studentId }
    });

    revalidatePath('/admin/classrooms');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Assign courses to a classroom — both admin and teacher.
 */
export async function assignCoursesToClassroom(classroomId: string, courseIds: string[]) {
  try {
    const session = await getSessionAction();
    if (!session || (session.role !== 'administrator' && session.role !== 'teacher')) {
      return { error: 'Unauthorized' };
    }

    await dbConnect();
    await ClassroomModel.findByIdAndUpdate(classroomId, {
      courses: courseIds
    });

    revalidatePath('/admin/classrooms');
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
