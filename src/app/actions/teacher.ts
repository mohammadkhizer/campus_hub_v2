'use server';

import { createAction } from '@/lib/action-factory';
import { USER_ROLES } from '@/lib/constants';
import { toDTO } from '@/lib/dto';
import { logger } from '@/lib/logger';
import dbConnect from '@/lib/mongoose';
import CourseModel from '@/models/Course';
import AssignmentModel from '@/models/Assignment';
import SubmissionModel from '@/models/Submission';
import UserModel from '@/models/User';
import { z } from 'zod';

/**
 * Fetch all submissions for assignments belonging to courses taught by the current teacher
 */
export async function getTeacherSubmissions() {
  return createAction({
    name: 'getTeacherSubmissions',
    allowedRoles: [USER_ROLES.TEACHER],
    handler: async (_, { user: session }) => {
      const instId = session!.institutionId;

      const courses = await CourseModel.find({ 
        faculty: session!.id, 
        institutionId: instId 
      }).select('_id').lean();
      const courseIds = courses.map(c => c._id);

      const assignments = await AssignmentModel.find({ 
        course: { $in: courseIds },
        institutionId: instId
      }).select('_id title').lean();
      const assignmentIds = assignments.map(a => a._id);

      const submissions = await SubmissionModel.find({ 
        assignment: { $in: assignmentIds },
        institutionId: instId
      })
      .populate({
        path: 'student',
        select: 'firstName lastName email enrollmentNumber',
        model: UserModel
      })
      .populate({
        path: 'assignment',
        select: 'title deadline',
        model: AssignmentModel
      })
      .sort({ createdAt: -1 })
      .lean();

      return toDTO<any>(submissions);
    }
  }, {});
}

/**
 * Update submission grade/feedback
 */
export async function gradeSubmissionAction(submissionId: string, data: { grade: string, feedback: string }) {
  return createAction({
    name: 'gradeSubmissionAction',
    allowedRoles: [USER_ROLES.TEACHER],
    inputSchema: z.object({
      submissionId: z.string().length(24),
      grade: z.string().min(1),
      feedback: z.string().optional()
    }),
    handler: async ({ submissionId, grade, feedback }, { user: session }) => {
      const submission = await SubmissionModel.findOneAndUpdate(
        { _id: submissionId, institutionId: session!.institutionId },
        { 
          grade, 
          feedback,
          status: 'graded'
        },
        { new: true }
      ).lean();

      if (!submission) throw new Error('Submission not found or unauthorized');

      return { submission: toDTO<any>(submission) };
    }
  }, { submissionId, ...data });
}

export async function updateSubmissionStatusAction(submissionId: string, status: 'pending' | 'approved' | 'rejected') {
  return createAction({
    name: 'updateSubmissionStatusAction',
    allowedRoles: [USER_ROLES.TEACHER],
    inputSchema: z.object({
      submissionId: z.string().length(24),
      status: z.enum(['pending', 'approved', 'rejected'])
    }),
    handler: async ({ submissionId, status }, { user: session }) => {
      const submission = await SubmissionModel.findOneAndUpdate(
        { _id: submissionId, institutionId: session!.institutionId },
        { status },
        { new: true }
      ).lean();

      if (!submission) throw new Error('Submission not found or unauthorized');

      return { submission: toDTO<any>(submission) };
    }
  }, { submissionId, status });
}
