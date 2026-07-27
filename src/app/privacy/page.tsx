"use client";

import { Navbar } from "@/components/navbar";
import { 
  ShieldCheck, 
  Eye, 
  Database, 
  Lock, 
  Scale, 
  FileText, 
  CheckCircle,
  HelpCircle
} from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicy() {
  const sections = [
    {
      id: "collection",
      icon: <Database className="h-5 w-5 text-primary" />,
      title: "Data Collection",
      content: "We collect only the essential academic data required to facilitate institutional instruction. This includes profile credentials (name, institutional email, assigned role), enrollment lists, course submissions, and quiz results. We do not track personal web browsing behavior outside the platform.",
    },
    {
      id: "processing",
      icon: <Eye className="h-5 w-5 text-accent" />,
      title: "Data Processing",
      content: "All processing activities are carried out solely for educational governance. Academic metrics are computed to generate student dashboards and teacher analytics. System logs and activity monitoring are processed automatically to detect academic dishonesty and maintain platform integrity.",
    },
    {
      id: "security",
      icon: <Lock className="h-5 w-5 text-success" />,
      title: "Security & Encryption",
      content: "Your data is safeguarded using enterprise-grade security. All transmissions are encrypted using TLS 1.3, and database records are encrypted at rest. Furthermore, strict role-based access control (RBAC) ensures only authorized institutional personnel can access student records.",
    },
    {
      id: "ferpa",
      icon: <Scale className="h-5 w-5 text-indigo-500" />,
      title: "FERPA Compliance",
      content: "Campus Hub operates in full alignment with the Family Educational Rights and Privacy Act (FERPA). Educational records are kept confidential and are never disclosed to third parties without explicit consent, except as permitted under applicable education laws.",
    },
    {
      id: "rights",
      icon: <FileText className="h-5 w-5 text-purple-500" />,
      title: "Student Rights",
      content: "Under institutional guidelines, students have the right to inspect their educational records, request corrections to erroneous grades, and seek data extraction. To exercise these rights, students must contact their designated campus administrator.",
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
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
            
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 border border-primary/20 text-primary text-[10px] font-bold font-mono uppercase tracking-widest mb-4">
                Governance Document
              </span>
              <h1 className="font-headline font-black text-4xl md:text-5xl text-foreground tracking-tight mb-4">
                Privacy <span className="text-primary">Policy</span>
              </h1>
              <p className="font-mono text-xs md:text-sm text-muted-foreground leading-relaxed">
                Last updated: April 10, 2026. This policy outlines our standard guidelines for the collection, protection, and governance of academic and personal records within the Campus Hub environment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Quick Navigation Panel */}
            <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24 animate-fade-up delay-150">
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
                <h3 className="font-headline font-bold text-sm text-foreground uppercase tracking-widest mb-4">
                  Quick Index
                </h3>
                <nav className="flex flex-col gap-2 font-mono text-xs">
                  {sections.map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-slate-50 hover:text-primary transition-all font-medium border border-transparent hover:border-border/50"
                    >
                      <span className="shrink-0">{sec.icon}</span>
                      <span>{sec.title}</span>
                    </a>
                  ))}
                </nav>
              </div>

              {/* Trust Badge Card */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span className="font-headline font-bold text-sm text-primary">Trust Guarantee</span>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                  We guarantee 100% data residency and secure access logs. Campus Hub will never sell your educational metrics or metadata.
                </p>
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
                <HelpCircle className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-headline font-bold text-base text-foreground mb-2">
                  Have questions about privacy?
                </h3>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-md mx-auto mb-4">
                  For additional clarification or inquiries regarding FERPA laws and data deletion requests, contact our compliance team.
                </p>
                <Link
                  href="mailto:privacy@campushub.edu"
                  className="inline-flex items-center justify-center font-mono text-xs font-bold text-white bg-primary px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors shadow-blue"
                >
                  Contact Compliance
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
