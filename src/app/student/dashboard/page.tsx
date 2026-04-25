"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { getCourses } from '@/app/actions/courses';
import { getStudentClassrooms } from '@/app/actions/classrooms';
import { getStudentMetricsAction, getStudentDeadlinesAction } from '@/app/actions/student';
import { Course } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BookOpen, School, ArrowRight, GraduationCap, Trophy, Activity, Calendar, AlertCircle, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// Lazy load heavy components
const Navbar = dynamic(() => import('@/components/navbar').then(mod => mod.Navbar), {
  loading: () => <div className="h-14 bg-white border-b border-border animate-pulse" />,
  ssr: false
});

function StudentContent() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [coursesData, classroomData, metricsData, deadlineData, attemptsData] = await Promise.all([
        getCourses(),
        getStudentClassrooms(profile.id),
        getStudentMetricsAction(),
        getStudentDeadlinesAction(),
        import('@/lib/store').then(m => m.getAttempts(profile.id))
      ]);
      setCourses(coursesData);
      setClassrooms(classroomData);
      setMetrics(metricsData);
      setDeadlines(deadlineData);
      setRecentAttempts(attemptsData.slice(0, 3));
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile]);

  const initials = `${profile?.firstName?.[0] ?? ''}${profile?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-neutral-surface">
      <Navbar />
      <main className="container mx-auto px-6 py-10 max-w-6xl">
        
        {/* Welcome Header */}
        <div className="rounded-2xl overflow-hidden mb-10 animate-fade-up shadow-premium"
          style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #1E40AF 100%)' }}>
          <div className="relative p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute inset-0 bg-dot-grid opacity-10" />
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 border border-white/25 shadow-sm">
                <span className="font-mono font-black text-xl text-white">{initials}</span>
              </div>
              <div>
                <p className="font-mono text-xs text-blue-200/70 uppercase tracking-widest mb-1">Learning Portal</p>
                <h1 className="font-headline font-black text-3xl md:text-4xl text-white">
                  {profile?.firstName} <span className="italic">{profile?.lastName}</span>
                </h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 transition-colors uppercase tracking-widest text-[10px]">
                    ID: {profile?.id.slice(-6)}
                  </Badge>
                  {profile?.enrollmentNumber && (
                    <Badge className="bg-success/20 text-white border-white/30 hover:bg-white/30 transition-colors uppercase tracking-widest text-[10px]">
                      ENR: {profile.enrollmentNumber}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="relative z-10 flex gap-3">
              <Button className="bg-white text-primary hover:bg-blue-50 font-mono font-bold text-xs uppercase tracking-widest px-6" asChild>
                <Link href="/profile">My Profile</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Courses and Classrooms */}
          <div className="lg:col-span-2 space-y-8 animate-fade-up delay-150">
            
            {/* Courses Section */}
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

            {/* Classrooms Section */}
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6 animate-fade-up delay-300">
            
            {/* Activity Metrics */}
            <Card className="bg-white shadow-sm border-border overflow-hidden">
              <div className="bg-neutral-surface px-5 py-3 border-b border-border">
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Activity Metrics</h3>
              </div>
              <CardContent className="p-5 space-y-4">
                {loading ? (
                   <div className="space-y-3">
                     {[1,2,3].map(i => <div key={i} className="h-4 bg-muted animate-pulse rounded" />)}
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

            {/* Upcoming Deadlines */}
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

            {/* Recent Quizzes */}
            <Card>
              <CardHeader className="pb-3 border-b border-border bg-neutral-surface">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-accent" /> Recent Quizzes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                   <div className="p-8 flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : recentAttempts.length > 0 ? (
                  <div className="divide-y divide-border">
                    {recentAttempts.map((attempt) => (
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

            {/* Shortcut Card */}
            <div className="rounded-2xl p-6 bg-gradient-to-br from-accent to-orange-600 text-white shadow-premium">
              <Megaphone className="h-8 w-8 mb-4 opacity-50" />
              <h3 className="font-headline font-black text-xl mb-2">Need Help?</h3>
              <p className="text-xs font-mono text-orange-100 leading-relaxed mb-6 opacity-80">
                Facing technical issues or have academic concerns? Register a complaint with the administration.
              </p>
              <Button className="w-full bg-white text-accent hover:bg-orange-50 font-bold text-xs uppercase tracking-widest shadow-sm" asChild>
                <Link href="/student/complaints">Open Complain Box</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <RouteGuard allowedRole="student">
      <StudentContent />
    </RouteGuard>
  );
}
