"use client";

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { useRouter } from 'next/navigation';
import { GraduationCap, Loader2, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { loginAction } from '@/app/actions/auth';

export default function LoginPage() {
  const { isAuthenticated, isLoading, profile, refreshSession } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && profile) {
      const destination = 
        profile.role === 'superadmin' ? '/superadmin/dashboard' : 
        profile.role === 'administrator' ? '/admin/dashboard' : 
        profile.role === 'teacher' ? '/teacher/dashboard' : 
        '/student/dashboard';
      router.replace(destination);
    }
  }, [isLoading, isAuthenticated, profile, router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const result = await loginAction(formData);
      if (result.error) {
        toast({ variant: "destructive", title: "Login Failed", description: result.error });
      } else {
        toast({ title: "Welcome back!", description: "Successfully signed in." });
        await refreshSession();
      }
    } catch {
      toast({ variant: "destructive", title: "Login Failed", description: "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-neutral-surface flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-dot-grid opacity-60 -z-10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-primary/6 to-transparent -z-10" />

        <div className="w-full max-w-sm animate-fade-up">

          {/* Card */}
          <div className="bg-white rounded-2xl border border-border shadow-premium overflow-hidden">

            {/* Card header — blue gradient */}
            <div className="bg-gradient-to-br from-primary to-primary-dark p-8 text-white text-center">
              <div className="inline-flex w-14 h-14 bg-white/15 rounded-2xl items-center justify-center mb-4 border border-white/20">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <p className="font-mono text-xs text-blue-200/80 uppercase tracking-widest mb-1">Account Access</p>
              <h1 className="font-headline font-black text-2xl">Sign In</h1>
              <p className="font-mono text-xs text-blue-100/70 mt-1.5">Enter your credentials to continue</p>
            </div>

            {/* Form body */}
            <div className="p-7">
              <form onSubmit={handleLogin} className="space-y-5">

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@university.edu"
                    disabled={loading}
                    required
                    className="form-input disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Password with show/hide */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      disabled={loading}
                      required
                      className="form-input pr-10 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword
                        ? <EyeOff className="h-4 w-4" />
                        : <Eye className="h-4 w-4" />
                      }
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 rounded-lg text-sm justify-center disabled:opacity-60 disabled:cursor-not-allowed mt-1 shadow-blue"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                  ) : (
                    <>Access Account <ArrowRight className="h-3.5 w-3.5" /></>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="mt-6 pt-5 border-t border-border text-center">
                <p className="font-mono text-xs text-muted-foreground">
                  No account yet?{' '}
                  <Link href="/signup" className="text-primary hover:text-primary-dark font-bold transition-colors">
                    Create one →
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Security badge */}
          <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground/60">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            <span className="font-mono text-[10px] uppercase tracking-widest">Secured · AES-256 Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
