import mongoose, { Schema, Document } from 'mongoose';

export interface IPlacementApplication extends Document {
  student: mongoose.Types.ObjectId;
  drive: mongoose.Types.ObjectId;
  status: 'applied' | 'shortlisted' | 'interview' | 'selected' | 'rejected';
  notes?: string;
  appliedAt: Date;
  updatedAt: Date;
}

const PlacementApplicationSchema: Schema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  drive: { type: Schema.Types.ObjectId, ref: 'PlacementDrive', required: true },
  status: { 
    type: String, 
    enum: ['applied', 'shortlisted', 'interview', 'selected', 'rejected'],
    default: 'applied' 
  },
  notes: String
}, { timestamps: true });

// Ensure a student can only apply once per drive
PlacementApplicationSchema.index({ student: 1, drive: 1 }, { unique: true });

export default mongoose.models.PlacementApplication || mongoose.model<IPlacementApplication>('PlacementApplication', PlacementApplicationSchema);
