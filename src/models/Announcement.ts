import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  attachmentUrl: { type: String }, // For file/image uploads
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

if (mongoose.models.Announcement) {
  delete mongoose.models.Announcement;
}

export default mongoose.model('Announcement', AnnouncementSchema);
