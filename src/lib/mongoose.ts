import mongoose, { ConnectOptions } from 'mongoose';
import { env } from './env';
import { logger } from './logger';

const MONGODB_URI = env.MONGODB_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads in development.
 * This prevents connections from growing exponentially during API Route usage.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: MongooseCache = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, 
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
    };

    logger.info('DB: Establishing new MongoDB connection');
    
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      logger.info('✅ DB: Connection established successfully');
      return m;
    }).catch((err) => {
      logger.error('❌ DB: Connection failed', { error: err.message });
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;

