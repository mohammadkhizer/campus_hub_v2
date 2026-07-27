"use client";

import { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { 
  HelpCircle, 
  Search, 
  BookOpen, 
  School, 
  ShieldCheck, 
  Award, 
  ChevronDown, 
  MessageSquare,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface FAQ {
  question: string;
  answer: string;
  category: 'student' | 'teacher' | 'general';
}

const FAQS: FAQ[] = [
  {
    category: 'student',
    question: 'How do I attempt a scheduled quiz on Campus Hub?',
    answer: 'Navigate to the Quizzes tab from your top navbar. Select any quiz marked Active, read the instructions, and click "Start Quiz". Ensure you have a stable network connection before starting.'
  },
  {
    category: 'student',
    question: 'Where can I check my course progress and leaderboard rank?',
    answer: 'Course progress is available on your Student Dashboard. Individual quiz scores and your institution leaderboard position can be viewed under the Leaderboard tab.'
  },
  {
    category: 'teacher',
    question: 'How do I create and assign a new quiz to my classroom?',
    answer: 'Go to your Teacher Dashboard, select your target Classroom or Course, click "Create Quiz", define the title, duration, and question sets, then click "Publish".'
  },
  {
    category: 'teacher',
    question: 'Can I export student quiz results and classroom grades?',
    answer: 'Yes, instructors can access quiz attempt summaries and export score spreadsheets directly from the Course Management view.'
  },
  {
    category: 'general',
    question: 'How does Campus Hub protect user data and maintain FERPA compliance?',
    answer: 'Campus Hub uses end-to-end TLS encryption, field-level PII hashing, role-based access control (RBAC), and complies with FERPA and GDPR standards.'
  },
  {
    category: 'general',
    question: 'What should I do if I experience technical issues during an assessment?',
    answer: 'Use the Complaint Box under your navbar to submit an immediate grievance tag, or email support@campushub.edu with your system correlation ID.'
  }
];

export default function HelpPage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'student' | 'teacher' | 'general'>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = FAQS.filter(faq => {
    const matchesCat = activeCategory === 'all' || faq.category === activeCategory;
    const matchesQuery = !query || 
      faq.question.toLowerCase().includes(query.toLowerCase()) || 
      faq.answer.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <Navbar />

      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 text-[10px] font-bold font-mono uppercase tracking-widest mb-4">
              Help Center & Support
            </div>
            <h1 className="font-headline font-black text-3xl md:text-4xl text-slate-900 tracking-tight mb-3">
              Frequently Asked <span className="text-indigo-600">Questions</span>
            </h1>
            <p className="font-mono text-xs md:text-sm text-slate-600">
              Everything you need to know about using the Campus Hub learning management system.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-md mx-auto mt-6">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search help articles, quizzes, classrooms..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition shadow-sm"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex justify-center gap-2 mb-8 flex-wrap">
            {(['all', 'student', 'teacher', 'general'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold capitalize transition border ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Accordion List */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 font-mono text-xs text-slate-500">
                No matching questions found for "{query}".
              </div>
            ) : (
              filteredFaqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden transition shadow-sm"
                >
                  <button
                    onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between text-left font-headline font-bold text-sm text-slate-900 hover:text-indigo-600 transition"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openIndex === idx ? 'rotate-180' : ''}`} />
                  </button>
                  {openIndex === idx && (
                    <div className="px-5 pb-4 pt-1 font-mono text-xs text-slate-600 border-t border-slate-100 leading-relaxed bg-slate-50/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Support Footer Card */}
          <div className="mt-12 p-6 rounded-2xl bg-white border border-slate-200 text-center shadow-sm">
            <h3 className="font-headline font-bold text-sm text-slate-900 mb-1">Still need assistance?</h3>
            <p className="font-mono text-xs text-slate-500 mb-4">Our institutional technical support team is available 24/7.</p>
            <div className="flex justify-center gap-3">
              <Link 
                href="/student/complaints" 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-mono text-xs font-bold transition flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Submit Grievance
              </Link>
              <Link 
                href="/security" 
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono text-xs font-bold transition flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" /> Security Center
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
