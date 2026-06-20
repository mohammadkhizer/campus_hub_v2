import mongoose from 'mongoose';
import { env } from '../lib/env';
import User from '../models/User';
import Course from '../models/Course';
import Quiz from '../models/Quiz';
import Attempt from '../models/Attempt';
import Feedback from '../models/Feedback';

async function runMigration() {
  if (!env.MONGODB_URI) {
    console.error('Missing MONGODB_URI in environment.');
    process.exit(1);
  }

  try {
    console.log('Connecting to database for migration...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected.');

    // Create a default institution for existing data
    const InstitutionSchema = new mongoose.Schema({ name: String }, { timestamps: true });
    const Institution = mongoose.models.Institution || mongoose.model('Institution', InstitutionSchema);
    
    let defaultInstitution = await Institution.findOne({ name: 'Default Campus' });
    if (!defaultInstitution) {
      defaultInstitution = await Institution.create({ name: 'Default Campus' });
      console.log(`Created default institution: ${defaultInstitution._id}`);
    }

    const institutionId = defaultInstitution._id;

    console.log('Migrating Users...');
    await User.updateMany({ institutionId: { $exists: false } }, { $set: { institutionId, deletedAt: null } });

    console.log('Migrating Courses...');
    await Course.updateMany({ institutionId: { $exists: false } }, { $set: { institutionId, deletedAt: null } });

    console.log('Migrating Quizzes...');
    await Quiz.updateMany({ institutionId: { $exists: false } }, { $set: { institutionId, deletedAt: null } });

    console.log('Migrating Attempts...');
    await Attempt.updateMany({ institutionId: { $exists: false } }, { $set: { institutionId, deletedAt: null } });

    console.log('Migrating Feedback...');
    await Feedback.updateMany({ institutionId: { $exists: false } }, { $set: { institutionId, deletedAt: null } });

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
