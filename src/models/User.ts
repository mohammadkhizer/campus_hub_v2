import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function() { return (this as any).authProvider !== 'google'; } },
  role: { type: String, enum: ['student', 'teacher', 'administrator', 'superadmin'], default: 'student' },
  enrollmentNumber: { type: String, unique: true, sparse: true },
  contactNumber: { type: String },
  passwordVersion: { type: Number, default: 0 },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  failedLoginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date },
  hasConsentedToDataCollection: { type: Boolean, default: false },
  institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' }, // For Multi-tenancy
  deletedAt: { type: Date, default: null }, // For Soft Deletes
}, { timestamps: true });

// Compound Indexes for common patterns
UserSchema.index({ email: 1, institutionId: 1 }, { unique: true });
UserSchema.index({ role: 1, institutionId: 1 });

export default mongoose.models.User || mongoose.model('User', UserSchema);
