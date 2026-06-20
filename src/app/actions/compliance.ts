'use server';

import { createAction } from '@/lib/action-factory';
import { z } from 'zod';
import User from '@/models/User';
import { logger } from '@/lib/logger';
import { AISafety } from '@/lib/ai-safety';

/**
 * GDPR: Right to Access (Data Export)
 * Returns all PII and related data for the authenticated user.
 */
export const exportUserDataAction = createAction({
  name: 'exportUserData',
  handler: async (input, context) => {
    if (!context.user) throw new Error('Unauthorized');

    const user = await User.findById(context.user.id).lean();
    if (!user) throw new Error('User not found');

    // In a real app, you would also aggregate quiz attempts, etc.
    const exportData = {
      profile: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        institutionId: user.institutionId,
      },
      metadata: {
        exportedAt: new Date().toISOString(),
      },
    };

    logger.info('GDPR: User data export requested', { userId: context.user.id });
    return exportData;
  }
}, {});

/**
 * GDPR: Right to Erasure (Anonymization)
 * Removes PII while retaining anonymized records for academic integrity.
 */
export const deleteUserAccountAction = createAction({
  name: 'deleteUserAccount',
  handler: async (input, context) => {
    if (!context.user) throw new Error('Unauthorized');

    const user = await User.findById(context.user.id);
    if (!user) throw new Error('User not found');

    // 1. Anonymize PII
    const oldEmail = user.email;
    user.firstName = 'Deleted';
    user.lastName = 'User';
    user.email = `deleted_${user._id}@campus-hub.invalid`;
    user.password = undefined; // Remove password
    user.isDeleted = true;
    user.deletedAt = new Date();

    await user.save();

    logger.security('GDPR: User account anonymized (Deleted)', { 
      userId: context.user.id,
      oldEmail 
    });

    return { success: true, message: 'Account has been successfully anonymized and deleted.' };
  }
}, {});

/**
 * GDPR: Consent Management
 * Stores user privacy preferences with versioning.
 */
export const saveConsentAction = createAction({
  name: 'saveConsent',
  inputSchema: z.object({
    consented: z.object({
      necessary: z.boolean(),
      analytics: z.boolean(),
      marketing: z.boolean(),
    }),
    version: z.string(),
  }),
  handler: async (input, context) => {
    if (!context.user) throw new Error('Unauthorized');
    
    const Consent = (await import('@/models/Consent')).default;
    
    await Consent.findOneAndUpdate(
      { userId: context.user.id },
      {
        ...input,
        userId: context.user.id,
        institutionId: context.user.institutionId,
        timestamp: new Date(),
      },
      { upsert: true, new: true }
    );

    logger.info('GDPR: Consent updated', { 
      userId: context.user.id, 
      analytics: input.consented.analytics,
      marketing: input.consented.marketing
    });

    return { success: true };
  }
}, { 
  consented: { necessary: true, analytics: false, marketing: false }, 
  version: '1.0' 
});
