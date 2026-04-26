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
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
