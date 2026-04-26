import mongoose from 'mongoose';

const QuizSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  category: { type: String, default: 'General' },
  description: { type: String },
  generationType: { type: String, enum: ['manual', 'ai'], default: 'manual' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  timeLimit: { type: Number, default: 0 }, // minutes
  isPublished: { type: Boolean, default: false },
  activityMonitoring: { type: Boolean, default: true },
  password: { type: String, default: '' },
  questions: [{
    type: { type: String, enum: ['mcq', 'fill-in-the-blanks', 'short-answer', 'long-answer'], default: 'mcq' },
    questionText: { type: String, required: true },
    imageUrl: { type: String },
    options: [{ type: String }], // Optional for non-MCQ
    correctAnswer: { type: String }, // Optional for long-answer
    explanation: { type: String },
    points: { type: Number, default: 1 }
  }]
}, { timestamps: true });

if (mongoose.models.Quiz) {
  delete mongoose.models.Quiz;
}

export default mongoose.model('Quiz', QuizSchema);
