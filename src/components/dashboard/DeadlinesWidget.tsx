"use client";

import { Activity, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface DeadlinesProps {
  deadlines: any[];
  loading: boolean;
}

export function DeadlinesWidget({ deadlines, loading }: DeadlinesProps) {
  return (
    <Card>
      <CardHeader className="pb-3 border-b border-border bg-neutral-surface">
        <CardTitle className="text-sm font-black flex items-center gap-2">
          <Activity className="h-4 w-4 text-destructive" /> Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
        ) : deadlines.length > 0 ? (
          <div className="divide-y divide-border">
            {deadlines.map((d) => (
              <div key={d.id} className="p-4 hover:bg-neutral-surface transition-colors cursor-pointer group">
                <p className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-1 ${d.isUrgent ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {d.timeLeft}
                </p>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">{d.title}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <AlertCircle className="h-5 w-5 text-muted-foreground mx-auto mb-2 opacity-20" />
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">No upcoming deadlines</p>
          </div>
        )}
        <Button variant="ghost" className="w-full text-xs font-bold uppercase tracking-widest rounded-none border-t border-border h-10" asChild>
          <Link href="/quizzes">View Schedule</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
