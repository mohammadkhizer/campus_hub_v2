"use client";

import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { BookOpen, LayoutDashboard, LogOut, GraduationCap, Loader2, Trophy, School } from 'lucide-react';

export function Navbar() {
  const { profile, isAuthenticated, isLoading, signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-border shadow-sm">
      {/* Blue brand strip at top */}
      <div className="h-[3px] w-full bg-gradient-to-r from-primary-dark via-primary to-blue-400" />

      <div className="container mx-auto px-6 h-14 flex items-center justify-between">

        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm group-hover:bg-primary-dark transition-colors duration-200">
            <GraduationCap className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-headline font-black text-xl tracking-tight text-foreground">
            Campus<span className="text-primary">Hub</span>
          </span>
        </Link>

        {/* ── Authenticated nav links ── */}
        {isAuthenticated && !isLoading && (
          <div className="hidden md:flex items-center gap-1">
            <Link
              href={(profile?.role === 'administrator' || profile?.role === 'teacher') ? '/admin' : '/dashboard'}
              className="nav-link flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-primary/5"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <Link href="/quizzes" className="nav-link flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-primary/5">
              <BookOpen className="h-3.5 w-3.5" />
              Quizzes
            </Link>
            {profile?.role === 'student' && (
              <Link href="/dashboard/classrooms" className="nav-link flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-primary/5">
                <School className="h-3.5 w-3.5" />
                Classrooms
              </Link>
            )}
            {(profile?.role === 'administrator' || profile?.role === 'teacher') && (
              <Link href="/admin/classrooms" className="nav-link flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-primary/5">
                <School className="h-3.5 w-3.5" />
                Classrooms
              </Link>
            )}
            {profile?.role === 'administrator' && (
              <Link href="/admin/leaderboard" className="nav-link flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-primary/5">
                <Trophy className="h-3.5 w-3.5" />
                Leaderboard
              </Link>
            )}
          </div>
        )}

        {/* ── Right side ── */}
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : !isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="font-mono text-xs font-bold tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
              >
                Login
              </Link>
              <Link href="/signup" className="btn-primary text-xs px-4 py-2">
                Get Access
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {/* Profile avatar chip */}
              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-primary/5 border border-transparent hover:border-border transition-all duration-200"
              >
                <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center shrink-0 shadow-sm">
                  <span className="font-mono text-[10px] font-black text-white">
                    {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                  </span>
                </div>
                <div className="text-left hidden sm:block">
                  <p className="font-mono text-[11px] font-bold leading-none text-foreground">
                    {profile?.firstName} {profile?.lastName}
                  </p>
                  <p className="font-mono text-[9px] text-muted-foreground capitalize mt-0.5 tracking-widest">
                    {profile?.role}
                  </p>
                </div>
              </Link>

              <button
                onClick={() => signOut()}
                title="Sign out"
                className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
