"use client";

import { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { Check, Zap, Shield, Building2, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [referralCode, setReferralCode] = useState('');
  const { toast } = useToast();

  const handleSelectTier = async (tier: 'PRO' | 'ENTERPRISE') => {
    const { createStripeCheckoutSession } = await import('@/lib/stripe');
    const res = await createStripeCheckoutSession({
      tier,
      institutionName: 'Sample University',
      email: 'admin@institution.edu',
      referralCode,
    });
    if (res.url) {
      toast({ title: 'Redirecting to Checkout', description: `Opening Stripe portal for ${tier} tier...` });
      window.open(res.url, '_blank');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-[10px] font-bold font-mono uppercase tracking-widest mb-4">
              Institutional Subscription Plans
            </div>
            <h1 className="font-headline font-black text-4xl md:text-5xl text-slate-900 tracking-tight mb-4">
              Simple Tiers for <span className="text-indigo-600">Every Institution</span>
            </h1>
            <p className="font-mono text-xs md:text-sm text-slate-600 max-w-xl mx-auto">
              Scale your learning management system seamlessly from single classrooms to campus-wide deployments.
            </p>

            {/* Billing cycle toggle */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className={`font-mono text-xs ${billingCycle === 'monthly' ? 'font-bold text-slate-900' : 'text-slate-500'}`}>Monthly</span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                className="w-12 h-6 bg-indigo-600 rounded-full p-1 transition-colors relative"
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${billingCycle === 'annual' ? 'translate-x-6' : ''}`} />
              </button>
              <span className={`font-mono text-xs ${billingCycle === 'annual' ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                Annual <span className="text-xs text-emerald-600 font-semibold">(Save 20%)</span>
              </span>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Tier 1: Free */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
              <div>
                <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest">Free Tier</span>
                <h3 className="font-headline font-bold text-2xl text-slate-900 mt-1 mb-2">Starter</h3>
                <p className="font-mono text-xs text-slate-500 leading-relaxed mb-6">Ideal for individual instructors and small trial courses.</p>
                <div className="font-headline font-black text-4xl text-slate-900 mb-6">$0 <span className="text-xs font-mono font-normal text-slate-500">/forever</span></div>
                <ul className="space-y-3 font-mono text-xs text-slate-600 mb-8">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> 1 Instructor Account</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Up to 30 Active Students</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Basic Quizzes & Assessments</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Standard Community Support</li>
                </ul>
              </div>
              <Link href="/signup" className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-mono text-xs font-bold transition text-center">
                Get Started Free
              </Link>
            </div>

            {/* Tier 2: Pro */}
            <div className="bg-white border-2 border-indigo-600 rounded-3xl p-8 flex flex-col justify-between shadow-xl relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white font-mono text-[10px] font-bold uppercase tracking-widest rounded-full">
                Most Popular
              </div>
              <div>
                <span className="font-mono text-xs font-bold text-indigo-600 uppercase tracking-widest">Department Tier</span>
                <h3 className="font-headline font-bold text-2xl text-slate-900 mt-1 mb-2">Pro Institutional</h3>
                <p className="font-mono text-xs text-slate-500 leading-relaxed mb-6">For academic departments requiring full analytics and higher capacity.</p>
                <div className="font-headline font-black text-4xl text-slate-900 mb-6">
                  {billingCycle === 'annual' ? '$149' : '$189'} <span className="text-xs font-mono font-normal text-slate-500">/month</span>
                </div>
                <ul className="space-y-3 font-mono text-xs text-slate-600 mb-8">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Up to 10 Instructor Accounts</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Up to 500 Active Students</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Full Quiz & Question Analytics</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> CSV Grade Export</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Priority Email & Ticket Support</li>
                </ul>
              </div>
              <button
                onClick={() => handleSelectTier('PRO')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-mono text-xs font-bold transition text-center shadow-indigo"
              >
                Upgrade to Pro
              </button>
            </div>

            {/* Tier 3: Enterprise */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
              <div>
                <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest">Campus-Wide</span>
                <h3 className="font-headline font-bold text-2xl text-slate-900 mt-1 mb-2">Enterprise</h3>
                <p className="font-mono text-xs text-slate-500 leading-relaxed mb-6">Custom deployment, SAML SSO, and dedicated SLA for universities.</p>
                <div className="font-headline font-black text-4xl text-slate-900 mb-6">Custom</div>
                <ul className="space-y-3 font-mono text-xs text-slate-600 mb-8">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Unlimited Instructors & Students</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Custom Domain & Branding</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> SAML 2.0 / Okta / Azure SSO</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Dedicated Account Manager & 99.9% SLA</li>
                </ul>
              </div>
              <button
                onClick={() => handleSelectTier('ENTERPRISE')}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-mono text-xs font-bold transition text-center"
              >
                Contact Enterprise Sales
              </button>
            </div>
          </div>

          {/* Referral Code input */}
          <div className="max-w-md mx-auto p-4 bg-white rounded-2xl border border-slate-200 text-center">
            <label className="block font-mono text-xs text-slate-600 mb-2">Have an institutional referral code?</label>
            <input
              type="text"
              placeholder="e.g. REF-HARVARD-2026"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl font-mono text-xs uppercase text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
