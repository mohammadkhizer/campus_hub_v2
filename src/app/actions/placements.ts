'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/mongoose';
import PlacementProfile from '@/models/PlacementProfile';
import PlacementDrive from '@/models/PlacementDrive';
import PlacementApplication from '@/models/PlacementApplication';
import { getSessionAction as getSession } from '@/app/actions/auth';
import { z } from 'zod';

// ── STUDENT ACTIONS ──

export async function getPlacementProfileAction() {
  try {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    await dbConnect();
    let profile = await PlacementProfile.findOne({ student: session.id });
    
    if (!profile) {
      profile = await PlacementProfile.create({ student: session.id });
    }

    return JSON.parse(JSON.stringify(profile));
  } catch (error: any) {
    console.error('Error fetching placement profile:', error);
    return null;
  }
}

export async function updatePlacementProfileAction(data: any) {
  try {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    await dbConnect();
    // Security: If student updates academics, reset verification status
    const updateData = { ...data };
    if (data.academicMetrics || data.personalDetails) {
      updateData['academicMetrics.isVerified'] = false;
    }

    const profile = await PlacementProfile.findOneAndUpdate(
      { student: session.id },
      { $set: updateData },
      { new: true, upsert: true }
    );

    revalidatePath('/student/placements');
    return { success: true, profile: JSON.parse(JSON.stringify(profile)) };
  } catch (error: any) {
    console.error('Error updating placement profile:', error);
    return { success: false, error: error.message };
  }
}

export async function getEligibleDrivesAction() {
  try {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    await dbConnect();
    const profile = await PlacementProfile.findOne({ student: session.id });
    if (!profile) return [];

    // Basic eligibility check logic
    const drives = await PlacementDrive.find({ status: 'active' });
    
    const eligibleDrives = drives.map(drive => {
      const driveObj = drive.toObject();
      const isEligible = (
        profile.academicMetrics.currentCGPA >= drive.eligibility.minCGPA &&
        profile.academicMetrics.activeBacklogs <= drive.eligibility.maxActiveBacklogs &&
        profile.personalDetails.tenthPercentage >= drive.eligibility.minTenthPercentage &&
        profile.personalDetails.twelfthPercentage >= drive.eligibility.minTwelfthPercentage
      );
      
      return {
        ...JSON.parse(JSON.stringify(driveObj)),
        isEligible,
        reasons: isEligible ? [] : [
          profile.academicMetrics.currentCGPA < drive.eligibility.minCGPA ? 'Low CGPA' : null,
          profile.academicMetrics.activeBacklogs > drive.eligibility.maxActiveBacklogs ? 'Active Backlogs' : null,
          profile.personalDetails.tenthPercentage < drive.eligibility.minTenthPercentage ? 'Low 10th Marks' : null,
          profile.personalDetails.twelfthPercentage < drive.eligibility.minTwelfthPercentage ? 'Low 12th Marks' : null,
        ].filter(Boolean)
      };
    });

    return eligibleDrives;
  } catch (error) {
    console.error('Error fetching eligible drives:', error);
    return [];
  }
}

export async function applyToDriveAction(driveId: string) {
  try {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    await dbConnect();
    const drive = await PlacementDrive.findById(driveId);
    if (!drive) throw new Error('Drive not found');

    const profile = await PlacementProfile.findOne({ student: session.id });
    if (!profile) throw new Error('Placement profile not found');

    // Prevent duplicate applications
    const existing = await PlacementApplication.findOne({ student: session.id, drive: driveId });
    if (existing) throw new Error('You have already applied for this recruitment drive.');

    // Re-verify eligibility on server (Full check)
    const isEligible = (
      profile.academicMetrics.currentCGPA >= drive.eligibility.minCGPA &&
      profile.academicMetrics.activeBacklogs <= drive.eligibility.maxActiveBacklogs &&
      profile.personalDetails.tenthPercentage >= drive.eligibility.minTenthPercentage &&
      profile.personalDetails.twelfthPercentage >= drive.eligibility.minTwelfthPercentage
    );

    if (!isEligible) throw new Error('You do not meet the full eligibility criteria for this drive.');

    const application = await PlacementApplication.create({
      student: session.id,
      drive: driveId,
      status: 'applied'
    });

    revalidatePath('/student/placements');
    return { success: true, application: JSON.parse(JSON.stringify(application)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ── ADMIN / TPO ACTIONS ──

export async function createPlacementDriveAction(data: any) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'administrator' && session.role !== 'superadmin')) {
      throw new Error('Unauthorized');
    }

    await dbConnect();

    // Validation: Deadline must be before Drive Date
    if (new Date(data.deadline) > new Date(data.driveDate)) {
      throw new Error('Application deadline must be on or before the drive date.');
    }

    const drive = await PlacementDrive.create(data);
    
    revalidatePath('/admin/placements');
    return { success: true, drive: JSON.parse(JSON.stringify(drive)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAllApplicationsAction(driveId: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'administrator' && session.role !== 'superadmin')) {
      throw new Error('Unauthorized');
    }

    await dbConnect();
    const applications = await PlacementApplication.find({ drive: driveId })
      .populate({
        path: 'student',
        select: 'firstName lastName email enrollmentNumber'
      })
      .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(applications));
  } catch (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
}

export async function updateApplicationStatusAction(applicationId: string, status: string) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'administrator' && session.role !== 'superadmin')) {
      throw new Error('Unauthorized');
    }

    await dbConnect();
    await PlacementApplication.findByIdAndUpdate(applicationId, { status });
    revalidatePath('/admin/placements');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function verifyStudentAcademicsAction(studentId: string, isVerified: boolean) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'administrator' && session.role !== 'superadmin')) {
      throw new Error('Unauthorized');
    }

    await dbConnect();
    await PlacementProfile.findOneAndUpdate(
      { student: studentId },
      { $set: { 'academicMetrics.isVerified': isVerified } }
    );
    
    revalidatePath('/admin/placements');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
