"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { getCourses } from '@/app/actions/courses';
import { getStudentClassrooms } from '@/app/actions/classrooms';
import { getStudentMetricsAction, getStudentDeadlinesAction } from '@/app/actions/student';
import { Course } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, School, ArrowRight, GraduationCap, Trophy, Activity, Calendar, AlertCircle, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

const Navbar = dynamic(() => import('@/components/navbar').then(mod => mod.Navbar), {
  loading: () => <div className="h-14 bg-white border-b border-border animate-pulse" />,
  ssr: false
});

const MetricsWidget = dynamic(() => import('@/components/dashboard/MetricsWidget').then(mod => mod.MetricsWidget), {
  loading: () => <div className="h-40 bg-white rounded-2xl border border-border animate-pulse" />
});

const DeadlinesWidget = dynamic(() => import('@/components/dashboard/DeadlinesWidget').then(mod => mod.DeadlinesWidget), {
  loading: () => <div className="h-40 bg-white rounded-2xl border border-border animate-pulse" />
});

const RecentQuizzesWidget = dynamic(() => import('@/components/dashboard/RecentQuizzesWidget').then(mod => mod.RecentQuizzesWidget), {
  loading: () => <div className="h-40 bg-white rounded-2xl border border-border animate-pulse" />
});

const CoursesSection = dynamic(() => import('@/components/dashboard/CoursesSection').then(mod => mod.CoursesSection), {
  loading: () => <div className="h-80 bg-white rounded-2xl border border-border animate-pulse" />
});

const ClassroomsSection = dynamic(() => import('@/components/dashboard/ClassroomsSection').then(mod => mod.ClassroomsSection), {
  loading: () => <div className="h-60 bg-white rounded-2xl border border-border animate-pulse" />
});

function StudentContent() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [coursesData, classroomData, metricsData, deadlineData, attemptsData] = await Promise.all([
        getCourses(),
        getStudentClassrooms(profile.id),
        getStudentMetricsAction(),
        getStudentDeadlinesAction(),
        import('@/lib/store').then(m => m.getAttempts(profile.id))
      ]);
      setCourses(coursesData);
      setClassrooms(classroomData);
      setMetrics(metricsData);
      setDeadlines(deadlineData);
      setRecentAttempts(attemptsData.slice(0, 3));
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  const initials = `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-neutral-surface">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 py-6 md:py-10 max-w-6xl">
        
        {/* Welcome Header */}
        <div className="rounded-2xl overflow-hidden mb-10 animate-fade-up shadow-premium"
          style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #1E40AF 100%)' }}>
          <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute inset-0 bg-dot-grid opacity-10" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 border border-white/25 shadow-sm">
                <span className="font-mono font-black text-lg md:text-xl text-white">{initials}</span>
              </div>
              <div>
                <p className="font-mono text-[10px] md:text-xs text-blue-200/70 uppercase tracking-widest mb-0.5 md:mb-1">Learning Portal</p>
                <h1 className="font-headline font-black text-2xl md:text-4xl text-white">
                  {profile?.firstName} <span className="italic">{profile?.lastName}</span>
                </h1>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors uppercase tracking-widest text-[9px]">
                    ID: {profile?.id.slice(-6)}
                  </Badge>
                  {profile?.enrollmentNumber && (
                    <Badge className="bg-success/20 text-white border-white/30 hover:bg-white/30 transition-colors uppercase tracking-widest text-[9px]">
                      ENR: {profile.enrollmentNumber}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="relative z-10 flex gap-3 mt-4 md:mt-0">
              <Button className="w-full md:w-auto bg-white text-primary hover:bg-blue-50 font-mono font-bold text-xs uppercase tracking-widest px-6" asChild>
                <Link href="/profile">My Profile</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Courses and Classrooms */}
          <div className="lg:col-span-2 space-y-8 animate-fade-up delay-150">
            
            {/* Courses Section */}
            <CoursesSection courses={courses} loading={loading} />

            {/* Classrooms Section */}
            <ClassroomsSection classrooms={classrooms} loading={loading} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6 animate-fade-up delay-300">
            
            {/* Activity Metrics */}
            <MetricsWidget metrics={metrics} loading={loading} />

            {/* Upcoming Deadlines */}
            <DeadlinesWidget deadlines={deadlines} loading={loading} />

            {/* Recent Quizzes */}
            <RecentQuizzesWidget attempts={recentAttempts} loading={loading} />

            {/* Shortcut Card */}
            <div className="rounded-2xl p-6 bg-gradient-to-br from-accent to-orange-600 text-white shadow-premium">
              <Megaphone className="h-8 w-8 mb-4 opacity-50" />
              <h3 className="font-headline font-black text-xl mb-2">Need Help?</h3>
              <p className="text-xs font-mono text-orange-100 leading-relaxed mb-6 opacity-80">
                Facing technical issues or have academic concerns? Register a complaint with the administration.
              </p>
              <Button className="w-full bg-white text-accent hover:bg-orange-50 font-bold text-xs uppercase tracking-widest shadow-sm" asChild>
                <Link href="/student/complaints">Open Complain Box</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <RouteGuard allowedRole="student">
      <StudentContent />
    </RouteGuard>
  );
}
