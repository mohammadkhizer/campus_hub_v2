import mongoose, { Schema, Document } from 'mongoose';
import { tenantPlugin } from '@/lib/mongoose-tenant-plugin';

export interface IEnrollment extends Document {
  course: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  institutionId: string;
}

const EnrollmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

EnrollmentSchema.index({ course: 1, student: 1 }, { unique: true });

EnrollmentSchema.plugin(tenantPlugin);

export default mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
