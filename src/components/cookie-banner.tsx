'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, X } from 'lucide-react';

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('campus_hub_cookie_consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('campus_hub_cookie_consent', 'accepted');
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem('campus_hub_cookie_consent', 'declined');
    setShow(false);
  };

  if (!show) return null;

  return (
    <aside 
      aria-label="Cookie Consent Banner" 
      role="region" 
      className="fixed bottom-4 right-4 left-4 md:left-auto md:max-w-md z-50 p-4 rounded-xl bg-slate-900/95 border border-slate-800 backdrop-blur-md shadow-2xl text-slate-200 text-sm transition-all animate-in fade-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-2 flex-1">
          <h4 className="font-semibold text-white text-xs uppercase tracking-wider">Cookie & Privacy Notice</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            We use essential cookies to maintain secure sessions and optimize operational performance. Read our{' '}
            <Link href="/privacy" className="text-indigo-400 underline hover:text-indigo-300">
              Privacy Policy
            </Link>.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleAccept}
              className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition"
            >
              Accept All
            </button>
            <button
              onClick={handleDecline}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
            >
              Essential Only
            </button>
          </div>
        </div>
        <button
          onClick={handleDecline}
          aria-label="Close cookie consent banner"
          className="text-slate-400 hover:text-white p-1 rounded-md transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
