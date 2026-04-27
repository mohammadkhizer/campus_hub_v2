'use server';

import dbConnect from '@/lib/mongoose';
import CourseModel from '@/models/Course';
import AssignmentModel from '@/models/Assignment';
import SubmissionModel from '@/models/Submission';
import UserModel from '@/models/User';
import { getSessionAction } from '@/app/actions/auth';
import { toDTO } from '@/lib/dto';
import { logger } from '@/lib/logger';

/**
 * Fetch all submissions for assignments belonging to courses taught by the current teacher
 */
export async function getTeacherSubmissions() {
  try {
    const session = await getSessionAction();
    if (!session || session.role !== 'teacher') {
      throw new Error('Unauthorized');
    }

    await dbConnect();

    // 1. Find all courses taught by this teacher
    const courses = await CourseModel.find({ faculty: session.id }).select('_id').lean();
    const courseIds = courses.map(c => c._id);

    // 2. Find all assignments for these courses
    const assignments = await AssignmentModel.find({ course: { $in: courseIds } }).select('_id title').lean();
    const assignmentIds = assignments.map(a => a._id);

    // 3. Find all submissions for these assignments
    // Populate student and assignment details
    const submissions = await SubmissionModel.find({ assignment: { $in: assignmentIds } })
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
  } catch (error: any) {
    logger.error('Error fetching teacher submissions:', { error: error.message || error });
    return [];
  }
}

/**
 * Update submission grade/feedback
 */
export async function gradeSubmissionAction(submissionId: string, data: { grade: string, feedback: string }) {
  try {
    const session = await getSessionAction();
    if (!session || session.role !== 'teacher') {
      throw new Error('Unauthorized');
    }

    await dbConnect();
    
    const submission = await SubmissionModel.findByIdAndUpdate(
      submissionId,
      { 
        grade: data.grade, 
        feedback: data.feedback,
        status: 'graded'
      },
      { new: true }
    );

    return { success: true, submission: toDTO<any>(submission) };
  } catch (error: any) {
    logger.error('Error grading submission:', { error: error.message || error });
    return { success: false, error: 'Failed to update grade' };
  }
}

/**
 * Update submission status explicitly
 */
export async function updateSubmissionStatusAction(submissionId: string, status: 'pending' | 'approved' | 'rejected') {
  try {
    const session = await getSessionAction();
    if (!session || session.role !== 'teacher') {
      throw new Error('Unauthorized');
    }

    await dbConnect();
    
    const submission = await SubmissionModel.findByIdAndUpdate(
      submissionId,
      { status },
      { new: true }
    );

    return { success: true, submission: toDTO<any>(submission) };
  } catch (error: any) {
    logger.error('Error updating submission status:', { error: error.message || error });
    return { success: false, error: 'Failed to update status' };
  }
}
