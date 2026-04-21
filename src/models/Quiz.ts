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
  password: { type: String, default: '' },
  questions: [{
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String }
  }]
}, { timestamps: true });

if (mongoose.models.Quiz) {
  delete mongoose.models.Quiz;
}

export default mongoose.model('Quiz', QuizSchema);
