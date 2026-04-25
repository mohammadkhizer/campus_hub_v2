'use server';

import { Quiz, QuizAttempt } from './types';
import { serverGetQuizzes, serverGetQuiz, serverSaveQuiz, serverDeleteQuiz, serverGetAttempts, serverSaveAttempt, serverGetAllAttempts, serverGetQuizAttempts, serverDeleteAttempt } from '@/app/actions/quizzes';
import { serverSubmitFeedback, serverGetFeedbacks, serverGetDisplayedFeedbacks, serverUpdateFeedbackStatus, serverDeleteFeedback } from '@/app/actions/feedback';
import { serverGetAnalyticsData } from '@/app/actions/analytics';

// -- QUIZZES VIA MONGODB -- //

export const getQuizzes = async (adminId?: string): Promise<Quiz[]> => {
  const res = await serverGetQuizzes(adminId);
  return res.success && res.data ? res.data : [];
};

export const getQuiz = async (id: string): Promise<Quiz | null> => {
  const res = await serverGetQuiz(id);
  return res.success && res.data ? res.data : null;
};

export const saveQuiz = async (quiz: Quiz) => {
  await serverSaveQuiz(quiz);
};

export const deleteQuiz = async (adminId: string, id: string, wasPublished: boolean) => {
  await serverDeleteQuiz(id);
};

export const getAttempts = async (studentId: string): Promise<QuizAttempt[]> => {
  const res = await serverGetAttempts(studentId);
  return res.success && res.data ? res.data : [];
};

export const getAllAttempts = async (): Promise<QuizAttempt[]> => {
  const res = await serverGetAllAttempts();
  return res.success && res.data ? res.data : [];
};

export const getQuizAttempts = async (quizId: string): Promise<QuizAttempt[]> => {
  const res = await serverGetQuizAttempts(quizId);
  return res.success && res.data ? res.data : [];
};

export const deleteAttempt = async (attemptId: string) => {
  return await serverDeleteAttempt(attemptId);
};

export const saveAttempt = async (studentId: string, attempt: QuizAttempt) => {
  await serverSaveAttempt(attempt);
};

// -- FEEDBACK & ANALYTICS -- //

export const submitFeedback = async (studentId: string, content: string, rating: number) => {
  return await serverSubmitFeedback(studentId, content, rating);
};

export const getFeedbacks = async () => {
  return await serverGetFeedbacks();
};

export const getDisplayedFeedbacks = async () => {
  return await serverGetDisplayedFeedbacks();
};

export const updateFeedbackStatus = async (feedbackId: string, isDisplayed: boolean) => {
  return await serverUpdateFeedbackStatus(feedbackId, isDisplayed);
};

export const deleteFeedback = async (feedbackId: string) => {
  return await serverDeleteFeedback(feedbackId);
};

export const getAnalyticsData = async () => {
  return await serverGetAnalyticsData();
};
