import mongoose from 'mongoose';

const EnrollmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Ensure unique enrollment per student per course
EnrollmentSchema.index({ course: 1, student: 1 }, { unique: true });

export default mongoose.models.Enrollment || mongoose.model('Enrollment', EnrollmentSchema);
