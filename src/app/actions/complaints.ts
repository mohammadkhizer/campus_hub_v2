'use server';

import dbConnect from '@/lib/mongoose';
import ComplaintModel from '@/models/Complaint';
import { getSessionAction } from '@/app/actions/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ComplaintSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.enum(['academic', 'technical', 'facility', 'administrative', 'other']),
  description: z.string().min(20, "Please provide a more detailed description (min 20 characters)"),
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
    const complaint = await ComplaintModel.create({
      ...validated.data,
      student: session.id,
      studentName: `${session.firstName} ${session.lastName}`,
      status: 'pending'
    });

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
      resolvedBy: session.id
    });

    revalidatePath('/admin/complaints');
    revalidatePath('/student/complaints');
    return { success: true };
  } catch (error) {
    console.error('Error updating complaint status:', error);
    return { success: false, error: "Update failed" };
  }
}
