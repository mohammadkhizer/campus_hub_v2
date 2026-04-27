'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, BookOpen, User, Bot, Loader2, ChevronRight, Paperclip, X, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatWithCourseAction, chatWithPDFAction } from '@/ai/flows/student-ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
  citations?: any[];
}

export function AIChat({ courseId, courseTitle }: { courseId: string, courseTitle: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const currentFile = file;
    
    setInput('');
    setFile(null);
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      let response;
      
      if (currentFile) {
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('query', userMessage);
        formData.append('history', JSON.stringify(messages.map(m => ({
          role: m.role,
          content: [{ text: m.content }]
        }))));
        
        response = await chatWithPDFAction(formData);
      } else {
        response = await chatWithCourseAction({
          courseId,
          query: userMessage,
          history: messages.map(m => ({
            role: m.role,
            content: [{ text: m.content }]
          }))
        });
      }

      if (response.success && response.data) {
        setMessages(prev => [...prev, { 
          role: 'model', 
          content: response.data.answer,
          citations: response.data.citations
        }]);
      } else {
        throw new Error(response.error || 'Failed to get response');
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: `Error: ${error.message || 'Something went wrong.'}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] w-full max-w-4xl mx-auto rounded-3xl border border-cyan-500/10 bg-slate-950/80 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)] overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-200 tracking-tight">{courseTitle} Assistant</h3>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
              <p className="text-[10px] font-medium text-cyan-500/70 uppercase tracking-widest">Neural Link Active</p>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Secure Hub</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-24 text-center space-y-6">
              <div className="relative">
                <div className="absolute -inset-4 bg-cyan-500/20 blur-2xl rounded-full" />
                <div className="relative p-6 rounded-3xl bg-slate-900 border border-cyan-500/20">
                  <Bot className="w-12 h-12 text-cyan-400" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-slate-100">Initiate Academic Protocol</h4>
                <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                  I am synchronized with your course material. Ask me to explain concepts, summarize notes, or find specific details.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                {['Summarize Lecture 1', 'Explain key formulas', 'What is the next deadline?'].map((q) => (
                  <button 
                    key={q} 
                    onClick={() => setInput(q)}
                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-400 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={cn(
                  "flex gap-4 group",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300",
                  msg.role === 'user' 
                    ? "bg-slate-800 border-white/10 text-slate-300 group-hover:border-primary/50" 
                    : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 group-hover:border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                )}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                
                <div className={cn(
                  "max-w-[85%] space-y-3",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-5 rounded-3xl text-[14px] leading-relaxed shadow-xl",
                    msg.role === 'user' 
                      ? "bg-primary/90 text-primary-foreground font-medium rounded-tr-none" 
                      : "bg-slate-900/80 text-slate-300 border border-white/5 rounded-tl-none backdrop-blur-sm"
                  )}>
                    <div className="prose prose-invert prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-black/30 prose-code:text-cyan-400">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {msg.citations && msg.citations.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-wrap gap-2 px-1"
                    >
                      {msg.citations.map((cite, idx) => (
                        <button
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-[10px] font-semibold text-cyan-400/80 hover:bg-cyan-500/10 hover:text-cyan-400 transition-all"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>{cite.sourceTitle}</span>
                          {cite.page && <span className="opacity-60">• P.{cite.page}</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              </div>
              <div className="px-6 py-4 rounded-3xl bg-slate-900/50 border border-white/5 flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-6 border-t border-white/5 bg-slate-900/50">
        <AnimatePresence>
          {file && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-3 p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 px-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-medium text-cyan-200 truncate max-w-[200px]">{file.name}</span>
              </div>
              <button 
                onClick={() => setFile(null)}
                className="p-1 hover:bg-white/10 rounded-md transition-colors"
              >
                <X className="w-3 h-3 text-cyan-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-center gap-3 bg-slate-950/50 p-1.5 rounded-2xl border border-white/10 focus-within:border-cyan-500/30 focus-within:shadow-[0_0_20px_rgba(6,182,212,0.1)] transition-all">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            className="hidden"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "rounded-xl w-11 h-11 p-0 transition-all duration-300",
              file ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-slate-400 hover:bg-white/10"
            )}
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={file ? "Ask about this PDF..." : "Query your course material..."}
            className="flex-1 bg-transparent border-none text-slate-200 placeholder:text-slate-600 focus-visible:ring-0 px-4"
          />
          <Button 
            onClick={handleSend} 
            disabled={isLoading || !input.trim()}
            className={cn(
              "rounded-xl h-11 px-6 transition-all duration-300",
              input.trim() 
                ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(8,145,178,0.3)]" 
                : "bg-slate-800 text-slate-500"
            )}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="mt-3 text-[10px] text-center text-slate-600 font-medium tracking-wide uppercase">
          Neural-Search Enhanced Assistant • 10 queries remaining this hour
        </p>
      </div>
    </div>
  );
}
