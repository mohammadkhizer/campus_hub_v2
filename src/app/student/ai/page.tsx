import React from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';
import { AIChat } from '@/components/ai/AIChat';
import { Navbar } from '@/components/navbar';
import { getCourses } from '@/app/actions/courses';
import { getSessionAction } from '@/app/actions/auth';
import { getStudentMetricsAction } from '@/app/actions/student';
import { Badge } from '@/components/ui/badge';

export default async function AIHubPage() {
  const session = await getSessionAction();
  const courses = await getCourses();
  const metrics = await getStudentMetricsAction();

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 selection:bg-cyan-500/30 selection:text-cyan-200 flex flex-col relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="relative group max-w-2xl w-full">
          {/* Animated Glow Border */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          
          <div className="relative flex flex-col items-center text-center gap-8 p-12 md:p-20 rounded-[2.8rem] bg-[#0A0A0A]/60 border border-white/10 backdrop-blur-3xl shadow-2xl">
            {/* Animated Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full animate-pulse" />
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shadow-inner">
                <BrainCircuit className="w-12 h-12 text-cyan-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em]">
                <Sparkles className="w-3 h-3" /> System Integration
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-100 italic uppercase">
                Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Access</span>
              </h1>
              <p className="text-xl md:text-2xl font-bold text-slate-400 tracking-tight">
                Page will be accessable soon
              </p>
            </div>

            <div className="w-full max-w-xs h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <p className="text-sm text-slate-500 font-medium max-w-sm leading-relaxed">
              We're currently calibrating the neural pathways for your academic agent. Check back shortly for the full experience.
            </p>
            
            <div className="flex items-center gap-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">
              <span>Status: Deploying</span>
              <span className="w-1 h-1 rounded-full bg-slate-700" />
              <span>Est. Time: T-Minus 24h</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
