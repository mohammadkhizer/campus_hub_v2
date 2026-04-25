'use server';

import dbConnect from '@/lib/mongoose';
import QuizModel from '@/models/Quiz';
import AttemptModel from '@/models/Attempt';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionAction } from '@/app/actions/auth';
import CourseModel from '@/models/Course';

export async function serverGetQuizzes(adminId?: string) {
  try {
    await dbConnect();
    let query = adminId ? { adminId } : { isPublished: true };
    const quizzes = await QuizModel.find(query).sort({ createdAt: -1 }).lean();
    
    // Deep serialize to handle nested ObjectIds (especially in questions array)
    return JSON.parse(JSON.stringify(quizzes)).map((q: any) => ({
      ...q,
      id: q._id.toString(),
      questions: (q.questions || []).map((question: any) => ({
        id: question._id ? question._id.toString() : (question.id || Date.now().toString()),
        type: question.type || 'mcq',
        questionText: question.questionText || '',
        answerChoices: question.options || question.answerChoices || [],
        correctAnswer: question.correctAnswer || '',
        explanation: question.explanation || '',
        points: question.points || 1
      }))
    }));
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return [];
  }
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

export async function serverSaveAttempt(attempt: any) {
  try {
    await dbConnect();
    const { id, ...data } = attempt;
    await AttemptModel.create({
      ...data,
      quiz: data.quizId,
      student: data.studentId,
      completedAt: new Date(data.completedAt)
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving attempt:', error);
    throw error;
  }
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
