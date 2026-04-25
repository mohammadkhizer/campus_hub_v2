'use server';

import dbConnect from '@/lib/mongoose';
import FeedbackModel from '@/models/Feedback';
import UserModel from '@/models/User';
import { revalidatePath } from 'next/cache';

export async function serverSubmitFeedback(studentId: string, content: string, rating: number) {
  try {
    await dbConnect();
    const feedback = await FeedbackModel.create({
      student: studentId,
      content,
      rating,
      isDisplayed: false
    });
    return { success: true, id: feedback._id.toString() };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return { success: false, error: 'Failed to submit feedback' };
  }
}

export async function serverGetFeedbacks() {
  try {
    await dbConnect();
    const feedbacks = await FeedbackModel.find()
      .populate('student', 'firstName lastName email role enrollmentNumber')
      .sort({ createdAt: -1 })
      .lean();
    
    return JSON.parse(JSON.stringify(feedbacks)).map((f: any) => ({
      ...f,
      id: f._id.toString(),
      studentName: f.student ? `${f.student.firstName} ${f.student.lastName}` : 'Unknown',
      studentEnrollment: f.student?.enrollmentNumber || 'N/A'
    }));
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    return [];
  }
}

export async function serverGetDisplayedFeedbacks() {
  try {
    await dbConnect();
    const feedbacks = await FeedbackModel.find({ isDisplayed: true })
      .populate('student', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .lean();
    
    return JSON.parse(JSON.stringify(feedbacks)).map((f: any) => ({
      ...f,
      id: f._id.toString(),
      studentName: f.student ? `${f.student.firstName} ${f.student.lastName}` : 'Unknown'
    }));
  } catch (error) {
    console.error('Error fetching displayed feedbacks:', error);
    return [];
  }
}

export async function serverUpdateFeedbackStatus(feedbackId: string, isDisplayed: boolean) {
  try {
    await dbConnect();
    await FeedbackModel.findByIdAndUpdate(feedbackId, { isDisplayed });
    revalidatePath('/super-admin/feedback-management');
    return { success: true };
  } catch (error) {
    console.error('Error updating feedback status:', error);
    return { success: false };
  }
}

export async function serverDeleteFeedback(feedbackId: string) {
  try {
    await dbConnect();
    await FeedbackModel.findByIdAndDelete(feedbackId);
    revalidatePath('/super-admin/feedback-management');
    return { success: true };
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return { success: false };
  }
}
