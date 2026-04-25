import mongoose from 'mongoose';

const FeedbackSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  isDisplayed: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);
