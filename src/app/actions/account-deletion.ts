'use server';

import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import { getSessionAction } from '@/app/actions/auth';
import { logger } from '@/lib/logger';

/**
 * Executes GDPR Article 17 (Right to Erasure / Delete Account)
 * Deletes user profile data and clears active session cookie.
 */
export async function deleteAccountAction() {
  try {
    const session = await getSessionAction();
    if (!session || !session.id) {
      return { success: false, error: 'Unauthorized. Active session required.' };
    }

    await dbConnect();

    // Delete user from DB
    const deletedUser = await User.findByIdAndDelete(session.id);
    if (!deletedUser) {
      return { success: false, error: 'User account not found or already deleted.' };
    }

    // Clear session cookie
    const cookieStore = await cookies();
    cookieStore.delete('authToken');

    logger.security('GDPR Right to Erasure executed - Account deleted', {
      userId: session.id,
      email: session.email,
      timestamp: new Date().toISOString()
    });

    return { success: true };
  } catch (error: any) {
    logger.error('Account deletion error', { error: error.message });
    return { success: false, error: error.message || 'Failed to process account deletion request.' };
  }
}
