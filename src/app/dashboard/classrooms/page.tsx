"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { getStudentClassrooms } from '@/app/actions/classrooms';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, School, Users, BookOpen, ArrowRight, GraduationCap } from 'lucide-react';
import Link from 'next/link';

function ClassroomsContent() {
  const { profile } = useAuth();
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!profile) return;
      setLoading(true);
      const data = await getStudentClassrooms(profile.id);
      setClassrooms(data);
      setLoading(false);
    };
    load();
  }, [profile]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-3">
              <School className="h-8 w-8 text-accent" />
              My Classrooms
            </h1>
            <p className="text-muted-foreground">
              Your assigned classrooms and available courses. Access your curriculum here.
            </p>
          </div>
          <Button className="bg-accent hover:bg-accent/90" asChild>
            <Link href="/dashboard">
              <GraduationCap className="mr-2 h-4 w-4" /> Dashboard
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p>Loading your classrooms...</p>
          </div>
        ) : classrooms.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <School className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Classrooms Assigned</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                You haven't been assigned to any classroom yet. Contact your administrator or teacher to get enrolled in a classroom.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">My Classrooms</CardTitle>
                  <School className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classrooms.length}</div>
                  <p className="text-xs text-muted-foreground">Active enrollments</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {classrooms.reduce((acc: number, cls: any) => acc + (cls.populatedCourses?.length || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all classrooms</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Classmates</CardTitle>
                  <Users className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {classrooms.reduce((acc: number, cls: any) => acc + ((cls.studentCount || 0) - 1), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Peers across classrooms</p>
                </CardContent>
              </Card>
            </div>

            {/* Classroom Cards */}
            <div className="space-y-8">
              {classrooms.map((classroom: any) => (
                <Card key={classroom.id} className="overflow-hidden border-primary/5 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <School className="h-5 w-5 text-primary" />
                          {classroom.name}
                        </CardTitle>
                        {classroom.description && (
                          <CardDescription className="mt-1">{classroom.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          <Users className="h-3 w-3 mr-1" /> {classroom.studentCount} students
                        </Badge>
                        <Badge variant="outline" className="text-xs border-accent text-accent">
                          <BookOpen className="h-3 w-3 mr-1" /> {classroom.courseCount} courses
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {classroom.populatedCourses && classroom.populatedCourses.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classroom.populatedCourses.filter((c: any) => c.isPublished !== false).map((course: any) => (
                          <Link key={course.id} href={`/courses/${course.id}`} className="block group">
                            <div className="border rounded-xl p-4 hover:border-primary hover:shadow-sm transition-all bg-white group-hover:bg-primary/[0.02]">
                              <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                  <BookOpen className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                                    {course.title}
                                  </p>
                                  {course.code && (
                                    <p className="text-[10px] font-mono font-bold text-accent mt-0.5">{course.code}</p>
                                  )}
                                  {course.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="mt-3 flex items-center justify-end text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                Enter Course <ArrowRight className="ml-1 h-3 w-3" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No courses have been assigned to this classroom yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function StudentClassroomsPage() {
  return (
    <RouteGuard allowedRole="student">
      <ClassroomsContent />
    </RouteGuard>
  );
}
