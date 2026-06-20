import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  status: { type: String, enum: ['pending', 'visible', 'hidden'], default: 'pending' },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

FeedbackSchema.index({ student: 1, institutionId: 1 });
FeedbackSchema.index({ status: 1, institutionId: 1 });

export default mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);
