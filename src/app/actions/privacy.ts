'use server';

import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Attempt from '@/models/Attempt';
import AuditLog from '@/models/AuditLog';
import { getSessionAction, logoutAction } from '@/app/actions/auth';
import { logger } from '@/lib/logger';

export async function deleteUserDataAction() {
  try {
    const session = await getSessionAction();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    await dbConnect();
    const userId = session.id;

    // 1. Anonymize/Delete Quiz Attempts
    // We choose to delete them entirely to fully comply with Right-to-be-Forgotten
    await Attempt.deleteMany({ student: userId });

    // 2. Delete Audit Logs associated with the user
    await AuditLog.deleteMany({ userId });

    // 3. Delete the User Record
    await User.findByIdAndDelete(userId);

    // 4. Log out (clears cookie)
    await logoutAction();

    logger.security('User exercised right to be forgotten', { userId, email: session.email });
    return { success: true };
  } catch (error: any) {
    logger.error('Error during data deletion', { error: error.message });
    return { success: false, error: 'Failed to process deletion request' };
  }
}

export async function acceptPrivacyPolicyAction() {
  try {
    const session = await getSessionAction();
    if (!session) {
      return { success: false, error: 'Unauthorized' };
    }

    await dbConnect();
    await User.findByIdAndUpdate(session.id, { hasConsentedToDataCollection: true });
    
    logger.info('User explicitly consented to data collection', { userId: session.id, email: session.email });
    return { success: true };
  } catch (error: any) {
    logger.error('Error recording consent', { error: error.message });
    return { success: false, error: 'Failed to record consent' };
  }
}

export async function exportUserDataAction() {
  try {
    const session = await getSessionAction();
    if (!session) return { success: false, error: 'Unauthorized' };

    await dbConnect();
    const userId = session.id;

    const user = await User.findById(userId).lean();
    const attempts = await Attempt.find({ student: userId }).lean();
    const logs = await AuditLog.find({ userId }).lean();

    const exportData = {
      userProfile: user,
      quizAttempts: attempts,
      activityLogs: logs,
      exportedAt: new Date().toISOString(),
    };

    logger.info('User exported personal data (GDPR Right to Access)', { userId, email: session.email });

    return { success: true, data: exportData };
  } catch (error: any) {
    logger.error('Error exporting user data', { error: error.message });
    return { success: false, error: 'Failed to export data' };
  }
}
