"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Navbar } from '@/components/navbar';
import {
  Loader2, ArrowRight, ShieldCheck, GraduationCap,
  Layout, Activity, UserCog, BookOpen, School, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function UnifiedDashboard() {
  const { profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!authLoading && !profile) router.push('/login');
  }, [profile, authLoading, router]);

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-surface">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const roleConfigs = {
    superadmin: {
      title: 'System Governance',
      desc: 'Full institutional oversight, global metrics, and role authority across the entire platform.',
      icon: <UserCog className="h-8 w-8 text-primary" />,
      primaryCta: '/superadmin',
      ctaText: 'Launch Analytics Hub',
      badgeClass: 'badge-superadmin',
      accentBg: 'bg-primary/10',
      accentBorder: 'border-primary/20',
    },
    administrator: {
      title: 'Platform Administration',
      desc: 'Manage coordinators, established courses, and institutional classrooms.',
      icon: <ShieldCheck className="h-8 w-8 text-primary" />,
      primaryCta: '/admin',
      ctaText: 'Admin Control Panel',
      badgeClass: 'badge-admin',
      accentBg: 'bg-primary/10',
      accentBorder: 'border-primary/20',
    },
    teacher: {
      title: 'Instructional Design',
      desc: 'Curate course materials, design assessments, and track student performance.',
      icon: <Layout className="h-8 w-8 text-success" />,
      primaryCta: '/admin',
      ctaText: 'Coordinator View',
      badgeClass: 'badge-teacher',
      accentBg: 'bg-success/10',
      accentBorder: 'border-success/20',
    },
    student: {
      title: 'Student Hub',
      desc: 'Access your educational materials, track your progress, and take assessments.',
      icon: <GraduationCap className="h-8 w-8 text-primary" />,
      primaryCta: '/courses',
      ctaText: 'Continue Learning',
      badgeClass: 'badge-student',
      accentBg: 'bg-primary/10',
      accentBorder: 'border-primary/20',
    },
  };

  const currentRole = (profile?.role || 'student') as keyof typeof roleConfigs;
  const config = roleConfigs[currentRole] || roleConfigs.student;
  const initials = `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-neutral-surface">
      <Navbar />

      <main className="container mx-auto px-6 py-10 max-w-5xl">

        {/* ── Welcome Hero Banner ─────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden mb-6 animate-fade-up shadow-blue"
          style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #1E40AF 100%)' }}
        >
          <div className="relative p-8 md:p-10">
            {/* Subtle dot grid overlay */}
            <div className="absolute inset-0 bg-dot-grid opacity-10" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/25 shadow-sm">
                  <span className="font-mono font-black text-xl text-white">{initials}</span>
                </div>
                <div>
                  <p className="font-mono text-xs text-blue-200/70 uppercase tracking-widest mb-1">Welcome back</p>
                  <h1 className="font-headline font-black text-3xl md:text-4xl text-white leading-tight">
                    {profile?.firstName} <span className="italic">{profile?.lastName}</span>
                  </h1>
                  <div className="mt-2">
                    <span className={config.badgeClass}>{currentRole}</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="flex gap-3 shrink-0">
                <Link
                  href={config.primaryCta}
                  className="inline-flex items-center gap-2 bg-white text-primary font-mono font-bold text-xs tracking-widest uppercase px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                >
                  {config.ctaText}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 font-mono font-bold text-xs tracking-widest uppercase px-5 py-2.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Profile
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Capability Cards ─────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-5 mb-5 animate-fade-up delay-150">
          {/* Role module card */}
          <div className={`premium-card group ${config.accentBg} ${config.accentBorder} border`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 bg-white rounded-xl shadow-sm border ${config.accentBorder} shrink-0 group-hover:shadow-md transition-shadow`}>
                {config.icon}
              </div>
              <div>
                <p className="section-label text-primary mb-1">{currentRole} module</p>
                <h3 className="font-headline font-black text-xl text-foreground mb-2">{config.title}</h3>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">{config.desc}</p>
              </div>
            </div>
            <Link
              href={config.primaryCta}
              className="mt-5 flex items-center gap-2 text-primary font-mono text-xs font-bold hover:gap-3 transition-all"
            >
              Go to {config.title} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Analytics card */}
          <div className="premium-card group bg-success/5 border-success/20 border">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-success/20 shrink-0 group-hover:shadow-md transition-shadow">
                <Activity className="h-8 w-8 text-success" />
              </div>
              <div>
                <p className="section-label text-green-600 mb-1">Analytics</p>
                <h3 className="font-headline font-black text-xl text-foreground mb-2">Recent Insights</h3>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  View your latest activity logs and performance benchmarks across the platform.
                </p>
              </div>
            </div>
            <Link
              href="/profile"
              className="mt-5 flex items-center gap-2 text-green-700 font-mono text-xs font-bold hover:gap-3 transition-all"
            >
              View Activity <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* ── Quick Shortcuts ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up delay-300">
          {[
            { label: 'Courses', href: '/courses', icon: <BookOpen className="h-5 w-5" />, color: 'text-primary hover:text-white hover:bg-primary' },
            { label: 'Security', href: '/profile', icon: <ShieldCheck className="h-5 w-5" />, color: 'text-green-600 hover:text-white hover:bg-success' },
            { label: 'Classrooms', href: currentRole === 'student' ? '/dashboard/classrooms' : '/admin/classrooms', icon: <School className="h-5 w-5" />, color: 'text-accent hover:text-white hover:bg-accent' },
            { label: 'Settings', href: '/profile', icon: <Activity className="h-5 w-5" />, color: 'text-primary hover:text-white hover:bg-primary' },
          ].map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className={`bg-white border border-border rounded-xl flex flex-col items-center justify-center gap-2.5 py-7 font-mono text-[11px] font-bold uppercase tracking-widest transition-all duration-200 ${s.color} group shadow-sm hover:shadow-md hover:border-transparent`}
            >
              {s.icon}
              {s.label}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
