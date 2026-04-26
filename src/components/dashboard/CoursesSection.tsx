"use client";

import { BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Course } from '@/lib/types';

interface CoursesSectionProps {
  courses: Course[];
  loading: boolean;
}

export function CoursesSection({ courses, loading }: CoursesSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-headline font-black text-xl text-foreground flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> Active Courses
        </h2>
        <Button variant="ghost" className="text-primary text-xs font-mono font-bold uppercase" asChild>
          <Link href="/courses">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.slice(0, 4).map((course) => (
            <Card key={course.id} className="group hover:border-primary/50 transition-all duration-300 overflow-hidden">
              <div className="h-2 bg-primary" />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <p className="font-mono text-[10px] font-bold text-accent uppercase tracking-widest">{course.code}</p>
                  <Badge variant="outline" className="text-[9px] uppercase">Enrolled</Badge>
                </div>
                <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{course.description}</p>
                <Button className="w-full text-xs font-mono font-bold uppercase tracking-widest h-9" asChild>
                  <Link href={`/courses/${course.id}`}>Open Course</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center border-dashed border-2">
          <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-6 w-6 text-primary/40" />
          </div>
          <h3 className="font-headline font-bold text-lg mb-1">No Active Courses</h3>
          <p className="text-sm text-muted-foreground mb-6">You are not enrolled in any courses yet.</p>
          <Button variant="outline" asChild><Link href="/courses">Browse Library</Link></Button>
        </Card>
      )}
    </section>
  );
}
