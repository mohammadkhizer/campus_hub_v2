"use client";

import { Navbar } from "@/components/navbar";
import { 
  ShieldAlert, 
  Key, 
  Cpu, 
  Layers, 
  Lock, 
  Server, 
  CheckCircle,
  HelpCircle,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";

export default function SecurityProtocol() {
  const sections = [
    {
      id: "rbac",
      icon: <Key className="h-5 w-5 text-primary" />,
      title: "Role-Based Access Control (RBAC)",
      content: "We implement absolute privilege separation. The application features strictly isolated namespaces: Students can only access course materials and their own quiz results; Instructors can author courses and access class analytics; Administrators govern user rosters; and Superadmins manage infrastructure logs. Access is continuously validated at both client boundaries and API routers.",
    },
    {
      id: "encryption",
      icon: <Lock className="h-5 w-5 text-success" />,
      title: "Advanced Cryptography",
      content: "All networking sessions are encrypted in-transit using TLS 1.3 protocol. Passwords and credentials are cryptographically hashed using industry-standard bcrypt hashing with adaptive salt work factors. Primary databases and backups are encrypted at-rest using AES-256 standard encryption keys.",
    },
    {
      id: "ratelimiting",
      icon: <Cpu className="h-5 w-5 text-accent" />,
      title: "Rate Limiting & DDoS Prevention",
      content: "To protect server resources and maintain platform responsiveness, we enforce dynamic rate limiting. Requests to APIs and next-action endpoints are monitored per client IP (limited to 50 requests per minute by default). Spikes trigger temporary connection throttling and active threat logging.",
    },
    {
      id: "hardening",
      icon: <Layers className="h-5 w-5 text-indigo-500" />,
      title: "HTTP Security Hardening & CSP",
      content: "Every transaction is fortified with strict HTTP headers including Content-Security-Policy (CSP) that minimizes XSS risks, HTTP Strict Transport Security (HSTS) with preloading, X-Frame-Options (DENY) to prevent clickjacking, and X-Content-Type-Options (nosniff) for MIME sniffing protection.",
    },
    {
      id: "integrity",
      icon: <Server className="h-5 w-5 text-purple-500" />,
      title: "Database Isolation & Backups",
      content: "Academic databases run inside secure VPCs with no direct exposure to the public web. Automated differential database backups are performed daily and kept in geo-replicated storage arrays. Backup recovery procedures are audited quarterly to guarantee recovery point objectives (RPO).",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Hero Banner */}
          <div className="relative overflow-hidden bg-white border border-border rounded-3xl p-8 md:p-12 mb-12 shadow-premium animate-fade-up">
            <div className="absolute inset-0 bg-dot-grid opacity-60 -z-10" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-success/5 rounded-full blur-3xl -z-10" />
            
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/8 border border-success/20 text-success text-[10px] font-bold font-mono uppercase tracking-widest mb-4">
                Architecture Standard
              </span>
              <h1 className="font-headline font-black text-4xl md:text-5xl text-foreground tracking-tight mb-4">
                Security <span className="text-success">Protocol</span>
              </h1>
              <p className="font-mono text-xs md:text-sm text-muted-foreground leading-relaxed">
                Last updated: April 10, 2026. This protocol summarizes the active security measures, firewall rules, encryption methods, and access restrictions that safeguard the Campus Hub infrastructure.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Quick Navigation Panel */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 animate-fade-up delay-150">
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-headline font-bold text-sm text-foreground uppercase tracking-widest mb-4">
                  Security Modules
                </h3>
                <nav className="flex flex-col gap-2 font-mono text-xs">
                  {sections.map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-slate-50 hover:text-success transition-all font-medium border border-transparent hover:border-border/50"
                    >
                      <span className="shrink-0">{sec.icon}</span>
                      <span>{sec.title}</span>
                    </a>
                  ))}
                </nav>
              </div>

              {/* Status Indicator Card */}
              <div className="bg-gradient-to-br from-success/10 via-success/5 to-transparent border border-success/20 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <ShieldCheck className="h-5 w-5 text-success" />
                  <span className="font-headline font-bold text-sm text-success">Infrastructure Status</span>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground leading-relaxed mb-3">
                  All systems are fully operational. Anti-malware scanners, WAF firewalls, and rate limiters are active.
                </p>
                <div className="flex items-center gap-2 font-mono text-[9px] font-black text-success uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span>Verified Secure</span>
                </div>
              </div>
            </div>

            {/* Core Content */}
            <div className="lg:col-span-8 space-y-6 animate-fade-up delay-300">
              {sections.map((sec) => (
                <section
                  key={sec.id}
                  id={sec.id}
                  className="bg-white border border-border rounded-2xl p-6 md:p-8 shadow-sm transition-all hover:shadow-md scroll-mt-24"
                >
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/50">
                    <div className="p-2.5 bg-slate-50 border border-border rounded-xl">
                      {sec.icon}
                    </div>
                    <h2 className="font-headline font-bold text-lg md:text-xl text-foreground">
                      {sec.title}
                    </h2>
                  </div>
                  <p className="font-mono text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {sec.content}
                  </p>
                </section>
              ))}

              {/* Policy Contact Support */}
              <div className="bg-white border border-border rounded-2xl p-6 md:p-8 shadow-sm text-center">
                <HelpCircle className="h-10 w-10 text-success mx-auto mb-4" />
                <h3 className="font-headline font-bold text-base text-foreground mb-2">
                  Found a Security Vulnerability?
                </h3>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-md mx-auto mb-4">
                  We encourage responsible disclosure. If you identify a security issue, please contact our security team directly instead of publishing it.
                </p>
                <Link
                  href="mailto:security@campushub.edu"
                  className="inline-flex items-center justify-center font-mono text-xs font-bold text-white bg-success px-5 py-2.5 rounded-xl hover:bg-success-dark transition-colors shadow-green"
                >
                  Report Vulnerability
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
