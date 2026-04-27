"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { getDisplayedFeedbacks } from '@/lib/store';
import { ArrowRight, Cpu, BarChart3, ShieldCheck, GraduationCap, Zap, LayoutDashboard, Star, Quote } from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, profile } = useAuth();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      const data = await getDisplayedFeedbacks();
      setFeedbacks(data);
    };
    fetchFeedbacks();
  }, []);

  const dashboardHref =
    profile?.role === 'superadmin' ? '/superadmin/dashboard' :
      profile?.role === 'administrator' ? '/admin/dashboard' :
        profile?.role === 'teacher' ? '/teacher/dashboard' :
          '/student/dashboard';
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-1">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative pt-20 pb-16 md:pt-36 md:pb-28 overflow-hidden">
          {/* Dot grid background */}
          <div className="absolute inset-0 bg-dot-grid opacity-100 -z-10" />
          {/* Blue radial glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-primary/10 to-transparent -z-10" />

          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">

              {/* Pill badge */}
              <div className="animate-fade-up inline-flex items-center gap-2 bg-primary/8 border border-primary/20 text-primary rounded-full px-4 py-1.5 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                <span className="font-mono text-[11px] font-bold tracking-widest uppercase">Next-Gen Academic Ecosystem</span>
              </div>

              {/* Headline */}
              <h1 className="animate-fade-up delay-150 font-headline font-black text-4xl md:text-7xl leading-[1.1] tracking-tight text-foreground mb-6">
                Empower Your{' '}
                <span className="text-shimmer">Educational</span>{' '}
                Journey
              </h1>

              {/* Subtext */}
              <p className="animate-fade-up delay-300 font-mono text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
                The most advanced LMS and assessment architecture designed for institutional excellence,
                AI-driven insights, and seamless academic collaboration.
              </p>

              {/* CTAs */}
              <div className="animate-fade-up delay-400 flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
                {isAuthenticated ? (
                  <Link href={dashboardHref} className="btn-primary px-8 py-3.5 text-base rounded-xl shadow-blue">
                    <LayoutDashboard className="h-4 w-4 mr-1.5" />
                    Dashboard
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                ) : (
                  <>
                    <Link href="/signup" className="btn-accent px-8 py-3.5 text-base rounded-xl shadow-orange">
                      Start Free Trial
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                    <Link href="/login" className="btn-outline px-8 py-3.5 text-base rounded-xl">
                      Sign In
                    </Link>
                  </>
                )}
              </div>

              {/* Trust logos */}
              <div className="animate-fade-up delay-600 pt-8 border-t border-border">
                <p className="section-label justify-center mb-5">Trusted by academic leaders worldwide</p>
                <div className="flex flex-wrap justify-center items-center gap-8 md:gap-14">
                  {['ABC University', 'Tech Institute', 'Global Academy', 'Edu-Systems'].map((name) => (
                    <span key={name} className="font-headline font-black text-sm text-foreground/20 hover:text-foreground/50 transition-colors uppercase tracking-widest cursor-default">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURE GRID ─────────────────────────────────────────────── */}
        <section className="py-24 bg-neutral-surface border-y border-border">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <p className="section-label justify-center mb-3">Platform Capabilities</p>
              <h2 className="font-headline font-black text-4xl md:text-5xl text-foreground mb-4">
                Engineered for <span className="text-primary">Results</span>
              </h2>
              <p className="font-mono text-sm text-muted-foreground max-w-xl mx-auto">
                Campus Hub bridges the gap between instruction and assessment with a unified, high-integrity platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <ShieldCheck className="h-6 w-6 text-white" />,
                  bg: 'bg-primary',
                  glow: 'shadow-blue',
                  label: 'For Students',
                  title: 'Student Centricity',
                  desc: 'Personalized dashboards, adaptive learning paths, and instant academic feedback loops.',
                  delay: 'delay-150',
                },
                {
                  icon: <Cpu className="h-6 w-6 text-white" />,
                  bg: 'bg-accent',
                  glow: 'shadow-orange',
                  label: 'For Educators',
                  title: 'Teacher Efficiency',
                  desc: 'AI-powered quiz generation, automated grading, and deep performance analytics.',
                  delay: 'delay-300',
                },
                {
                  icon: <BarChart3 className="h-6 w-6 text-white" />,
                  bg: 'bg-success',
                  glow: 'shadow-green',
                  label: 'For Admins',
                  title: 'Global Governance',
                  desc: 'Enterprise RBAC, system-wide metrics, and multi-cluster database resilience.',
                  delay: 'delay-400',
                },
              ].map((feat, i) => (
                <div key={i} className={`premium-card group animate-fade-up ${feat.delay} hover:translate-y-[-2px]`}>
                  <div className={`w-12 h-12 ${feat.bg} ${feat.glow} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feat.icon}
                  </div>
                  <p className="section-label text-primary mb-2">{feat.label}</p>
                  <h3 className="font-headline font-black text-xl text-foreground mb-3">{feat.title}</h3>
                  <p className="font-mono text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── VALUE PROP (dark section) ──────────────────────────────── */}
        <section className="py-28 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 55%, #1E40AF 100%)' }}>
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 bg-grid-surface opacity-5" />

          <div className="container mx-auto px-6 relative z-10">
            <div className="grid md:grid-cols-2 gap-20 items-center">

              {/* Left */}
              <div className="animate-slide-right delay-150 text-white space-y-8">
                <div>
                  <p className="section-label text-blue-200/70 mb-4">Architecture</p>
                  <h2 className="font-headline font-black text-3xl md:text-6xl leading-tight">
                    Secure.<br />Scalable.<br />
                    <span className="italic text-blue-200">Scientific.</span>
                  </h2>
                </div>
                <div className="space-y-4">
                  {[
                    'Enterprise-grade JWT Authentication with HttpOnly protection',
                    'Role-Based Access Control (RBAC) with 4-tier hierarchy',
                    'High-availability MongoDB with Automated Failover',
                    'Military-grade security headers & Global Rate Limiting',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 group">
                      <div className="mt-1 w-5 h-5 rounded bg-white/15 border border-white/25 flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:border-accent transition-all duration-300">
                        <ArrowRight className="h-2.5 w-2.5 text-white" />
                      </div>
                      <span className="font-mono text-sm text-blue-100/80 group-hover:text-white transition-colors">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
                <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-primary font-mono font-bold text-xs tracking-widest uppercase px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors shadow-premium">
                  Read Documentation <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Right — stat panel */}
              <div className="animate-scale-up delay-300">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-mono text-xs text-blue-200/70 uppercase tracking-widest">Performance</p>
                      <p className="font-headline font-black text-lg text-white">99.9% Uptime SLA</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { value: '< 200ms', label: 'Avg Response' },
                      { value: '4-Tier', label: 'RBAC System' },
                      { value: 'AES-256', label: 'Encryption' },
                      { value: '∞', label: 'Scale Limit' },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/8 rounded-xl p-4 border border-white/10">
                        <p className="font-headline font-black text-2xl text-white">{s.value}</p>
                        <p className="font-mono text-[10px] tracking-widest uppercase text-blue-200/60 mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STUDENT REVIEWS ─────────────────────────────────────────── */}
        {feedbacks.length > 0 && (
          <section className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div className="max-w-2xl">
                  <p className="section-label mb-3">Student Voice</p>
                  <h2 className="font-headline font-black text-3xl md:text-5xl text-foreground">
                    Real Stories from <span className="text-accent">Our Community</span>
                  </h2>
                </div>
                <div className="flex gap-2">
                  <div className="p-3 bg-accent/10 rounded-full">
                    <Star className="h-5 w-5 text-accent fill-accent" />
                  </div>
                  <div className="text-right">
                    <p className="font-headline font-black text-xl">4.9/5</p>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Average Student Rating</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {feedbacks.map((f, i) => (
                  <div key={f.id} className={`p-8 rounded-3xl bg-neutral-surface border border-border relative group hover:border-accent/30 transition-all duration-500 animate-fade-up`} style={{ animationDelay: `${i * 100}ms` }}>
                    <Quote className="absolute top-6 right-8 h-10 w-10 text-accent/5 group-hover:text-accent/10 transition-colors" />

                    <div className="flex gap-1 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < f.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/20'}`} />
                      ))}
                    </div>

                    <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-8 italic">
                      "{f.content}"
                    </p>

                    <div className="flex items-center gap-4 pt-6 border-t border-dashed">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 flex items-center justify-center font-headline font-black text-primary">
                        {f.studentName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-headline font-black text-base text-foreground">{f.studentName}</p>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Verified Student</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FINAL CTA (Blue Grid Technical Style) ────────────────────────── */}
        <section className="py-32 relative overflow-hidden bg-[#020617] border-t border-blue-500/10">
          {/* Blue Technical Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e40af1a_1px,transparent_1px),linear-gradient(to_bottom,#1e40af1a_1px,transparent_1px)] bg-[size:40px_40px] -z-10" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e40af33_1px,transparent_1px),linear-gradient(to_bottom,#1e40af33_1px,transparent_1px)] bg-[size:200px_200px] -z-10" />

          {/* Deep Blue Glows */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,transparent_20%,#020617_80%)] -z-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[120px] rounded-full -z-10 animate-pulse-slow" />

          <div className="container mx-auto px-6 relative">
            <div className="max-w-4xl mx-auto text-center space-y-10">

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-500/10 border border-blue-500/20">
                <div className="w-1 h-1 bg-blue-400 rounded-full" />
                <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-blue-400 font-bold">Protocol v2.4 </span>
              </div>

              <h2 className="font-headline font-black text-4xl md:text-8xl text-white leading-none tracking-tighter animate-fade-up">
                ENGINEER <br />
                <span className="text-blue-500">YOUR FUTURE</span>
              </h2>

              <p className="font-mono text-sm md:text-lg text-blue-100/40 max-w-xl mx-auto leading-relaxed uppercase tracking-wide animate-fade-up delay-150">
                The definitive platform for institutional excellence.
                Secure. Scalable. Absolute.
              </p>

              <div className="pt-12 flex flex-col items-center gap-12 animate-fade-up delay-300">
                <Link
                  href={isAuthenticated ? dashboardHref : "/signup"}
                  className="group relative inline-flex items-center gap-8 text-white transition-all duration-700"
                >
                  {/* Decorative bracket accent */}
                  <div className="absolute -left-12 top-1/2 -translate-y-1/2 h-16 w-px bg-blue-500/30 group-hover:h-24 group-hover:bg-blue-500 transition-all duration-700" />
                  <div className="absolute -right-12 top-1/2 -translate-y-1/2 h-16 w-px bg-blue-500/30 group-hover:h-24 group-hover:bg-blue-500 transition-all duration-700" />

                  <span className="font-headline font-black text-2xl md:text-6xl tracking-tight uppercase group-hover:scale-105 transition-transform duration-700">
                    {isAuthenticated ? "Launch Dashboard" : "Initialize Account"}
                  </span>

                  <div className="w-16 h-16 border border-blue-500/30 flex items-center justify-center group-hover:border-blue-500 group-hover:bg-blue-500/10 transition-all duration-700">
                    <ArrowRight className="h-8 w-8 text-blue-500" />
                  </div>
                </Link>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 pt-16 border-t border-blue-500/10 w-full max-w-4xl">
                  {[
                    { val: '256B', label: 'ENC PROTECTION' },
                    { val: 'ZERO', label: 'LATENCY ARCH' },
                    { val: '99.9', label: 'UPTIME QUOTA' },
                    { val: 'GRID', label: 'SCALE NODE' }
                  ].map((item) => (
                    <div key={item.label} className="text-center space-y-1 group cursor-default">
                      <p className="font-headline font-black text-2xl text-white group-hover:text-blue-500 transition-colors">{item.val}</p>
                      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-blue-500/50">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}
