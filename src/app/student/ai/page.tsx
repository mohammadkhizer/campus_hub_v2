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
    <div className="min-h-screen bg-[#050505] text-slate-300 selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />
      
      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-12 pb-32">
        
        {/* Top Navigation / Breadcrumb Area */}
        <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] text-slate-600 uppercase">
          <span className="hover:text-slate-400 transition-colors cursor-pointer">Terminal</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-cyan-500/80">Neural Student Agent</span>
        </div>

        {/* Hero & Stats Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 pb-8 border-b border-white/5">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <BrainCircuit className="w-6 h-6 text-cyan-400" />
              </div>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest">
                Agentic Logic Active
              </Badge>
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-slate-100 italic">
              NEURAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">STUDENT AGENT</span>
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed max-w-xl">
              A single interface for your entire academic journey. Ask about your performance, request a study plan, or deep-dive into course materials.
            </p>
          </div>
          
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none p-5 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-md min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-3 h-3 text-cyan-500" />
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Quiz Rank</p>
              </div>
              <p className="text-3xl font-black text-slate-200">{metrics?.quizRank || '--'}</p>
            </div>
            <div className="flex-1 lg:flex-none p-5 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-md min-w-[160px]">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Attendance</p>
              </div>
              <p className="text-3xl font-black text-slate-200">{metrics?.attendance || '98%'}</p>
            </div>
          </div>
        </div>

        {/* Central Agent Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Quick Context Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-[2rem] bg-slate-900/30 border border-white/5 backdrop-blur-sm">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Info className="w-3 h-3" /> Agent Capabilities
              </h4>
              <ul className="space-y-4">
                {[
                  { label: "Search Materials", desc: "Query your course notes" },
                  { label: "Analyze Grades", desc: "Get performance feedback" },
                  { label: "Plan Studies", desc: "Generate weekly schedules" },
                  { label: "PDF Extraction", desc: "Chat with your own files" }
                ].map((cap, i) => (
                  <li key={i} className="space-y-1">
                    <p className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-cyan-500" />
                      {cap.label}
                    </p>
                    <p className="text-[10px] text-slate-600 font-medium ml-3">{cap.desc}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-[2rem] bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20">
              <h4 className="text-xs font-black text-cyan-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Multi-Modal
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                Try saying: "Create a study plan for my exams next week" or "Analyze my performance in Discrete Math."
              </p>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            {courses.length > 0 ? (
              <AIChat courseId={courses[0].id} courseTitle={courses[0].title} />
            ) : (
              <div className="h-[650px] bg-slate-900/30 border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-10">
                <BrainCircuit className="w-16 h-16 text-slate-800 mb-4" />
                <h3 className="text-xl font-bold text-slate-400 uppercase tracking-tighter italic">Initializing Agent...</h3>
                <p className="text-slate-600 text-sm mt-2 max-w-xs font-medium">
                  Please enroll in a course to provide the agent with an academic context layer.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
