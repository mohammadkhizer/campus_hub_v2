import nodemailer from 'nodemailer';
import { logger } from './logger';

// Configure the transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'campushub.admin@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD, // Use an App Password for Gmail
  },
});

interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

/**
 * Send an email notification
 */
export async function sendEmail({ to, subject, html }: MailOptions) {
  try {
    const mailOptions = {
      from: `"Campus Hub Admin" <${process.env.GMAIL_USER || 'campushub.admin@gmail.com'}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully', { messageId: info.messageId, to });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    logger.error('Failed to send email', { error: error.message, to });
    return { success: false, error: error.message };
  }
}

/**
 * Generate a standard email template for new course updates
 */
export function generateUpdateTemplate(type: 'Assignment' | 'Quiz' | 'Note' | 'Announcement', courseName: string, title: string, description?: string) {
  const iconMap = {
    Assignment: '📝',
    Quiz: '🏆',
    Note: '📚',
    Announcement: '📢'
  };

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #1a56db; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Campus Hub Update</h1>
      </div>
      <div style="padding: 32px; background-color: #ffffff;">
        <div style="font-size: 48px; text-align: center; margin-bottom: 16px;">${iconMap[type]}</div>
        <h2 style="color: #111827; margin: 0 0 16px 0; text-align: center;">New ${type} Uploaded</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 24px; text-align: center; margin-bottom: 24px;">
          A new ${type.toLowerCase()} has been added to your course <strong>${courseName}</strong>.
        </p>
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #f3f4f6;">
          <h3 style="color: #111827; margin: 0 0 8px 0; font-size: 18px;">${title}</h3>
          ${description ? `<p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 20px;">${description}</p>` : ''}
        </div>
        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://campus-hub-v2.vercel.app'}" 
             style="background-color: #1a56db; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            View in Dashboard
          </a>
        </div>
      </div>
      <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          &copy; 2026 Campus Hub University. All rights reserved.
        </p>
      </div>
    </div>
  `;
}
