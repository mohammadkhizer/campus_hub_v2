import { describe, it, expect } from 'vitest';
import { checkFeatureAccess } from '@/lib/feature-flags';

describe('Course & Subscription Feature Gate Integration', () => {
  it('restricts analytics access on FREE tier', () => {
    const hasAnalytics = checkFeatureAccess('FREE', 'analyticsAccess');
    expect(hasAnalytics).toBe(false);
  });

  it('allows full analytics access on PRO and ENTERPRISE tiers', () => {
    expect(checkFeatureAccess('PRO', 'analyticsAccess')).toBe(true);
    expect(checkFeatureAccess('ENTERPRISE', 'analyticsAccess')).toBe(true);
  });

  it('enforces maximum student limits per subscription tier', () => {
    expect(checkFeatureAccess('FREE', 'maxStudents')).toBe(30);
    expect(checkFeatureAccess('PRO', 'maxStudents')).toBe(500);
    expect(checkFeatureAccess('ENTERPRISE', 'maxStudents')).toBe(99999);
  });
});
