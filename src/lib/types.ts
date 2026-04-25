export type QuestionType = 'mcq' | 'fill-in-the-blanks' | 'short-answer' | 'long-answer';

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  answerChoices?: string[]; // Only for MCQ
  correctAnswer?: string; // Optional for long-answer
  explanation?: string;
  points?: number;
}

export interface Quiz {
  id: string;
  course: string; // Linked to a course
  title: string;
  category?: string;
  description: string;
  questions: Question[];
  generationType: 'manual' | 'ai';
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
  isPublished: boolean;
  password?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  studentEnrollment?: string;
  score: number;
  totalQuestions: number;
  attemptedCount?: number;
  completedAt: string;
  status: 'completed' | 'disqualified' | 'pending_review';
  answers: Record<string, string>;
  feedback?: string;
}

export interface Note {
  id: string;
  course: string;
  title: string;
  description: string;
  fileUrl: string; // PDF link
  fileType: 'pdf';
  createdAt: string;
}

export interface Assignment {
  id: string;
  course: string;
  title: string;
  description: string;
  deadline: string;
  attachmentUrl?: string; // Optional reference PDF
  totalMarks: number;
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  fileUrl: string; // PDF submission
  status: 'pending' | 'graded';
  grade?: string;
  feedback?: string;
  submittedAt: string;
}

export interface Course {
  id: string;
  faculty?: string;
  title: string;
  code: string;
  description: string;
  thumbnail?: string;
  isPublished: boolean;
  targetLectures: number;
  targetAssessments: number;
  classrooms?: string[];
  notes?: Note[];
  quizzes?: Quiz[];
  assignments?: Assignment[];
  createdAt: string;
  updatedAt: string;
}
