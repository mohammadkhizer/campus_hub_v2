'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/mongoose';
import PlacementProfile from '@/models/PlacementProfile';
import PlacementDrive from '@/models/PlacementDrive';
import PlacementApplication from '@/models/PlacementApplication';
import { createAction } from '@/lib/action-factory';
import { USER_ROLES } from '@/lib/constants';
import { z } from 'zod';
import { toDTO } from '@/lib/dto';

// ── STUDENT ACTIONS ──

export async function getPlacementProfileAction() {
  return createAction({
    name: 'getPlacementProfileAction',
    allowedRoles: [USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async (_, { user: session }) => {
      let profile = await PlacementProfile.findOne({ 
        student: session!.id, 
        institutionId: session!.institutionId 
      }).lean();
      
      if (!profile) {
        profile = await PlacementProfile.create({ 
          student: session!.id, 
          institutionId: session!.institutionId 
        });
      }

      return toDTO<any>(profile);
    }
  }, {});
}

export async function updatePlacementProfileAction(data: any) {
  return createAction({
    name: 'updatePlacementProfileAction',
    allowedRoles: [USER_ROLES.STUDENT],
    handler: async (rawInput, { user: session }) => {
      const updateData = { ...rawInput };
      // Security: If student updates academics, reset verification status
      if (rawInput.academicMetrics || rawInput.personalDetails) {
        updateData['academicMetrics.isVerified'] = false;
      }

      const profile = await PlacementProfile.findOneAndUpdate(
        { student: session!.id, institutionId: session!.institutionId },
        { $set: updateData },
        { new: true, upsert: true }
      ).lean();

      revalidatePath('/student/placements');
      return { profile: toDTO<any>(profile) };
    }
  }, data);
}

export async function getEligibleDrivesAction() {
  return createAction({
    name: 'getEligibleDrivesAction',
    allowedRoles: [USER_ROLES.STUDENT, USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async (_, { user: session }) => {
      const profile = await PlacementProfile.findOne({ student: session!.id, institutionId: session!.institutionId }).lean();
      if (!profile) return [];

      const drives = await PlacementDrive.find({ status: 'active', institutionId: session!.institutionId }).lean();
      
      return drives.map(drive => {
        const isEligible = (
          (profile.academicMetrics?.currentCGPA || 0) >= (drive.eligibility?.minCGPA || 0) &&
          (profile.academicMetrics?.activeBacklogs || 0) <= (drive.eligibility?.maxActiveBacklogs || 0) &&
          (profile.personalDetails?.tenthPercentage || 0) >= (drive.eligibility?.minTenthPercentage || 0) &&
          (profile.personalDetails?.twelfthPercentage || 0) >= (drive.eligibility?.minTwelfthPercentage || 0)
        );
        
        return {
          ...toDTO<any>(drive),
          isEligible,
          reasons: isEligible ? [] : [
            (profile.academicMetrics?.currentCGPA || 0) < (drive.eligibility?.minCGPA || 0) ? 'Low CGPA' : null,
            (profile.academicMetrics?.activeBacklogs || 0) > (drive.eligibility?.maxActiveBacklogs || 0) ? 'Active Backlogs' : null,
            (profile.personalDetails?.tenthPercentage || 0) < (drive.eligibility?.minTenthPercentage || 0) ? 'Low 10th Marks' : null,
            (profile.personalDetails?.twelfthPercentage || 0) < (drive.eligibility?.minTwelfthPercentage || 0) ? 'Low 12th Marks' : null,
          ].filter(Boolean)
        };
      });
    }
  }, {});
}

export async function applyToDriveAction(driveId: string) {
  return createAction({
    name: 'applyToDriveAction',
    allowedRoles: [USER_ROLES.STUDENT],
    inputSchema: z.object({ driveId: z.string().length(24) }),
    handler: async ({ driveId }, { user: session }) => {
      const drive = await PlacementDrive.findOne({ _id: driveId, institutionId: session!.institutionId }).lean();
      if (!drive) throw new Error('Drive not found or unauthorized');

      const profile = await PlacementProfile.findOne({ student: session!.id, institutionId: session!.institutionId }).lean();
      if (!profile) throw new Error('Placement profile not found');

      const existing = await PlacementApplication.findOne({ student: session!.id, drive: driveId });
      if (existing) throw new Error('You have already applied for this recruitment drive.');

      const isEligible = (
        (profile.academicMetrics?.currentCGPA || 0) >= (drive.eligibility?.minCGPA || 0) &&
        (profile.academicMetrics?.activeBacklogs || 0) <= (drive.eligibility?.maxActiveBacklogs || 0) &&
        (profile.personalDetails?.tenthPercentage || 0) >= (drive.eligibility?.minTenthPercentage || 0) &&
        (profile.personalDetails?.twelfthPercentage || 0) >= (drive.eligibility?.minTwelfthPercentage || 0)
      );

      if (!isEligible) throw new Error('You do not meet the full eligibility criteria.');

      const application = await PlacementApplication.create({
        student: session!.id,
        drive: driveId,
        institutionId: session!.institutionId,
        status: 'applied'
      });

      revalidatePath('/student/placements');
      return { application: toDTO<any>(application) };
    }
  }, { driveId });
}

// ── ADMIN / TPO ACTIONS ──

export async function createPlacementDriveAction(data: any) {
  return createAction({
    name: 'createPlacementDriveAction',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    handler: async (rawInput, { user: session }) => {
      if (new Date(rawInput.deadline) > new Date(rawInput.driveDate)) {
        throw new Error('Application deadline must be on or before the drive date.');
      }

      const drive = await PlacementDrive.create({
        ...rawInput,
        institutionId: session!.institutionId
      });
      
      revalidatePath('/admin/placements');
      return { drive: toDTO<any>(drive) };
    }
  }, data);
}

export async function getAllApplicationsAction(driveId: string) {
  return createAction({
    name: 'getAllApplicationsAction',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({ driveId: z.string().length(24) }),
    handler: async ({ driveId }, { user: session }) => {
      const applications = await PlacementApplication.find({ 
        drive: driveId, 
        institutionId: session!.institutionId 
      })
      .populate({
        path: 'student',
        select: 'firstName lastName email enrollmentNumber'
      })
      .sort({ createdAt: -1 })
      .lean();

      return toDTO<any>(applications);
    }
  }, { driveId });
}

export async function updateApplicationStatusAction(applicationId: string, status: string) {
  return createAction({
    name: 'updateApplicationStatusAction',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({ applicationId: z.string().length(24), status: z.string() }),
    handler: async ({ applicationId, status }, { user: session }) => {
      const updated = await PlacementApplication.findOneAndUpdate(
        { _id: applicationId, institutionId: session!.institutionId },
        { status }
      );
      if (!updated) throw new Error('Application not found or unauthorized');
      revalidatePath('/admin/placements');
      return { success: true };
    }
  }, { applicationId, status });
}

export async function verifyStudentAcademicsAction(studentId: string, isVerified: boolean) {
  return createAction({
    name: 'verifyStudentAcademicsAction',
    allowedRoles: [USER_ROLES.ADMINISTRATOR, USER_ROLES.SUPERADMIN],
    inputSchema: z.object({ studentId: z.string().length(24), isVerified: z.boolean() }),
    handler: async ({ studentId, isVerified }, { user: session }) => {
      const updated = await PlacementProfile.findOneAndUpdate(
        { student: studentId, institutionId: session!.institutionId },
        { $set: { 'academicMetrics.isVerified': isVerified } }
      );
      if (!updated) throw new Error('Profile not found or unauthorized');
      revalidatePath('/admin/placements');
      return { success: true };
    }
  }, { studentId, isVerified });
}
