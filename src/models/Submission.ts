import mongoose, { Schema, Document } from 'mongoose';
import { tenantPlugin } from '@/lib/mongoose-tenant-plugin';

export interface ISubmission extends Document {
  assignment: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected' | 'graded';
  grade?: string;
  feedback?: string;
  institutionId: string;
}

const SubmissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'graded'], default: 'pending' },
  grade: { type: String },
  feedback: { type: String },
}, { timestamps: true });

SubmissionSchema.plugin(tenantPlugin);

export default mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);
