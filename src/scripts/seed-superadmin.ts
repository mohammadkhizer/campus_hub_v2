import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not set in .env');
  process.exit(1);
}

if (!SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
  console.error('ERROR: SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in .env');
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

    const email = SUPERADMIN_EMAIL as string;
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      console.log(`User ${email} already exists. Nothing to do.`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD as string, 12);

    await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email,
      password: hashedPassword,
      role: 'superadmin'
    });

    console.log(`Super admin created successfully: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding super admin:', error);
    process.exit(1);
  }
}

seedSuperAdmin();
