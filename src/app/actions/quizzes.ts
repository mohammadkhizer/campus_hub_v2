'use server';

import dbConnect from '@/lib/mongoose';
import QuizModel from '@/models/Quiz';
import AttemptModel from '@/models/Attempt';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionAction } from '@/app/actions/auth';
import CourseModel from '@/models/Course';
import { safeAction } from '@/lib/actions';
import { fromLean, toDTO } from '@/lib/dto';
import { headers } from 'next/headers';
import { z } from 'zod';


export async function serverGetQuizzes(adminId?: string) {
  return safeAction(async () => {
    await dbConnect();
    let query = adminId ? { adminId } : { isPublished: true };
    const quizzes = await QuizModel.find(query).sort({ createdAt: -1 }).lean();
    
    return fromLean<any[]>(quizzes).map((q: any) => ({
      ...q,
      questions: (q.questions || []).map((question: any) => ({
        ...question,
        id: question._id ? question._id.toString() : (question.id || Date.now().toString()),
        answerChoices: question.options || question.answerChoices || [],
      }))
    }));
  }, adminId, { name: 'serverGetQuizzes' });
}


export async function serverGetQuiz(id: string) {
  try {
    await dbConnect();
    const quiz = await QuizModel.findById(id).lean();
    if (!quiz) return null;
    
    // Deep serialize to handle nested ObjectIds in questions array
    const serializedQuiz = JSON.parse(JSON.stringify(quiz));
    return {
      ...serializedQuiz,
      id: serializedQuiz._id.toString(),
      questions: (serializedQuiz.questions || []).map((question: any) => ({
        id: question._id ? question._id.toString() : (question.id || Date.now().toString()),
        type: question.type || 'mcq',
        questionText: question.questionText || '',
        answerChoices: question.options || question.answerChoices || [],
        correctAnswer: question.correctAnswer || '',
        explanation: question.explanation || '',
        points: question.points || 1
      }))
    };
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return null;
  }
}

export async function serverSaveQuiz(quiz: any) {
  try {
    const session = await getSessionAction();
    if (!session || (session.role !== 'administrator' && session.role !== 'teacher')) {
      return { success: false, error: "Unauthorized" };
    }

    // Check Rate Limit (e.g., 5 saves per minute)
    const rl = await checkRateLimit({ limit: 5, windowMs: 60 * 1000 });
    if (!rl.success) {
      return { success: false, error: `Rate limit exceeded. Please try again in ${rl.reset} seconds.` };
    }

    await dbConnect();

    // Verify course access for teachers
    if (session.role === 'teacher' && quiz.courseId) {
      const course = await CourseModel.findById(quiz.courseId).lean();
      if (!course || course.faculty?.toString() !== session.id) {
        return { success: false, error: "You are not authorized to save quizzes for this course." };
      }
    }
    
    // Proper senior-level data mapping to match Mongoose Schema
    const cleanedQuestions = (quiz.questions || []).map((q: any) => ({
      type: q.type || 'mcq',
      questionText: q.questionText,
      options: q.answerChoices || q.options || [],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      points: q.points || 1
    }));

    const cleanData = {
      course: quiz.courseId,
      title: quiz.title,
      description: quiz.description,
      difficulty: quiz.difficulty || 'medium',
      timeLimit: Number(quiz.timeLimitMinutes) || 0,
      isPublished: quiz.published === undefined ? true : !!quiz.published,
      password: quiz.password || '',
      questions: cleanedQuestions,
      generationType: quiz.generationType || 'manual'
    };

    if (quiz.id && quiz.id.length === 24) { 
      await QuizModel.findByIdAndUpdate(quiz.id, cleanData, { new: true });
    } else {
      await QuizModel.create(cleanData);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error saving quiz:', error);
    throw error;
  }
}

export async function serverDeleteQuiz(id: string) {
  try {
    await dbConnect();
    await QuizModel.findByIdAndDelete(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting quiz:', error);
    throw error;
  }
}

export async function serverStartAttempt(quizId: string) {
  return safeAction(async () => {
    const session = await getSessionAction();
    if (!session) throw new Error("Unauthorized");

    await dbConnect();
    const quiz = await QuizModel.findById(quizId).lean();
    if (!quiz) throw new Error("Quiz not found");

    const headersList = await headers();
    
    const attempt = await AttemptModel.create({
      quiz: quizId,
      student: session.id,
      score: 0,
      totalQuestions: quiz.questions?.length || 0,
      startTime: new Date(),
      status: 'pending_review',
      deviceInfo: {
        userAgent: headersList.get('user-agent'),
        ip: headersList.get('x-forwarded-for')?.split(',')[0] || 'unknown'
      }
    });

    return attempt._id.toString();
  }, quizId, { name: 'serverStartAttempt' });
}

export async function serverSaveAttempt(attempt: any) {
  return safeAction(async () => {
    await dbConnect();
    
    // 1. Fetch the pending attempt to verify timing
    const existingAttempt = await AttemptModel.findOne({
      quiz: attempt.quizId,
      student: attempt.studentId,
      status: 'pending_review'
    }).sort({ startTime: -1 });

    let duration = 0;
    if (existingAttempt && existingAttempt.startTime) {
      duration = Math.floor((Date.now() - new Date(existingAttempt.startTime).getTime()) / 1000);
      
      // 2. Cross-verify with Quiz time limit (if exists)
      const quiz = await QuizModel.findById(attempt.quizId).select('timeLimit').lean();
      if (quiz && quiz.timeLimit > 0) {
        const limitSeconds = quiz.timeLimit * 60;
        if (duration > limitSeconds + 60) { // 60s grace period
           // Disqualify or flag
           console.warn(`Attempt flagged for overtime: ${duration}s vs ${limitSeconds}s`);
        }
      }
    }

    if (existingAttempt) {
      existingAttempt.score = attempt.score;
      existingAttempt.totalQuestions = attempt.totalQuestions;
      existingAttempt.completedAt = new Date();
      existingAttempt.duration = duration;
      existingAttempt.status = 'completed';
      existingAttempt.answers = attempt.answers;
      await existingAttempt.save();
      return { success: true, id: existingAttempt._id.toString() };
    } else {
      // Fallback for old system or missing start
      const newAttempt = await AttemptModel.create({
        ...attempt,
        quiz: attempt.quizId,
        student: attempt.studentId,
        completedAt: new Date(),
        status: 'completed',
        duration: 0 // Unknown
      });
      return { success: true, id: newAttempt._id.toString() };
    }
  }, attempt, { name: 'serverSaveAttempt' });
}


export async function serverGetAttempts(studentId: string) {
  try {
    await dbConnect();
    const attempts = await AttemptModel.find({ student: studentId })
      .populate('student', 'firstName lastName email enrollmentNumber')
      .populate('quiz', 'title')
      .sort({ completedAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(attempts)).map((a: any) => ({
      ...a,
      id: a._id.toString(),
      studentName: a.student ? `${a.student.firstName} ${a.student.lastName}` : 'Unknown',
      studentEmail: a.student?.email || 'N/A',
      studentEnrollment: a.student?.enrollmentNumber || 'N/A',
      quizTitle: a.quiz?.title || 'Unknown Quiz',
      attemptedCount: a.answers ? Object.keys(a.answers).length : 0
    }));
  } catch (error) {
    console.error('Error fetching attempts:', error);
    return [];
  }
}

export async function serverGetAllAttempts() {
  try {
    await dbConnect();
    const attempts = await AttemptModel.find({})
      .populate('student', 'firstName lastName email enrollmentNumber')
      .populate('quiz', 'title')
      .sort({ completedAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(attempts)).map((a: any) => ({
      ...a,
      id: a._id.toString(),
      studentName: a.student ? `${a.student.firstName} ${a.student.lastName}` : 'Unknown',
      studentEmail: a.student?.email || 'N/A',
      studentEnrollment: a.student?.enrollmentNumber || 'N/A',
      quizTitle: a.quiz?.title || 'Unknown Quiz',
      attemptedCount: a.answers ? Object.keys(a.answers).length : 0
    }));
  } catch (error) {
    console.error('Error fetching all attempts:', error);
    return [];
  }
}

export async function serverGetQuizAttempts(quizId: string) {
  try {
    await dbConnect();
    const attempts = await AttemptModel.find({ quiz: quizId })
      .populate('student', 'firstName lastName email enrollmentNumber')
      .sort({ score: -1, completedAt: 1 })
      .lean();
    return JSON.parse(JSON.stringify(attempts)).map((a: any) => ({
      ...a,
      id: a._id.toString(),
      studentName: a.student ? `${a.student.firstName} ${a.student.lastName}` : 'Unknown',
      studentEmail: a.student?.email || 'N/A',
      studentEnrollment: a.student?.enrollmentNumber || 'N/A',
      attemptedCount: a.answers ? Object.keys(a.answers).length : 0
    }));
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    return [];
  }
}

export async function serverDeleteAttempt(attemptId: string) {
  try {
    const session = await getSessionAction();
    if (!session || (session.role !== 'administrator' && session.role !== 'teacher')) {
      return { success: false, error: "Unauthorized" };
    }
    await dbConnect();
    await AttemptModel.findByIdAndDelete(attemptId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting attempt:', error);
    return { success: false, error: "Failed to delete attempt" };
  }
}

export async function serverGradeAttempt(attemptId: string, score: number, feedback: string) {
  try {
    const session = await getSessionAction();
    if (!session || (session.role !== 'teacher' && session.role !== 'administrator')) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();
    await AttemptModel.findByIdAndUpdate(attemptId, { 
      score, 
      feedback, 
      status: 'completed' 
    });
    return { success: true };
  } catch (e: any) {
    console.error('Error grading attempt:', e);
    return { success: false, error: e.message };
  }
}

export async function serverGetAttempt(attemptId: string) {
  try {
    await dbConnect();
    const attempt = await AttemptModel.findById(attemptId)
      .populate('student', 'firstName lastName email enrollmentNumber')
      .lean();
    
    if (!attempt) return null;

    const data = JSON.parse(JSON.stringify(attempt));
    return {
      ...data,
      id: data._id.toString(),
      studentName: data.student ? `${data.student.firstName} ${data.student.lastName}` : 'Unknown',
      studentEmail: data.student?.email || 'N/A',
      studentEnrollment: data.student?.enrollmentNumber || 'N/A'
    };
  } catch (error) {
    console.error('Error fetching attempt:', error);
    return null;
  }
}
