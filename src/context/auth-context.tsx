"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSessionAction, logoutAction } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

export type UserRole = 'student' | 'teacher' | 'administrator' | 'superadmin' | null;

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  enrollmentNumber?: string;
  contactNumber?: string;
}

interface AuthContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ 
  children, 
  initialProfile = null 
}: { 
  children: React.ReactNode;
  initialProfile?: UserProfile | null;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const router = useRouter();
  // If initialProfile is provided by SSR, start in a non-loading state
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = await getSessionAction();
      setProfile(session as UserProfile | null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty deps: this function never needs to re-create

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    console.log('[AuthContext] Initiating sign out...');
    try {
      await logoutAction();
      console.log('[AuthContext] Cookie cleared via logoutAction');
    } catch (error) {
      console.error('[AuthContext] Error during logoutAction:', error);
    }
    setProfile(null);
    console.log('[AuthContext] Local profile cleared');
    router.push('/login');
    router.refresh(); // Force a refresh to update server-side state if needed
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        profile,
        isLoading,
        isAuthenticated: !!profile,
        signOut,
        refreshSession: fetchProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
