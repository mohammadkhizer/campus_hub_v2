import mongoose, { Schema, Document } from 'mongoose';
import { tenantPlugin } from '@/lib/mongoose-tenant-plugin';

export interface IQuiz extends Document {
  course: mongoose.Types.ObjectId;
  title: string;
  category: string;
  description?: string;
  generationType: 'manual' | 'ai';
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  isPublished: boolean;
  activityMonitoring: boolean;
  password?: string;
  questions: Array<{
    type: 'mcq' | 'fill-in-the-blanks' | 'short-answer' | 'long-answer';
    questionText: string;
    imageUrl?: string;
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
    points: number;
  }>;
  institutionId: string;
  deletedAt?: Date;
}

const QuizSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  category: { type: String, default: 'General' },
  description: { type: String },
  generationType: { type: String, enum: ['manual', 'ai'], default: 'manual' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  timeLimit: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  activityMonitoring: { type: Boolean, default: true },
  password: { type: String, default: '' },
  questions: [{
    type: { type: String, enum: ['mcq', 'fill-in-the-blanks', 'short-answer', 'long-answer'], default: 'mcq' },
    questionText: { type: String, required: true },
    imageUrl: { type: String },
    options: [{ type: String }],
    correctAnswer: { type: String },
    explanation: { type: String },
    points: { type: Number, default: 1 }
  }],
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

QuizSchema.plugin(tenantPlugin);

export default mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);
