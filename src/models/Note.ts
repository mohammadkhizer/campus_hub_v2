import mongoose from 'mongoose';

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

if (mongoose.models.Note) {
  delete mongoose.models.Note;
}

export default mongoose.model('Note', NoteSchema);
