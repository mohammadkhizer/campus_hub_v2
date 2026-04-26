"use client";

import { Trophy, Activity, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricsProps {
  metrics: any;
  loading: boolean;
}

export function MetricsWidget({ metrics, loading }: MetricsProps) {
  return (
    <Card className="bg-white shadow-sm border-border overflow-hidden">
      <div className="bg-neutral-surface px-5 py-3 border-b border-border">
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Activity Metrics</h3>
      </div>
      <CardContent className="p-5 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-4 bg-muted animate-pulse rounded" />)}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 rounded-lg"><Trophy className="h-4 w-4 text-primary" /></div>
                <span className="text-xs font-medium">Quiz Rank</span>
              </div>
              <span className="font-mono text-sm font-black">{metrics?.quizRank || '#--'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-green-50 rounded-lg"><Activity className="h-4 w-4 text-success" /></div>
                <span className="text-xs font-medium">Attendance</span>
              </div>
              <span className="font-mono text-sm font-black text-success">{metrics?.attendance || '98%'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-accent/10 rounded-lg"><Calendar className="h-4 w-4 text-accent" /></div>
                <span className="text-xs font-medium">Tasks Due</span>
              </div>
              <span className="font-mono text-sm font-black text-accent">{metrics?.tasksDue || '00'}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
