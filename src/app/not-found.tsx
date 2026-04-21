"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { ArrowLeft, Home, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-surface">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-md w-full text-center space-y-8 animate-fade-up">
          {/* Icon/Visual */}
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl animate-pulse" />
            <div className="relative w-24 h-24 bg-white border border-border rounded-3xl flex items-center justify-center shadow-premium">
              <FileQuestion className="h-10 w-10 text-primary" />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-3">
            <h1 className="font-headline font-black text-6xl text-foreground tracking-tighter">
              404
            </h1>
            <h2 className="font-headline font-bold text-xl text-foreground">
              Page Not Found
            </h2>
            <p className="font-mono text-sm text-muted-foreground leading-relaxed">
              The academic resource you are looking for has been archived, moved, or never existed in our ecosystem.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/" 
              className="btn-primary w-full sm:w-auto px-8 shadow-blue flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Return Home
            </Link>
            <button 
              onClick={() => window.history.back()}
              className="btn-outline w-full sm:w-auto px-8 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </div>

          {/* System Footer Link */}
          <div className="pt-8 border-t border-border/50">
            <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              Campus Hub Global Directory
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
