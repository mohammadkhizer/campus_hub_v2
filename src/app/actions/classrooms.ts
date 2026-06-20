'use server';

import dbConnect from '@/lib/mongoose';
import ClassroomModel from '@/models/Classroom';
import CourseModel from '@/models/Course';
import { revalidatePath } from 'next/cache';
import { toDTO } from '@/lib/dto';
import { createAction } from '@/lib/action-factory';
import { USER_ROLES } from '@/lib/constants';
import { z } from 'zod';
export async function getClassrooms() {
  return createAction({
    name: 'getClassrooms',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async (_, { user: session }) => {
      let query: any = { institutionId: session!.institutionId };

      if (session!.role === USER_ROLES.TEACHER) {
        const teacherCourses = await CourseModel.find({ 
          faculty: session!.id, 
          institutionId: session!.institutionId 
        }).select('_id').lean();
        const courseIds = teacherCourses.map((c: any) => c._id);
        query.courses = { $in: courseIds };
      }

      const classrooms = await ClassroomModel.find(query)
        .sort({ createdAt: -1 })
        .populate('createdBy', 'firstName lastName')
        .lean();
        
      const dtoClassrooms = toDTO<any[]>(classrooms);

      return dtoClassrooms.map((c: any) => ({
        ...c,
        studentIds: (c.students || []).map((s: any) => s.toString()),
        courseIds: (c.courses || []).map((co: any) => co.toString()),
        createdByName: c.createdByName || (c.createdBy ? `${c.createdBy.firstName} ${c.createdBy.lastName}` : 'System'),
      }));
    }
  }, {});
}

/**
 * Get a single classroom detail with fully resolved students & courses for editing.
 */
export async function getClassroomDetail(id: string) {
  return createAction({
    name: 'getClassroomDetail',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({ id: z.string().length(24) }),
    handler: async ({ id }, { user: session }) => {
      const classroom = await ClassroomModel.findOne({ _id: id, institutionId: session!.institutionId })
        .populate('students', 'firstName lastName email')
        .populate('courses', 'title code')
        .populate('createdBy', 'firstName lastName')
        .lean();

      if (!classroom) throw new Error('Classroom not found or unauthorized');

      const dto = toDTO<any>(classroom);

      return {
        ...dto,
        studentIds: (dto.students || []).map((s: any) => (s.id || s).toString()),
        courseIds: (dto.courses || []).map((c: any) => (c.id || c).toString()),
        populatedStudents: (dto.students || []).map((s: any) => ({ ...s, id: (s.id || s).toString() })),
        populatedCourses: (dto.courses || []).map((c: any) => ({ ...c, id: (c.id || c).toString() })),
        createdByName: dto.createdBy ? `${dto.createdBy.firstName} ${dto.createdBy.lastName}` : 'System',
      };
    }
  }, { id });
}

/**
 * Save (create or update) a classroom.
 * - Only administrators can CREATE classrooms.
 * - Teachers can add/remove students to classrooms containing their courses.
 * - Both administrators and teachers can assign courses.
 */
export async function saveClassroom(data: any) {
  return createAction({
    name: 'saveClassroom',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async (rawInput, { user: session }) => {
      const { id, studentIds, courseIds, ...rest } = rawInput;

      const classroomData: any = {
        ...rest,
        students: studentIds || [],
        courses: courseIds || [],
        institutionId: session!.institutionId
      };

      if (id) {
        const existing = await ClassroomModel.findOne({ _id: id, institutionId: session!.institutionId }).lean();
        if (!existing) throw new Error('Classroom not found or unauthorized');

        if (session!.role === USER_ROLES.TEACHER) {
          await ClassroomModel.findByIdAndUpdate(id, {
            students: classroomData.students,
            courses: classroomData.courses,
          });
        } else {
          await ClassroomModel.findByIdAndUpdate(id, classroomData);
        }
      } else {
        if (session!.role !== USER_ROLES.ADMINISTRATOR && session!.role !== USER_ROLES.SUPERADMIN) {
          throw new Error('Unauthorized to create classrooms.');
        }
        classroomData.createdBy = session!.id;
        await ClassroomModel.create(classroomData);
      }

      revalidatePath('/admin/classrooms');
      revalidatePath('/dashboard');
      return { success: true };
    }
  }, data);
}

export async function deleteClassroom(id: string) {
  return createAction({
    name: 'deleteClassroom',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({ id: z.string().length(24) }),
    handler: async ({ id }, { user: session }) => {
      const deleted = await ClassroomModel.findOneAndDelete({ _id: id, institutionId: session!.institutionId });
      if (!deleted) throw new Error('Classroom not found or unauthorized');
      revalidatePath('/admin/classrooms');
      return { success: true };
    }
  }, { id });
}

/**
 * Returns courses filtered by the student's classroom assignment.
 */
export async function getStudentAccessibleCourses(studentId: string) {
  return createAction({
    name: 'getStudentAccessibleCourses',
    allowedRoles: [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async ({ studentId }, { user: session }) => {
      const targetId = session!.role === USER_ROLES.STUDENT ? session!.id : studentId;
      const classrooms = await ClassroomModel.find({ students: targetId, institutionId: session!.institutionId }).lean();

      if (!classrooms || classrooms.length === 0) return [];

      const courseIds = classrooms.reduce((acc: string[], curr: any) => {
        return [...acc, ...(curr.courses || []).map((id: any) => id.toString())];
      }, []);

      const courses = await CourseModel.find({
        _id: { $in: courseIds },
        institutionId: session!.institutionId,
        isPublished: true
      }).lean();

      return toDTO<any>(courses);
    }
  }, { studentId });
}

export async function getStudentClassrooms(studentId: string) {
  return createAction({
    name: 'getStudentClassrooms',
    allowedRoles: [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async ({ studentId }, { user: session }) => {
      const targetId = session!.role === USER_ROLES.STUDENT ? session!.id : studentId;
      const classrooms = await ClassroomModel.find({ students: targetId, institutionId: session!.institutionId })
        .populate('courses', 'title code isPublished thumbnail description')
        .populate('createdBy', 'firstName lastName')
        .lean();

      return toDTO<any>(classrooms).map((c: any) => ({
        ...c,
        courseCount: (c.courses || []).length,
        studentCount: (c.students || []).length,
        createdByName: c.createdBy ? `${c.createdBy.firstName} ${c.createdBy.lastName}` : 'System',
        populatedCourses: (c.courses || []).map((co: any) => ({ ...co, id: (co._id || co).toString() })),
      }));
    }
  }, { studentId });
}

export async function addStudentToClassroom(classroomId: string, studentId: string) {
  return createAction({
    name: 'addStudentToClassroom',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async ({ classroomId, studentId }, { user: session }) => {
      const updated = await ClassroomModel.findOneAndUpdate(
        { _id: classroomId, institutionId: session!.institutionId },
        { $addToSet: { students: studentId } }
      );
      if (!updated) throw new Error('Classroom not found or unauthorized');
      revalidatePath('/admin/classrooms');
      return { success: true };
    }
  }, { classroomId, studentId });
}

export async function removeStudentFromClassroom(classroomId: string, studentId: string) {
  return createAction({
    name: 'removeStudentFromClassroom',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async ({ classroomId, studentId }, { user: session }) => {
      const updated = await ClassroomModel.findOneAndUpdate(
        { _id: classroomId, institutionId: session!.institutionId },
        { $pull: { students: studentId } }
      );
      if (!updated) throw new Error('Classroom not found or unauthorized');
      revalidatePath('/admin/classrooms');
      return { success: true };
    }
  }, { classroomId, studentId });
}

export async function assignCoursesToClassroom(classroomId: string, courseIds: string[]) {
  return createAction({
    name: 'assignCoursesToClassroom',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async ({ classroomId, courseIds }, { user: session }) => {
      const updated = await ClassroomModel.findOneAndUpdate(
        { _id: classroomId, institutionId: session!.institutionId },
        { courses: courseIds }
      );
      if (!updated) throw new Error('Classroom not found or unauthorized');
      revalidatePath('/admin/classrooms');
      return { success: true };
    }
  }, { classroomId, courseIds });
}
