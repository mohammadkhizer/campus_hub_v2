/**
 * @fileOverview Centralized constants for the Campus Hub v2 platform.
 * Using these instead of magic strings improves maintainability and prevents typos.
 */

export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMINISTRATOR: 'administrator',
  SUPERADMIN: 'superadmin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const LOG_LEVELS = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  SECURITY: 'security',
} as const;

export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

export const AUTH_COOKIE_NAME = 'authToken';
export const SESSION_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds
