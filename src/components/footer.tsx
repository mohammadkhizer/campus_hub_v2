"use client";

import Link from 'next/link';
import { ShieldCheck, Mail, Github, Twitter, Linkedin, Activity, MessageSquare, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated } = useAuth();

  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Section */}
          <div className="space-y-4 col-span-1 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-blue">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <span className="font-headline font-black text-xl tracking-tight text-foreground">
                Campus<span className="text-primary">Hub</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-mono">
              The next-generation LMS for institutional excellence. AI-driven, secure, and built for modern academia.
            </p>
          </div>

          {/* Dynamic Links Section */}
          {isAuthenticated ? (
            <>
              {/* PLATFORM Links */}
              <div className="space-y-4">
                <h4 className="font-headline font-bold text-sm text-foreground uppercase tracking-widest">Platform</h4>
                <ul className="space-y-2">
                  <li><Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono">Home</Link></li>
                  <li><Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono">Dashboard</Link></li>
                  <li><Link href="/courses" className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono">Courses</Link></li>
                  <li><Link href="/quizzes" className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono">Quiz</Link></li>
                  <li><Link href="/student/placements" className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono">Placement</Link></li>
                  <li><Link href="/student/ai" className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono">AI Assistant</Link></li>
                </ul>
              </div>

              {/* Governance */}
              <div className="space-y-4">
                <h4 className="font-headline font-bold text-sm text-foreground uppercase tracking-widest">Governance</h4>
                <ul className="space-y-2">
                  <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono">Terms of Service</Link></li>
                  <li><Link href="/security" className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono">Security Protocol</Link></li>
                  <li><Link href="/student/complaints" className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono flex items-center gap-1.5"><ShieldAlert className="h-3 w-3" /> Complaint Box</Link></li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Guest Links */}
              <div className="space-y-4">
                <h4 className="font-headline font-bold text-sm text-foreground uppercase tracking-widest">Quick Links</h4>
                <ul className="space-y-2">
                  <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono">Terms of Service</Link></li>
                  <li><Link href="/security" className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono">Security Protocol</Link></li>
                  <li><Link href="/feedback" className="text-sm text-muted-foreground hover:text-primary transition-colors font-mono">Feedback</Link></li>
                </ul>
              </div>

              {/* Contact Section for Guest */}
              <div className="space-y-4">
                <h4 className="font-headline font-bold text-sm text-foreground uppercase tracking-widest">Contact</h4>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-mono">+91 98765 43210</p>
                  <p className="text-sm text-muted-foreground font-mono">University Road, Campus Hub Building, IN</p>
                  <div className="flex items-center gap-3 pt-2">
                    <a href="#" className="p-2 bg-neutral-surface border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary/30 transition-all">
                      <Twitter className="h-3 w-3" />
                    </a>
                    <a href="#" className="p-2 bg-neutral-surface border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary/30 transition-all">
                      <Linkedin className="h-3 w-3" />
                    </a>
                    <a href="#" className="p-2 bg-neutral-surface border border-border rounded-lg text-muted-foreground hover:text-primary hover:border-primary/30 transition-all">
                      <Github className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Contact/Support Section */}
          <div className="space-y-4">
            <h4 className="font-headline font-bold text-sm text-foreground uppercase tracking-widest">Support</h4>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground">Technical Support</p>
                <p className="text-xs text-muted-foreground font-mono">support@campushub.edu</p>
              </div>
            </div>
            <div className="flex items-start gap-3 pt-2">
              <Activity className="h-5 w-5 text-success mt-0.5" />
              <div>
                <p className="text-sm font-bold text-foreground">System Status</p>
                <p className="text-xs text-success font-mono uppercase font-black text-[10px]">Operational</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground font-mono">
              &copy; {currentYear} Campus Hub Institution. All rights reserved.
            </p>
            {/* Launch badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                width: 'fit-content',
                padding: '3px 10px',
                borderRadius: '999px',
                background: 'linear-gradient(90deg, #3b82f620 0%, #6366f120 100%)',
                border: '1px solid #6366f140',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: 'monospace',
                letterSpacing: '0.02em',
                color: '#6366f1',
              }}
            >
              <span style={{ fontSize: '13px' }}>🚀</span>
              Launched on 10 April 2026
            </span>
            <p className="text-[10px] text-muted-foreground font-mono font-bold">
              Developed by{' '}
              <a
                href="https://mohammedkhizershaikh.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline transition-colors"
              >
                Shaikh Mohammed Khizer
              </a>
            </p>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              v1.2 Stable
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
