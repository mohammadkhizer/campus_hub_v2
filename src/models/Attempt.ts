import mongoose from 'mongoose';

const AttemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  startTime: { type: Date },
  completedAt: { type: Date },
  duration: { type: Number }, // in seconds
  deviceInfo: {
    userAgent: String,
    ip: String,
  },
  status: { type: String, enum: ['completed', 'disqualified', 'pending_review'], default: 'completed' },
  answers: { type: Map, of: String },
  feedback: { type: String }

});

export default mongoose.models.Attempt || mongoose.model('Attempt', AttemptSchema);
