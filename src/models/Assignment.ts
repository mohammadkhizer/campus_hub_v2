import mongoose, { Schema, Document } from 'mongoose';
import { tenantPlugin } from '@/lib/mongoose-tenant-plugin';

export interface IAssignment extends Document {
  course: mongoose.Types.ObjectId;
  title: string;
  description: string;
  deadline: Date;
  attachmentUrl?: string;
  totalMarks: number;
  institutionId: string;
}

const AssignmentSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  deadline: { type: Date, required: true },
  attachmentUrl: { type: String },
  totalMarks: { type: Number, default: 100 },
}, { timestamps: true });

AssignmentSchema.plugin(tenantPlugin);

export default mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);
