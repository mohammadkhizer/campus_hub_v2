import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  subject: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['academic', 'technical', 'facility', 'administrative', 'other'],
    default: 'other' 
  },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'in-review', 'resolved', 'rejected'],
    default: 'pending' 
  },
  response: { type: String },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Force clear model from cache to prevent stale issues
export default mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
