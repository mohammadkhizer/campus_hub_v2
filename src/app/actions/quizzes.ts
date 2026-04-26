'use server';

import dbConnect from '@/lib/mongoose';
import QuizModel from '@/models/Quiz';
import AttemptModel from '@/models/Attempt';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSessionAction } from '@/app/actions/auth';
import CourseModel from '@/models/Course';
import { toDTO } from '@/lib/dto';

export async function serverGetQuizzes(adminId?: string) {
  try {
    const session = await getSessionAction();
    await dbConnect();
    
    let query = adminId ? { adminId } : { isPublished: true };
    const quizzes = await QuizModel.find(query).sort({ createdAt: -1 }).lean();
    
    return quizzes.map((q: any) => {
      const dto = toDTO<any>(q);
      const isStudent = session?.role === 'student';
      
      return {
        ...dto,
        questions: (dto.questions || []).map((question: any) => ({
          ...question,
          // Hide sensitive fields from students
          correctAnswer: isStudent ? undefined : question.correctAnswer,
          explanation: isStudent ? undefined : question.explanation,
        }))
      };
    });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return [];
  }
}

export async function serverGetQuiz(id: string) {
  try {
    const session = await getSessionAction();
    await dbConnect();
    
    const quiz = await QuizModel.findById(id).lean();
    if (!quiz) return null;
    
    const dto = toDTO<any>(quiz);
    const isStudent = session?.role === 'student';

    return {
      ...dto,
      questions: (dto.questions || []).map((question: any) => ({
        ...question,
        // Hide sensitive fields from students
        correctAnswer: isStudent ? undefined : question.correctAnswer,
        explanation: isStudent ? undefined : question.explanation,
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
      activityMonitoring: quiz.activityMonitoring === undefined ? true : !!quiz.activityMonitoring,
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

export async function serverSaveAttempt(attemptData: any) {
  try {
    const session = await getSessionAction();
    if (!session) return { success: false, error: "Authentication required" };

    await dbConnect();
    
    // 1. Verify Attempt Ownership
    if (session.role === 'student' && attemptData.studentId !== session.id) {
      return { success: false, error: "Security Violation: Cannot submit on behalf of another user." };
    }

    // 2. Fetch the actual quiz to calculate the score (DO NOT TRUST CLIENT SCORE)
    const quiz = await QuizModel.findById(attemptData.quizId).lean();
    if (!quiz) return { success: false, error: "Quiz not found" };

    // 3. Re-calculate score on the server
    let serverCalculatedScore = 0;
    const clientAnswers = attemptData.answers || {};

    quiz.questions.forEach((q: any) => {
      const qId = q._id.toString();
      const userAnswer = (clientAnswers[qId] || "").trim().toLowerCase();
      const correctAnswer = (q.correctAnswer || "").trim().toLowerCase();

      if (q.type === 'mcq' || q.type === 'fill-in-the-blanks') {
        if (userAnswer === correctAnswer) {
          serverCalculatedScore += (q.points || 1);
        }
      }
      // For short/long answers, we keep status as 'pending' if needed, 
      // but for now, we follow existing logic.
    });

    // 4. Create the attempt record with server-side data
    const attempt = await AttemptModel.create({
      quiz: attemptData.quizId,
      student: attemptData.studentId,
      score: serverCalculatedScore,
      totalQuestions: quiz.questions.length,
      answers: clientAnswers,
      status: attemptData.status || 'completed',
      completedAt: new Date()
    });

    return { 
      success: true, 
      id: attempt._id.toString(),
      score: serverCalculatedScore 
    };
  } catch (error) {
    console.error('Error saving attempt:', error);
    return { success: false, error: "Failed to save attempt securely" };
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
    return toDTO<any>(attempts).map((a: any) => ({
      ...a,
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
    return toDTO<any>(attempts).map((a: any) => ({
      ...a,
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
      
    const dtoAttempts = toDTO<any[]>(attempts);

    return dtoAttempts.map((a: any) => ({
      ...a,
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

    const data = toDTO<any>(attempt);
    return {
      ...data,
      studentName: data.student ? `${data.student.firstName} ${data.student.lastName}` : 'Unknown',
      studentEmail: data.student?.email || 'N/A',
      studentEnrollment: data.student?.enrollmentNumber || 'N/A'
    };
  } catch (error) {
    console.error('Error fetching attempt:', error);
    return null;
  }
}
