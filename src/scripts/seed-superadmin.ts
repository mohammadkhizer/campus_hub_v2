import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'administrator', 'superadmin'], default: 'student' }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedSuperAdmin() {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log('Connected to database.');

    const email = 'superadmin@campushub.com';
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log(`User ${email} already exists.`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('superadmin123', 12);
    
    await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email,
      password: hashedPassword,
      role: 'superadmin'
    });

    console.log(`Successfully created default super admin!
Email: ${email}
Password: superadmin123`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding super admin:', error);
    process.exit(1);
  }
}

seedSuperAdmin();
