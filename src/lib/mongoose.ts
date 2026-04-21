import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

const MONGODB_URI = env.MONGODB_URI;
const MONGODB_BACKUP_URI = env.MONGODB_BACKUP_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads in development.
 * This prevents connections from growing exponentially during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null, isBackup: false };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, 
      socketTimeoutMS: 10000,
      family: 4, // Force IPv4 to avoid potential DNS issues
    };

    logger.info('DB: Creating new connection promise');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      logger.info('✅ DB: Connected to Primary');
      cached.isBackup = false;
      return m;
    }).catch(async (err) => {
      logger.error('❌ DB: Primary Connection Failed', { error: err.message });
      
      if (MONGODB_BACKUP_URI) {
        logger.warn('⚠️ DB: Trying Backup...');
        try {
          const backupConn = await mongoose.connect(MONGODB_BACKUP_URI, opts);
          logger.security('🚨 DB: FAILOVER SUCCESSFUL');
          cached.isBackup = true;
          return backupConn;
        } catch (backupErr: any) {
          logger.error('❌ DB: Backup Connection Failed', { error: backupErr.message });
          cached.promise = null;
          throw new Error('Database Connection Error');
        }
      }
      
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

export function isUsingBackup() {
  return cached.isBackup;
}

export default dbConnect;
