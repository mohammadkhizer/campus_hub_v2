import mongoose, { Schema, Document } from 'mongoose';
import { tenantPlugin } from '@/lib/mongoose-tenant-plugin';

export interface INote extends Document {
  course: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  vectorized: boolean;
  embeddingStatus: 'none' | 'pending' | 'completed' | 'failed';
  metadata?: {
    pageCount?: number;
    chunks?: number;
  };
  institutionId: string;
}

const NoteSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String, required: true },
  fileType: { type: String, default: 'pdf' },
  vectorized: { type: Boolean, default: false },
  embeddingStatus: { 
    type: String, 
    enum: ['none', 'pending', 'completed', 'failed'], 
    default: 'none' 
  },
  metadata: {
    pageCount: { type: Number },
    chunks: { type: Number },
  }
}, { timestamps: true });

NoteSchema.plugin(tenantPlugin);

export default mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);
