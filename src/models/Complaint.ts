import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  subject: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['academic', 'technical', 'facility', 'administrative', 'grievance', 'anti-ragging', 'other'],
    default: 'other' 
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  evidence: [{
    url: { type: String },
    type: { type: String },
    name: { type: String }
  }],
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'in-review', 'resolved', 'rejected'],
    default: 'pending' 
  },
  response: { type: String },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: { type: Date },
  isAnonymous: { type: Boolean, default: false },
}, { timestamps: true });

// Force clear model from cache to prevent stale issues
if (mongoose.models.Complaint) {
  delete mongoose.models.Complaint;
}

export default mongoose.model('Complaint', ComplaintSchema);
