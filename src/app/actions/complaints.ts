'use server';

import { createAction } from '@/lib/action-factory';
import { USER_ROLES } from '@/lib/constants';
import ComplaintModel from '@/models/Complaint';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import dbConnect from '@/lib/mongoose';
import { getSessionAction } from '@/app/actions/auth';

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
  requestId: z.string().optional(),
});

export async function submitComplaintAction(data: any) {
  return createAction({
    name: 'submitComplaintAction',
    inputSchema: ComplaintSchema,
    allowedRoles: [USER_ROLES.STUDENT],
    handler: async (validatedData, { user: session }) => {
      // Anonymity logic: Mask name for anti-ragging if requested
      const shouldBeAnonymous = validatedData.category === 'anti-ragging' || validatedData.isAnonymous;
      
      const complaint = await ComplaintModel.create({
        ...validatedData,
        student: session!.id,
        studentName: shouldBeAnonymous ? "ANONYMOUS STUDENT" : `${session!.firstName} ${session!.lastName}`,
        isAnonymous: shouldBeAnonymous,
        status: 'pending'
      });

      // ── COMMITTEE NOTIFICATIONS ──
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
                  <p><strong>From:</strong> ${session!.firstName} ${session!.lastName} (${session!.id})</p>
                  <hr />
                  <h3>Subject: ${validatedData.subject}</h3>
                  <p>${validatedData.description}</p>
                  ${validatedData.evidence?.length ? `<p><em>${validatedData.evidence.length} evidence file(s) attached.</em></p>` : ''}
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
          console.error('Failed to notify committee:', err);
        }
      }

      revalidatePath('/student/complaints');
      return { id: complaint._id.toString() };
    }
  }, data);
}

export async function getStudentComplaintsAction() {
  try {
    const session = await getSessionAction();
    if (!session) return [];

    await dbConnect();
    const complaints = await ComplaintModel.find({ student: session.id }).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(complaints)).map((c: any) => ({
      ...c,
      id: c._id.toString()
    }));
  } catch (error) {
    console.error('Error fetching student complaints:', error);
    return [];
  }
}

export async function getAllComplaintsAction() {
  try {
    const session = await getSessionAction();
    if (!session || !['administrator', 'superadmin'].includes(session.role)) {
      return [];
    }

    await dbConnect();
    const complaints = await ComplaintModel.find({}).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(complaints)).map((c: any) => ({
      ...c,
      id: c._id.toString()
    }));
  } catch (error) {
    console.error('Error fetching all complaints:', error);
    return [];
  }
}

export async function updateComplaintStatusAction(complaintId: string, status: string, response?: string) {
  try {
    const session = await getSessionAction();
    if (!session || !['administrator', 'superadmin'].includes(session.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await dbConnect();
    await ComplaintModel.findByIdAndUpdate(complaintId, {
      status,
      response,
      resolvedBy: session.id,
      resolvedAt: status === 'resolved' ? new Date() : undefined
    });

    revalidatePath('/admin/complaints');
    revalidatePath('/student/complaints');
    return { success: true };
  } catch (error) {
    console.error('Error updating complaint status:', error);
    return { success: false, error: "Update failed" };
  }
}
