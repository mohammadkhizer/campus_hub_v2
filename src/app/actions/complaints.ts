'use server';

import dbConnect from '@/lib/mongoose';
import ComplaintModel from '@/models/Complaint';
import { revalidatePath } from 'next/cache';
import { createAction } from '@/lib/action-factory';
import { USER_ROLES } from '@/lib/constants';
import { toDTO } from '@/lib/dto';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const ComplaintSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.enum(['academic', 'technical', 'facility', 'administrative', 'grievance', 'anti-ragging', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(20, "Please provide a more detailed description (min 20 characters)"),
  evidence: z.array(z.object({
    url: z.string().url(),
    type: z.string(),
    name: z.string()
  })).optional(),
  isAnonymous: z.boolean().default(false).optional(),
});

export async function submitComplaintAction(data: any) {
  return createAction({
    name: 'submitComplaintAction',
    allowedRoles: [USER_ROLES.STUDENT],
    inputSchema: ComplaintSchema,
    handler: async (validatedData, { user: session }) => {
      // Anonymity logic
      const shouldBeAnonymous = validatedData.category === 'anti-ragging' || validatedData.isAnonymous;
      
      const complaint = await ComplaintModel.create({
        ...validatedData,
        student: session!.id,
        institutionId: session!.institutionId,
        studentName: shouldBeAnonymous ? "ANONYMOUS STUDENT" : `${session!.firstName} ${session!.lastName}`,
        isAnonymous: shouldBeAnonymous,
        status: 'pending'
      });

      // Committee notifications for urgent categories
      const isUrgent = ['grievance', 'anti-ragging'].includes(validatedData.category) || validatedData.severity === 'critical';
      if (isUrgent) {
        try {
          const { sendEmail } = await import('@/lib/mail-service');
          const committeeEmail = process.env.COMMITTEE_EMAIL || 'committee@campushub.edu';
          
          await sendEmail({
            to: committeeEmail,
            subject: `URGENT: ${validatedData.category.toUpperCase()} - ${validatedData.subject}`,
            html: `
              <div style="font-family: sans-serif; border: 2px solid #dc2626; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #dc2626; padding: 20px; color: white;">
                  <h1 style="margin: 0;">Urgent Complaint Reported</h1>
                </div>
                <div style="padding: 24px;">
                  <p><strong>Category:</strong> ${validatedData.category}</p>
                  <p><strong>Severity:</strong> <span style="color: #dc2626; font-weight: bold;">${validatedData.severity.toUpperCase()}</span></p>
                  <p><strong>Institution:</strong> ${session!.institutionId}</p>
                  <hr />
                  <h3>Subject: ${validatedData.subject}</h3>
                  <p>${validatedData.description}</p>
                  <div style="margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/complaints" style="background: #111827; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">
                      Review Complaint Now
                    </a>
                  </div>
                </div>
              </div>
            `
          });
        } catch (err) {
          logger.error('Failed to notify committee', { error: err });
        }
      }

      revalidatePath('/student/complaints');
      return { success: true, id: (complaint as any)._id.toString() };
    }
  }, data);
}

export async function getStudentComplaintsAction() {
  return createAction({
    name: 'getStudentComplaintsAction',
    allowedRoles: [USER_ROLES.STUDENT],
    handler: async (_, { user: session }) => {
      const complaints = await ComplaintModel.find({ 
        student: session!.id, 
        institutionId: session!.institutionId 
      }).sort({ createdAt: -1 }).lean();
      return toDTO<any>(complaints);
    }
  }, {});
}

export async function getAllComplaintsAction() {
  return createAction({
    name: 'getAllComplaintsAction',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async (_, { user: session }) => {
      const complaints = await ComplaintModel.find({ 
        institutionId: session!.institutionId 
      }).sort({ createdAt: -1 }).lean();
      return toDTO<any>(complaints);
    }
  }, {});
}

export async function updateComplaintStatusAction(
  complaintId: string, 
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected', 
  response?: string
) {
  return createAction({
    name: 'updateComplaintStatusAction',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({
      complaintId: z.string().length(24),
      status: z.enum(['pending', 'in-progress', 'resolved', 'rejected']),
      response: z.string().optional()
    }),
    handler: async (validatedData, { user: admin }) => {
      const updated = await ComplaintModel.findOneAndUpdate(
        { _id: validatedData.complaintId, institutionId: admin!.institutionId },
        {
          status: validatedData.status,
          response: validatedData.response,
          resolvedBy: admin!.id,
          resolvedAt: validatedData.status === 'resolved' ? new Date() : undefined
        }
      );

      if (!updated) throw new Error('Complaint not found or unauthorized');

      revalidatePath('/admin/complaints');
      revalidatePath('/student/complaints');
      return { success: true };
    }
  }, { complaintId, status, response });
}
