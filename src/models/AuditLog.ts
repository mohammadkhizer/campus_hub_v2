import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  email: { type: String },
  action: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now, expires: '90d' } // Auto-delete logs after 90 days for GDPR compliance
});

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
