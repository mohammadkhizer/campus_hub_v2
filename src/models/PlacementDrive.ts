import mongoose, { Schema, Document } from 'mongoose';

export interface IPlacementDrive extends Document {
  companyName: string;
  logoUrl?: string;
  role: string;
  package: number; // CTC in LPA
  description: string;
  location: string;
  eligibility: {
    minCGPA: number;
    minTenthPercentage: number;
    minTwelfthPercentage: number;
    maxActiveBacklogs: number;
    allowedBranches: string[];
    graduationYear: number;
  };
  driveDate: Date;
  deadline: Date;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  contactPerson?: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PlacementDriveSchema: Schema = new Schema({
  companyName: { type: String, required: true },
  logoUrl: String,
  role: { type: String, required: true },
  package: { type: Number, required: true },
  description: { type: String, required: true },
  location: { type: String, default: 'On-Campus' },
  eligibility: {
    minCGPA: { type: Number, default: 0 },
    minTenthPercentage: { type: Number, default: 0 },
    minTwelfthPercentage: { type: Number, default: 0 },
    maxActiveBacklogs: { type: Number, default: 0 },
    allowedBranches: [String],
    graduationYear: { type: Number }
  },
  driveDate: { type: Date, required: true },
  deadline: { type: Date, required: true },
  status: { type: String, enum: ['upcoming', 'active', 'completed', 'cancelled'], default: 'upcoming' },
  contactPerson: {
    name: String,
    email: String,
    phone: String
  }
}, { timestamps: true });

export default mongoose.models.PlacementDrive || mongoose.model<IPlacementDrive>('PlacementDrive', PlacementDriveSchema);
