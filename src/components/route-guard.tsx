"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import type { UserRole } from '@/context/auth-context';

interface RouteGuardProps {
  children: React.ReactNode;
  /** If provided, only users with these roles can access the route. Others are redirected to '/'. */
  allowedRole?: UserRole | UserRole[];
  /** Where to redirect unauthenticated users. Defaults to '/login'. */
  redirectTo?: string;
}

export function RouteGuard({
  children,
  allowedRole,
  redirectTo = '/login',
}: RouteGuardProps) {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }

    if (allowedRole) {
      const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
      if (!allowedRoles.includes(profile?.role as any)) {
        // Redirect to the correct dashboard based on their actual role
        if (profile?.role === 'administrator' || profile?.role === 'teacher') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
      }
    }
  }, [isLoading, isAuthenticated, profile, allowedRole, redirectTo, router]);

  // Show spinner while loading auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your session...</p>
        </div>
      </div>
    );
  }

  // While redirecting (not loaded & wrong role), render nothing
  if (!isAuthenticated) return null;
  if (allowedRole) {
    const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (!allowedRoles.includes(profile?.role as any)) return null;
  }

  return <>{children}</>;
}
