"use client";

import { Navbar } from "@/components/navbar";
import { 
  Gavel, 
  UserCheck, 
  AlertCircle, 
  Award, 
  Activity, 
  XOctagon, 
  CheckCircle,
  HelpCircle
} from "lucide-react";
import Link from "next/link";

export default function TermsOfService() {
  const sections = [
    {
      id: "agreement",
      icon: <Gavel className="h-5 w-5 text-primary" />,
      title: "Agreement to Terms",
      content: "By accessing or using the Campus Hub platform, you agree to be bound by these Terms of Service and all institutional regulations. If you represent an academic institution, you warrant that you have the authority to bind that institution to these terms.",
    },
    {
      id: "accounts",
      icon: <UserCheck className="h-5 w-5 text-accent" />,
      title: "Account Registration & Security",
      content: "Users must register with verified institutional email addresses. You are solely responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. Any suspected security breach must be reported to system administrators immediately.",
    },
    {
      id: "conduct",
      icon: <AlertCircle className="h-5 w-5 text-success" />,
      title: "Academic Integrity & Conduct",
      content: "Campus Hub is built to foster academic excellence. Cheating, plagiarism, unauthorized sharing of quiz questions, and attempts to circumvent the assessment runtime environment are strictly prohibited. Violations will be referred directly to the institution's disciplinary board.",
    },
    {
      id: "intellectual",
      icon: <Award className="h-5 w-5 text-indigo-500" />,
      title: "Intellectual Property",
      content: "The Campus Hub platform design, source code, logos, and features are the exclusive property of Campus Hub. Academic content (lecture slides, custom assignments, quiz questions) uploaded by educators remains the property of the respective instructors or their academic institutions.",
    },
    {
      id: "availability",
      icon: <Activity className="h-5 w-5 text-purple-500" />,
      title: "Service Availability & Modifications",
      content: "We strive to maintain 99.9% uptime. However, we reserve the right to perform scheduled system maintenance and release updates that may temporarily restrict access. We are not liable for academic deadlines missed due to local network issues or unapproved client configurations.",
    },
    {
      id: "termination",
      icon: <XOctagon className="h-5 w-5 text-destructive" />,
      title: "Account Termination",
      content: "We reserve the right to suspend or terminate account access immediately, without prior notice, for users found in breach of security, rate limiting parameters, or institutional academic integrity guidelines.",
    },
    {
      id: "governing",
      icon: <Gavel className="h-5 w-5 text-indigo-600" />,
      title: "Governing Law & Jurisdiction",
      content: "These Terms shall be governed by and construed in accordance with the laws of Delaware, United States (or the local jurisdiction of the subscribing academic institution), without regard to its conflict of law provisions. Any legal suit, action, or proceeding arising out of or related to these Terms shall be instituted exclusively in federal or state courts.",
    },
    {
      id: "disputes",
      icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
      title: "Dispute Resolution & Binding Arbitration",
      content: "Before filing any formal legal claim, you agree to attempt to resolve the dispute informally by contacting legal@campushub.edu. If a dispute is not resolved within 30 days of submission, it shall be settled by binding arbitration in accordance with Commercial Arbitration Rules.",
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
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
            
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/8 border border-accent/20 text-accent text-[10px] font-bold font-mono uppercase tracking-widest mb-4">
                Platform Rules
              </span>
              <h1 className="font-headline font-black text-4xl md:text-5xl text-foreground tracking-tight mb-4">
                Terms of <span className="text-accent">Service</span>
              </h1>
              <p className="font-mono text-xs md:text-sm text-muted-foreground leading-relaxed">
                Last updated: April 10, 2026. Please read these terms carefully before utilizing our learning management and assessment systems.
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
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-slate-50 hover:text-accent transition-all font-medium border border-transparent hover:border-border/50"
                    >
                      <span className="shrink-0">{sec.icon}</span>
                      <span>{sec.title}</span>
                    </a>
                  ))}
                </nav>
              </div>

              {/* Integrity Warning Card */}
              <div className="bg-gradient-to-br from-destructive/10 via-destructive/5 to-transparent border border-destructive/20 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="font-headline font-bold text-sm text-destructive">Academic Honor Code</span>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
                  Campus Hub takes academic integrity seriously. Attempting to copy quizzes or scrape assignments will trigger security alerts and may lead to immediate suspension.
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
                <HelpCircle className="h-10 w-10 text-accent mx-auto mb-4" />
                <h3 className="font-headline font-bold text-base text-foreground mb-2">
                  Have questions about these terms?
                </h3>
                <p className="font-mono text-xs text-muted-foreground leading-relaxed max-w-md mx-auto mb-4">
                  For inquiries concerning legal permissions, billing administration, or security disclosures, reach out to support.
                </p>
                <Link
                  href="mailto:legal@campushub.edu"
                  className="inline-flex items-center justify-center font-mono text-xs font-bold text-white bg-accent px-5 py-2.5 rounded-xl hover:bg-accent-dark transition-colors shadow-orange"
                >
                  Contact Legal Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
