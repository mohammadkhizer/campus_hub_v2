"use client";

import { School } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

interface ClassroomsSectionProps {
  classrooms: any[];
  loading: boolean;
}

export function ClassroomsSection({ classrooms, loading }: ClassroomsSectionProps) {
  return (
    <section>
      <h2 className="font-headline font-black text-xl text-foreground flex items-center gap-2 mb-4">
        <School className="h-5 w-5 text-accent" /> My Classrooms
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {classrooms.map((cls) => (
          <Card key={cls.id} className="group hover:shadow-md transition-all border-l-4 border-l-accent">
            <CardHeader className="py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <School className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{cls.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">Coordinator: {cls.createdByName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <p className="font-bold text-foreground">{cls.courseCount}</p>
                    <p className="text-muted-foreground uppercase text-[9px]">Courses</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{cls.studentCount}</p>
                    <p className="text-muted-foreground uppercase text-[9px]">Peers</p>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
        {classrooms.length === 0 && !loading && (
          <Card className="p-8 text-center bg-muted/30">
            <p className="text-sm text-muted-foreground font-mono">No classroom assignments found.</p>
          </Card>
        )}
      </div>
    </section>
  );
}
