import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemLog extends Document {
  level: 'info' | 'warn' | 'error' | 'security';
  message: string;
  context?: Record<string, any>;
  timestamp: Date;
}

const SystemLogSchema = new Schema<ISystemLog>(
  {
    level: {
      type: String,
      required: true,
      enum: ['info', 'warn', 'error', 'security'],
      default: 'info',
    },
    message: {
      type: String,
      required: true,
    },
    context: {
      type: Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // We already have timestamp, but createdAt/updatedAt can be useful
  }
);

const SystemLog = mongoose.models.SystemLog || mongoose.model<ISystemLog>('SystemLog', SystemLogSchema);

export default SystemLog;
