import mongoose, { Schema, Document } from 'mongoose';
import { tenantPlugin } from '@/lib/mongoose-tenant-plugin';

export interface IAnnouncement extends Document {
  course: mongoose.Types.ObjectId;
  title: string;
  content: string;
  attachmentUrl?: string;
  postedBy: mongoose.Types.ObjectId;
  institutionId: string;
}

const AnnouncementSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  attachmentUrl: { type: String },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

AnnouncementSchema.plugin(tenantPlugin);

export default mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
