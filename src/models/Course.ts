import mongoose from 'mongoose';

const CourseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetLectures: { type: Number, default: 0 },
  targetAssessments: { type: Number, default: 0 },
  classrooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }],
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

// Force clear model from cache to prevent stale RBAC/schema issues in Next.js dev mode
if (mongoose.models.Course) {
  delete mongoose.models.Course;
}

export default mongoose.model('Course', CourseSchema);
