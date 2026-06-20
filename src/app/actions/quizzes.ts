'use server';

import dbConnect from '@/lib/mongoose';
import QuizModel from '@/models/Quiz';
import AttemptModel from '@/models/Attempt';
import { checkRateLimit } from '@/lib/rate-limit';
import CourseModel from '@/models/Course';
import { toDTO } from '@/lib/dto';
import { notifyStudentsInCourse } from './courses';
import { createAction } from '@/lib/action-factory';
import { USER_ROLES } from '@/lib/constants';
import { z } from 'zod';

export async function serverGetQuizzes() {
  return createAction({
    name: 'serverGetQuizzes',
    allowedRoles: [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async (_, { user: session }) => {
      let query: any = { institutionId: session!.institutionId };
      
      if (session!.role === USER_ROLES.STUDENT) {
        query.isPublished = true;
      } else if (session!.role === USER_ROLES.TEACHER) {
        // Teachers see published and unpublished quizzes for their institution
      }

      const quizzes = await QuizModel.find(query).sort({ createdAt: -1 }).lean();
      
      return quizzes.map((q: any) => {
        const dto = toDTO<any>(q);
        const isStudent = session!.role === USER_ROLES.STUDENT;
        
        return {
          ...dto,
          questions: (dto.questions || []).map((question: any) => ({
            ...question,
            correctAnswer: isStudent ? undefined : question.correctAnswer,
            explanation: isStudent ? undefined : question.explanation,
          }))
        };
      });
    }
  }, {});
}

export async function serverGetQuiz(id: string) {
  return createAction({
    name: 'serverGetQuiz',
    allowedRoles: [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({ id: z.string().length(24) }),
    handler: async ({ id }, { user: session }) => {
      const quiz = await QuizModel.findOne({ _id: id, institutionId: session!.institutionId }).lean();
      if (!quiz) throw new Error('Quiz not found or unauthorized');
      
      const dto = toDTO<any>(quiz);
      const isStudent = session!.role === USER_ROLES.STUDENT;

      return {
        ...dto,
        questions: (dto.questions || []).map((question: any) => ({
          ...question,
          correctAnswer: isStudent ? undefined : question.correctAnswer,
          explanation: isStudent ? undefined : question.explanation,
        }))
      };
    }
  }, { id });
}

export async function serverSaveQuiz(quiz: any) {
  return createAction({
    name: 'serverSaveQuiz',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async (rawInput, { user: session }) => {
      const rl = await checkRateLimit({ limit: 10, windowMs: 60 * 1000 });
      if (!rl.success) throw new Error(`Rate limit exceeded. Wait ${rl.reset}s.`);

      // Verify course access
      if (session!.role === USER_ROLES.TEACHER && rawInput.courseId) {
        const course = await CourseModel.findOne({ _id: rawInput.courseId, institutionId: session!.institutionId }).lean();
        if (!course || course.faculty?.toString() !== session!.id) {
          throw new Error("Unauthorized access to this course.");
        }
      }

      const cleanedQuestions = (rawInput.questions || []).map((q: any) => ({
        type: q.type || 'mcq',
        questionText: q.questionText,
        options: q.answerChoices || q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        points: q.points || 1
      }));

      const cleanData = {
        course: rawInput.courseId,
        institutionId: session!.institutionId,
        title: rawInput.title,
        description: rawInput.description,
        difficulty: rawInput.difficulty || 'medium',
        timeLimit: Number(rawInput.timeLimitMinutes) || 0,
        isPublished: rawInput.published === undefined ? true : !!rawInput.published,
        activityMonitoring: rawInput.activityMonitoring === undefined ? true : !!rawInput.activityMonitoring,
        password: rawInput.password || '',
        questions: cleanedQuestions,
        generationType: rawInput.generationType || 'manual'
      };

      if (rawInput.id && rawInput.id.length === 24) { 
        await QuizModel.findOneAndUpdate({ _id: rawInput.id, institutionId: session!.institutionId }, cleanData);
      } else {
        await QuizModel.create(cleanData);
        if (cleanData.isPublished) {
          notifyStudentsInCourse(cleanData.course, 'Quiz', cleanData.title, cleanData.description);
        }
      }
      return { success: true };
    }
  }, quiz);
}

export async function serverDeleteQuiz(id: string) {
  return createAction({
    name: 'serverDeleteQuiz',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({ id: z.string().length(24) }),
    handler: async ({ id }, { user: session }) => {
      const deleted = await QuizModel.findOneAndDelete({ _id: id, institutionId: session!.institutionId });
      if (!deleted) throw new Error('Quiz not found or unauthorized');
      return { success: true };
    }
  }, { id });
}

export async function serverSaveAttempt(attemptData: any) {
  return createAction({
    name: 'serverSaveAttempt',
    allowedRoles: [USER_ROLES.STUDENT],
    handler: async (rawInput, { user: session }) => {
      const rl = await checkRateLimit({ limit: 10, windowMs: 60 * 1000 });
      if (!rl.success) throw new Error(`Too many submissions. Wait ${rl.reset}s.`);

      const quiz = await QuizModel.findOne({ _id: rawInput.quizId, institutionId: session!.institutionId }).lean();
      if (!quiz) throw new Error("Quiz not found or unauthorized.");

      let serverCalculatedScore = 0;
      const clientAnswers = rawInput.answers || {};

      quiz.questions.forEach((q: any) => {
        const qId = q._id.toString();
        const userAnswer = (clientAnswers[qId] || "").trim().toLowerCase();
        const correctAnswer = (q.correctAnswer || "").trim().toLowerCase();
        if (['mcq', 'fill-in-the-blanks'].includes(q.type) && userAnswer === correctAnswer) {
          serverCalculatedScore += (q.points || 1);
        }
      });

      const attempt = await AttemptModel.create({
        quiz: rawInput.quizId,
        student: session!.id,
        institutionId: session!.institutionId,
        score: serverCalculatedScore,
        totalQuestions: quiz.questions.length,
        answers: clientAnswers,
        status: 'completed',
        completedAt: new Date()
      });

      return { id: attempt._id.toString(), score: serverCalculatedScore };
    }
  }, attemptData);
}

export async function serverGetAttempts(studentId: string) {
  return createAction({
    name: 'serverGetAttempts',
    allowedRoles: [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async ({ studentId }, { user: session }) => {
      // Students can only see their own attempts
      const targetId = session!.role === USER_ROLES.STUDENT ? session!.id : studentId;
      
      const attempts = await AttemptModel.find({ 
        student: targetId, 
        institutionId: session!.institutionId 
      })
      .populate('student', 'firstName lastName email enrollmentNumber')
      .populate('quiz', 'title')
      .sort({ completedAt: -1 })
      .lean();

      return toDTO<any>(attempts).map((a: any) => ({
        ...a,
        studentName: a.student ? `${a.student.firstName} ${a.student.lastName}` : 'Unknown',
        studentEmail: a.student?.email || 'N/A',
        studentEnrollment: a.student?.enrollmentNumber || 'N/A',
        quizTitle: a.quiz?.title || 'Unknown Quiz',
        attemptedCount: a.answers ? Object.keys(a.answers).length : 0
      }));
    }
  }, { studentId });
}

export async function serverGetAllAttempts() {
  return createAction({
    name: 'serverGetAllAttempts',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async (_, { user: session }) => {
      const attempts = await AttemptModel.find({ institutionId: session!.institutionId })
        .populate('student', 'firstName lastName email enrollmentNumber')
        .populate('quiz', 'title')
        .sort({ completedAt: -1 })
        .lean();

      return toDTO<any>(attempts).map((a: any) => ({
        ...a,
        studentName: a.student ? `${a.student.firstName} ${a.student.lastName}` : 'Unknown',
        studentEmail: a.student?.email || 'N/A',
        studentEnrollment: a.student?.enrollmentNumber || 'N/A',
        quizTitle: a.quiz?.title || 'Unknown Quiz',
        attemptedCount: a.answers ? Object.keys(a.answers).length : 0
      }));
    }
  }, {});
}

export async function serverGetQuizAttempts(quizId: string) {
  return createAction({
    name: 'serverGetQuizAttempts',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async ({ quizId }, { user: session }) => {
      const attempts = await AttemptModel.find({ quiz: quizId, institutionId: session!.institutionId })
        .populate('student', 'firstName lastName email enrollmentNumber')
        .sort({ score: -1, completedAt: 1 })
        .lean();
        
      return toDTO<any[]>(attempts).map((a: any) => ({
        ...a,
        studentName: a.student ? `${a.student.firstName} ${a.student.lastName}` : 'Unknown',
        studentEmail: a.student?.email || 'N/A',
        studentEnrollment: a.student?.enrollmentNumber || 'N/A',
        attemptedCount: a.answers ? Object.keys(a.answers).length : 0
      }));
    }
  }, { quizId });
}

export async function serverDeleteAttempt(attemptId: string) {
  return createAction({
    name: 'serverDeleteAttempt',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async ({ attemptId }, { user: session }) => {
      const deleted = await AttemptModel.findOneAndDelete({ _id: attemptId, institutionId: session!.institutionId });
      if (!deleted) throw new Error('Attempt not found or unauthorized');
      return { success: true };
    }
  }, { attemptId });
}

export async function serverGradeAttempt(attemptId: string, score: number, feedback: string) {
  return createAction({
    name: 'serverGradeAttempt',
    allowedRoles: [USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async (validatedData, { user: session }) => {
      const updated = await AttemptModel.findOneAndUpdate(
        { _id: validatedData.attemptId, institutionId: session!.institutionId },
        { score: validatedData.score, feedback: validatedData.feedback, status: 'completed' },
        { new: true }
      );
      if (!updated) throw new Error('Attempt not found or unauthorized');
      return { success: true };
    }
  }, { attemptId, score, feedback });
}

export async function serverGetAttempt(attemptId: string) {
  return createAction({
    name: 'serverGetAttempt',
    allowedRoles: [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async ({ attemptId }, { user: session }) => {
      const attempt = await AttemptModel.findOne({ _id: attemptId, institutionId: session!.institutionId })
        .populate('student', 'firstName lastName email enrollmentNumber')
        .lean();
      
      if (!attempt) throw new Error('Attempt not found or unauthorized');

      const data = toDTO<any>(attempt);
      return {
        ...data,
        studentName: data.student ? `${data.student.firstName} ${data.student.lastName}` : 'Unknown',
        studentEmail: data.student?.email || 'N/A',
        studentEnrollment: data.student?.enrollmentNumber || 'N/A'
      };
    }
  }, { attemptId });
}
