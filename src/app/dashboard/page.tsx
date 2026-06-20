"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

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
    <div className="min-h-screen p-8 bg-neutral-surface flex flex-col space-y-6 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-[150px] w-full rounded-xl" />
        <Skeleton className="h-[150px] w-full rounded-xl" />
        <Skeleton className="h-[150px] w-full rounded-xl" />
      </div>
      <div className="flex gap-6 mt-8 h-[400px]">
        <Skeleton className="h-full w-2/3 rounded-xl" />
        <Skeleton className="h-full w-1/3 rounded-xl" />
      </div>
    </div>
  );
}
