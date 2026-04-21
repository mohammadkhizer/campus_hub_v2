import { Quiz, QuizAttempt } from './types';
import { serverGetQuizzes, serverGetQuiz, serverSaveQuiz, serverDeleteQuiz, serverGetAttempts, serverSaveAttempt, serverGetAllAttempts } from '@/app/actions/quizzes';

// -- QUIZZES VIA MONGODB -- //

export const getQuizzes = async (adminId?: string): Promise<Quiz[]> => {
  return await serverGetQuizzes(adminId);
};

export const getQuiz = async (id: string): Promise<Quiz | null> => {
  return await serverGetQuiz(id);
};

export const saveQuiz = async (quiz: Quiz) => {
  await serverSaveQuiz(quiz);
};

export const deleteQuiz = async (adminId: string, id: string, wasPublished: boolean) => {
  await serverDeleteQuiz(id);
};

export const getAttempts = async (studentId: string): Promise<QuizAttempt[]> => {
  return await serverGetAttempts(studentId);
};

export const getAllAttempts = async (): Promise<QuizAttempt[]> => {
  return await serverGetAllAttempts();
};

export const saveAttempt = async (studentId: string, attempt: QuizAttempt) => {
  await serverSaveAttempt(attempt);
};
