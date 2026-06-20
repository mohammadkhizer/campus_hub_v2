import mongoose, { Schema, Document } from 'mongoose';
import { tenantPlugin } from '@/lib/mongoose-tenant-plugin';

export interface ICourse extends Document {
  code: string;
  title: string;
  description: string;
  thumbnail?: string;
  faculty?: mongoose.Types.ObjectId;
  targetLectures: number;
  targetAssessments: number;
  classrooms: mongoose.Types.ObjectId[];
  isPublished: boolean;
  institutionId: string;
  deletedAt?: Date;
}

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
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

CourseSchema.index({ code: 1, institutionId: 1 }, { unique: true });
CourseSchema.index({ faculty: 1, institutionId: 1 });

CourseSchema.plugin(tenantPlugin);

export default mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
