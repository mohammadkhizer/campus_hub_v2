'use server';

import { logger } from '@/lib/logger';

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Transactional Email Dispatcher (Resend / SendGrid interface)
 */
export async function sendTransactionalEmail({ to, subject, html }: EmailParams) {
  logger.info('Transactional Email Dispatched', { to, subject });

  const apiKey = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    logger.warn('No email API key found (RESEND_API_KEY). Email logged to console in dev mode.');
    return { success: true, mode: 'simulated' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Campus Hub <noreply@campushub.edu>',
        to: [to],
        subject,
        html,
      }),
    });
    return { success: res.ok };
  } catch (err: any) {
    logger.error('Email dispatch error', { error: err.message });
    return { success: false, error: err.message };
  }
}
