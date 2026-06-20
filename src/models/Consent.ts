import mongoose, { Schema, Document } from 'mongoose';
import { tenantPlugin } from '@/lib/mongoose-tenant-plugin';

export interface IConsent extends Document {
  userId: string;
  institutionId: string;
  consented: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  };
  version: string;
  userAgent: string;
  ipHash: string;
  timestamp: Date;
}

const ConsentSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  consented: {
    necessary: { type: Boolean, default: true },
    analytics: { type: Boolean, default: false },
    marketing: { type: Boolean, default: false },
  },
  version: { type: String, required: true },
  userAgent: { type: String },
  ipHash: { type: String },
  timestamp: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

ConsentSchema.plugin(tenantPlugin);

export default mongoose.models.Consent || mongoose.model<IConsent>('Consent', ConsentSchema);
