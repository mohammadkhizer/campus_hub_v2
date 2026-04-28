'use server';

import dbConnect from '@/lib/mongoose';
import ComplaintModel from '@/models/Complaint';
import { getSessionAction } from '@/app/actions/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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
  try {
    const session = await getSessionAction();
    if (!session || session.role !== 'student') {
      return { success: false, error: "Only students can register complaints." };
    }

    const validated = ComplaintSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message };
    }

    await dbConnect();
    
    // Anonymity logic: Mask name for anti-ragging if requested
    const shouldBeAnonymous = validated.data.category === 'anti-ragging' || validated.data.isAnonymous;
    
    const complaint = await ComplaintModel.create({
      ...validated.data,
      student: session.id,
      studentName: shouldBeAnonymous ? "ANONYMOUS STUDENT" : `${session.firstName} ${session.lastName}`,
      isAnonymous: shouldBeAnonymous,
      status: 'pending'
    });

    // ── COMMITTEE NOTIFICATIONS ──
    const isUrgent = ['grievance', 'anti-ragging'].includes(validated.data.category) || validated.data.severity === 'critical';
    if (isUrgent) {
      try {
        const { sendEmail } = await import('@/lib/mail-service');
        const committeeEmail = process.env.COMMITTEE_EMAIL || 'committee@campushub.edu';
        
        await sendEmail({
          to: committeeEmail,
          subject: `URGENT: ${validated.data.category.toUpperCase()} - ${validated.data.subject}`,
          html: `
            <div style="font-family: sans-serif; border: 2px solid #dc2626; border-radius: 12px; overflow: hidden;">
              <div style="background-color: #dc2626; padding: 20px; color: white;">
                <h1 style="margin: 0;">Urgent Complaint Reported</h1>
              </div>
              <div style="padding: 24px;">
                <p><strong>Category:</strong> ${validated.data.category}</p>
                <p><strong>Severity:</strong> <span style="color: #dc2626; font-weight: bold;">${validated.data.severity.toUpperCase()}</span></p>
                <p><strong>From:</strong> ${session.firstName} ${session.lastName} (${session.id})</p>
                <hr />
                <h3>Subject: ${validated.data.subject}</h3>
                <p>${validated.data.description}</p>
                ${validated.data.evidence?.length ? `<p><em>${validated.data.evidence.length} evidence file(s) attached.</em></p>` : ''}
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
    return { success: true, id: complaint._id.toString() };
  } catch (error: any) {
    console.error('Complaint submission error:', error);
    return { success: false, error: "Failed to register complaint. Please try again." };
  }
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
