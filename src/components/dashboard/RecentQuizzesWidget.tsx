"use client";

import { Trophy, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface RecentQuizzesProps {
  attempts: any[];
  loading: boolean;
}

export function RecentQuizzesWidget({ attempts, loading }: RecentQuizzesProps) {
  return (
    <Card>
      <CardHeader className="pb-3 border-b border-border bg-neutral-surface">
        <CardTitle className="text-sm font-black flex items-center gap-2">
          <Trophy className="h-4 w-4 text-accent" /> Recent Quizzes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
        ) : attempts.length > 0 ? (
          <div className="divide-y divide-border">
            {attempts.map((attempt) => (
              <div key={attempt.id} className="p-4 hover:bg-neutral-surface transition-colors cursor-pointer group flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">{attempt.quizTitle || 'Quiz'}</p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    {new Date(attempt.completedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  {attempt.status === 'pending_review' ? (
                    <Badge className="bg-amber-100 text-amber-700 border-none text-[9px] font-black uppercase">Pending</Badge>
                  ) : (
                    <p className="font-mono text-sm font-black text-primary">
                      {Math.round((attempt.score / attempt.totalQuestions) * 100)}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Trophy className="h-5 w-5 text-muted-foreground mx-auto mb-2 opacity-20" />
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">No quizzes taken yet</p>
          </div>
        )}
        <Button variant="ghost" className="w-full text-xs font-bold uppercase tracking-widest rounded-none border-t border-border h-10" asChild>
          <Link href="/quizzes">Take a Quiz</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
