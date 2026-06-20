import mongoose from 'mongoose';
import User from '../models/User';
import Course from '../models/Course';
import { USER_ROLES } from '../lib/constants';
import { env } from '../lib/env';

async function seed() {
  if (!env.MONGODB_URI) {
    console.error('Missing MONGODB_URI in environment.');
    process.exit(1);
  }

  try {
    console.log('Connecting to database...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected.');

    console.log('Clearing existing basic test data...');
    await User.deleteMany({ email: 'superadmin@campushub.com' });

    console.log('Creating Super Admin user...');
    await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@campushub.com',
      password: 'password123', // In a real scenario, this gets hashed by a pre-save hook or service
      role: USER_ROLES.SUPERADMIN,
      authProvider: 'local'
    });

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
