import mongoose from 'mongoose';

const AssignmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  deadline: { type: Date, required: true },
  attachmentUrl: { type: String },
  totalMarks: { type: Number, default: 100 },
}, { timestamps: true });

if (mongoose.models.Assignment) {
  delete mongoose.models.Assignment;
}

export default mongoose.model('Assignment', AssignmentSchema);
