"use client";

import { Navbar } from '@/components/navbar';
import Link from 'next/link';
import { ArrowRight, Cpu, BarChart3, ShieldCheck, GraduationCap, Zap, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function LandingPage() {
  const { isAuthenticated, profile } = useAuth();
  const dashboardHref = (profile?.role === 'administrator' || profile?.role === 'teacher') ? '/admin' : (profile?.role === 'superadmin' ? '/superadmin' : '/dashboard');
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <main className="flex-1">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative pt-24 pb-20 md:pt-36 md:pb-28 overflow-hidden">
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
              <h1 className="animate-fade-up delay-150 font-headline font-black text-5xl md:text-7xl leading-[1.05] tracking-tight text-foreground mb-6">
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
                  {['Metro University', 'Tech Institute', 'Global Academy', 'Edu-Systems'].map((name) => (
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
                  <h2 className="font-headline font-black text-5xl md:text-6xl leading-tight">
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

        {/* ── FINAL CTA ─────────────────────────────────────────────────── */}
        <section className="py-24 bg-neutral-surface">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center animate-fade-up">
              <p className="section-label justify-center mb-4">Ready to Begin?</p>
              <h2 className="font-headline font-black text-4xl md:text-6xl text-foreground mb-5">
                Transform Your<br />
                <span className="text-primary">Academy Today</span>
              </h2>
              <p className="font-mono text-sm text-muted-foreground mb-10 leading-relaxed">
                Join elite institutions building their future on Campus Hub.
                Standard deployment takes less than 5 minutes.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {isAuthenticated ? (
                  <Link href={dashboardHref} className="btn-primary px-10 py-3.5 text-base rounded-xl shadow-blue">
                    <LayoutDashboard className="h-4 w-4 mr-1.5" />
                    Dashboard <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link href="/signup" className="btn-accent px-10 py-3.5 text-base rounded-xl shadow-orange">
                      Launch Platform <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/login" className="btn-outline px-10 py-3.5 text-base rounded-xl">
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-white py-14">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-10">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                <span className="font-headline font-black text-xl text-foreground">
                  Campus<span className="text-primary">Hub</span>
                </span>
              </div>
              <p className="font-mono text-sm text-muted-foreground max-w-xs leading-relaxed">
                The ultimate learning management and assessment architecture. Built for reliability, designed for excellence.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="font-mono font-bold text-[10px] uppercase tracking-[0.2em] text-foreground">Navigation</h4>
              <div className="flex flex-col space-y-3">
                {['Platform Features', 'Success Stories', 'Pricing Plans', 'Our Vision'].map((item) => (
                  <Link key={item} href="#" className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors">
                    {item}
                  </Link>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-mono font-bold text-[10px] uppercase tracking-[0.2em] text-foreground">Legal & Support</h4>
              <div className="flex flex-col space-y-3">
                {['Security Overview', 'Terms of Service', 'Privacy Policy', 'API Reference'].map((item) => (
                  <Link key={item} href="#" className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors">
                    {item}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-mono text-[11px] text-muted-foreground">
              © 2024 Campus Hub Cloud Services. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer">
                <div className="w-3 h-3 bg-current rounded-sm" />
              </div>
              <div className="w-7 h-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer">
                <div className="w-3 h-3 bg-current rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
