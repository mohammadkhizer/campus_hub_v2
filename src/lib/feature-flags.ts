export type SubscriptionTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface TierLimits {
  maxInstructors: number;
  maxStudents: number;
  analyticsAccess: boolean;
  exportGradesAccess: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
  ssoIntegration: boolean;
}

export const TIER_CONFIG: Record<SubscriptionTier, TierLimits> = {
  FREE: {
    maxInstructors: 1,
    maxStudents: 30,
    analyticsAccess: false,
    exportGradesAccess: false,
    prioritySupport: false,
    customBranding: false,
    ssoIntegration: false,
  },
  PRO: {
    maxInstructors: 10,
    maxStudents: 500,
    analyticsAccess: true,
    exportGradesAccess: true,
    prioritySupport: true,
    customBranding: false,
    ssoIntegration: false,
  },
  ENTERPRISE: {
    maxInstructors: 9999,
    maxStudents: 99999,
    analyticsAccess: true,
    exportGradesAccess: true,
    prioritySupport: true,
    customBranding: true,
    ssoIntegration: true,
  },
};

export function checkFeatureAccess(tier: SubscriptionTier, feature: keyof TierLimits): boolean | number {
  return TIER_CONFIG[tier]?.[feature] ?? false;
}
