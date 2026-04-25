"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirect() {
  const { profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!profile) {
      router.replace('/login');
      return;
    }

    const destination = 
      profile.role === 'superadmin' ? '/superadmin/dashboard' : 
      profile.role === 'administrator' ? '/admin/dashboard' : 
      profile.role === 'teacher' ? '/teacher/dashboard' : 
      '/student/dashboard';
    
    router.replace(destination);
  }, [profile, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-surface">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
          Redirecting to your dashboard...
        </p>
      </div>
    </div>
  );
}
