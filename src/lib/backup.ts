import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

/**
 * Utility to synchronize data from primary to secondary database.
 * This is a simplified version that copies specified collections.
 */
export async function syncToBackup(collectionsToSync: string[] = ['users', 'courses', 'classrooms']) {
  if (!env.MONGODB_BACKUP_URI) {
    logger.warn('No backup URI provided. Sync skipped.');
    return;
  }

  logger.info('Starting database sync to backup...');

  try {
    const primaryConn = await mongoose.createConnection(env.MONGODB_URI).asPromise();
    const backupConn = await mongoose.createConnection(env.MONGODB_BACKUP_URI).asPromise();

    for (const colName of collectionsToSync) {
      logger.info(`Syncing collection: ${colName}`);
      const primaryCol = primaryConn.collection(colName);
      const backupCol = backupConn.collection(colName);

      const data = await primaryCol.find({}).toArray();
      
      if (data.length > 0) {
        // Clear backup collection first (for full restore-style sync)
        await backupCol.deleteMany({});
        // Insert all data
        await backupCol.insertMany(data);
        logger.info(`✅ Synced ${data.length} documents for ${colName}`);
      } else {
        logger.info(`No data found for ${colName}`);
      }
    }

    await primaryConn.close();
    await backupConn.close();
    logger.security('Database sync completed successfully');
  } catch (error: any) {
    logger.error('Database sync failed', { error: error.message });
    throw error;
  }
}
