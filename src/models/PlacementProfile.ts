import mongoose, { Schema, Document } from 'mongoose';

export interface IPlacementProfile extends Document {
  student: mongoose.Types.ObjectId;
  personalDetails: {
    tenthPercentage: number;
    twelfthPercentage: number;
    diplomaPercentage?: number;
    gapYears: number;
  };
  academicMetrics: {
    currentCGPA: number;
    activeBacklogs: number;
    totalBacklogs: number;
    attendancePercentage: number;
  };
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'expert';
    verified: boolean;
    verifiedBy?: mongoose.Types.ObjectId;
  }>;
  experience: Array<{
    title: string;
    company: string;
    type: 'internship' | 'job' | 'project';
    startDate: Date;
    endDate?: Date;
    description: string;
    verified: boolean;
  }>;
  certifications: Array<{
    name: string;
    organization: string;
    issueDate: Date;
    certificateUrl?: string;
    verified: boolean;
  }>;
  resumeUrl?: string;
  status: 'active' | 'placed' | 'opted-out';
  createdAt: Date;
  updatedAt: Date;
}

const PlacementProfileSchema: Schema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  personalDetails: {
    tenthPercentage: { type: Number, default: 0 },
    twelfthPercentage: { type: Number, default: 0 },
    diplomaPercentage: { type: Number },
    gapYears: { type: Number, default: 0 }
  },
  academicMetrics: {
    currentCGPA: { type: Number, default: 0 },
    activeBacklogs: { type: Number, default: 0 },
    totalBacklogs: { type: Number, default: 0 },
    attendancePercentage: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false }
  },
  skills: [{
    name: String,
    level: { type: String, enum: ['beginner', 'intermediate', 'expert'], default: 'beginner' },
    verified: { type: Boolean, default: false },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  experience: [{
    title: String,
    company: String,
    type: { type: String, enum: ['internship', 'job', 'project'] },
    startDate: Date,
    endDate: Date,
    description: String,
    verified: { type: Boolean, default: false }
  }],
  certifications: [{
    name: String,
    organization: String,
    issueDate: Date,
    certificateUrl: String,
    verified: { type: Boolean, default: false }
  }],
  resumeUrl: String,
  status: { type: String, enum: ['active', 'placed', 'opted-out'], default: 'active' }
}, { timestamps: true });

export default mongoose.models.PlacementProfile || mongoose.model<IPlacementProfile>('PlacementProfile', PlacementProfileSchema);
