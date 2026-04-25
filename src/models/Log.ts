import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  level: { type: String, enum: ['info', 'warn', 'error', 'security'], default: 'info' },
  message: { type: String, required: true },
  context: { type: mongoose.Schema.Types.Mixed },
  source: { type: String, default: 'server' }
});

// Optimization: TTL index to automatically remove logs older than 30 days
LogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.models.Log || mongoose.model('Log', LogSchema);
