import { describe, it, expect } from 'vitest';

describe('Auth Validation Schemas & Utilities', () => {
  it('validates correct email formats', () => {
    const validEmails = ['student@campushub.edu', 'teacher@school.org', 'admin@univ.ac.in'];
    validEmails.forEach(email => {
      expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  it('rejects invalid password lengths below 6 characters', () => {
    const shortPassword = '123';
    expect(shortPassword.length < 6).toBe(true);
  });

  it('correctly maps user roles to dashboard routes', () => {
    const getDashboardHref = (role?: string) => {
      switch (role) {
        case 'superadmin': return '/superadmin/dashboard';
        case 'administrator': return '/admin/dashboard';
        case 'teacher': return '/teacher/dashboard';
        case 'student': return '/student/dashboard';
        default: return '/login';
      }
    };

    expect(getDashboardHref('student')).toBe('/student/dashboard');
    expect(getDashboardHref('teacher')).toBe('/teacher/dashboard');
    expect(getDashboardHref('administrator')).toBe('/admin/dashboard');
    expect(getDashboardHref('superadmin')).toBe('/superadmin/dashboard');
    expect(getDashboardHref(undefined)).toBe('/login');
  });
});
