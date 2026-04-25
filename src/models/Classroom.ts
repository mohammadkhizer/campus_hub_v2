import mongoose, { Schema, Document } from 'mongoose';

export interface IClassroom extends Document {
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  courses: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ClassroomSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
}, { timestamps: true });

export default mongoose.models.Classroom || mongoose.model<IClassroom>('Classroom', ClassroomSchema);
