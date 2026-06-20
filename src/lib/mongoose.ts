import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';
import { tenantPlugin } from './mongoose-tenant-plugin';

// Register global plugins
mongoose.plugin(tenantPlugin);

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
      serverSelectionTimeoutMS: 5000, 
      socketTimeoutMS: 10000,
      family: 4, // Force IPv4 to avoid potential DNS issues
      maxPoolSize: 10, // Maintain up to 10 socket connections
      minPoolSize: 2, // Keep at least 2 open sockets
      heartbeatFrequencyMS: 10000,
    };

    const connectWithRetry = async (uri: string, retries = 5, delay = 1000): Promise<typeof mongoose> => {
      try {
        return await mongoose.connect(uri, opts);
      } catch (err: any) {
        if (retries === 0) throw err;
        logger.warn(`DB Connection failed. Retrying in ${delay}ms... (${retries} left)`);
        await new Promise(res => setTimeout(res, delay));
        return connectWithRetry(uri, retries - 1, delay * 2); // Exponential backoff
      }
    };

    logger.info('DB: Creating new connection promise');
    cached.promise = connectWithRetry(MONGODB_URI).then((m) => {
      logger.info('✅ DB: Connected to Primary');
      cached.isBackup = false;
      return m;
    }).catch(async (err) => {
      logger.error('❌ DB: Primary Connection Failed', { error: err.message });
      
      if (MONGODB_BACKUP_URI) {
        logger.warn('⚠️ DB: Trying Backup...');
        try {
          const backupConn = await connectWithRetry(MONGODB_BACKUP_URI, 3, 1000);
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
