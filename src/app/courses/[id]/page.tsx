"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { getCourseDetail, enrollInCourse, checkEnrollment } from '@/app/actions/courses';
import { Course } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  BookOpen, 
  Clock, 
  FileText, 
  Layout, 
  CheckCircle, 
  Download,
  AlertCircle,
  Trophy,
  Users,
  Megaphone,
  ChefHat,
  Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function CourseDetailPage() {
  const { profile } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const data = await getCourseDetail(id);
      if (!data) {
        toast({ title: "Error", description: "Course not found", variant: "destructive" });
        router.push('/courses');
        return;
      }

      // -- NEW: CLASSROOM SECURITY CHECK --
      if (profile?.role === 'student' && profile.id) {
        const { getStudentAccessibleCourses } = await import('@/app/actions/classrooms');
        const accessible = await getStudentAccessibleCourses(profile.id);
        const isAccessible = accessible.some((c: any) => c.id === data.id);
        
        if (!isAccessible) {
           toast({ title: "Access Denied", description: "This course is restricted to a different classroom.", variant: "destructive" });
           router.push('/courses');
           return;
        }
      }

      setCourse(data);
      
      if (profile) {
        const isEnrolled = await checkEnrollment(id, profile.id);
        setEnrolled(isEnrolled);
      }
      
      setLoading(false);
    };
    loadData();
  }, [id, profile, router, toast]);

  const getDownloadUrl = (url: string) => {
    if (!url) return '#';
    if (url.includes('res.cloudinary.com') && (url.includes('/image/upload/') || url.includes('/video/upload/'))) {
      const parts = url.split('/upload/');
      if (parts.length === 2) {
        return `${parts[0]}/upload/fl_attachment/${parts[1]}`;
      }
    }
    return url;
  };

  const handleEnroll = async () => {
    if (!profile) {
      router.push('/login');
      return;
    }
    
    setEnrolling(true);
    const result = await enrollInCourse(id, profile.id);
    if (result.success) {
      setEnrolled(true);
      toast({ title: "Enrolled!", description: "You have successfully enrolled in this course." });
    } else {
      toast({ title: "Error", description: "Failed to enroll.", variant: "destructive" });
    }
    setEnrolling(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      {/* Hero Header */}
      <div className="bg-primary/5 border-b border-primary/10">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex gap-2">
                <Badge variant="secondary">Science & Tech</Badge>
                <Badge className="bg-accent text-white">Advanced</Badge>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">{course.title}</h1>
                {course.code && (
                  <Badge variant="outline" className="border-accent text-accent font-bold">
                    {course.code}
                  </Badge>
                )}
              </div>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {course.description}
              </p>
              
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground pt-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  <span>500+ Students Enrolled</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" />
                  <span>12 Hours Content</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-accent" />
                  <span>Certificate Included</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-6">
                {!enrolled ? (
                  <>
                    <Button size="lg" className="bg-accent hover:bg-accent/90 px-8" onClick={handleEnroll} disabled={enrolling}>
                      {enrolling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Enroll Now
                    </Button>
                    <div className="text-sm font-medium text-primary">Free for all Students</div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-green-600 font-semibold bg-green-50 w-fit px-4 py-2 rounded-full border border-green-100">
                    <CheckCircle className="h-5 w-5" />
                    You are enrolled in this course
                  </div>
                )}

                {(profile?.role === 'administrator' || profile?.id === course.faculty) && (
                  <Button variant="outline" className="border-accent text-accent hover:bg-accent/5" asChild>
                    <Link href={`/courses/${id}/manage`}>
                      <ChefHat className="mr-2 h-4 w-4" /> Manage Course
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
              {course.thumbnail ? (
                <img 
                  src={course.thumbnail} 
                  alt={course.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.querySelector('.fallback-icon')!.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`fallback-icon w-full h-full bg-primary/10 flex items-center justify-center ${course.thumbnail ? 'hidden' : ''}`}>
                <BookOpen className="h-20 w-20 text-primary/20" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 mt-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-12">
            {!enrolled ? (
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Layout className="h-6 w-6 text-accent" />
                    Course Overview
                  </h2>
                  <div className="prose max-w-none text-muted-foreground">
                    <p>{course.description}</p>
                    <p className="mt-4">In this comprehensive course, you will dive deep into the fundamental concepts and advanced techniques of {course.title}. Our curriculum is designed by industry experts to ensure you gain practical, job-ready skills.</p>
                  </div>
                </section>

                <section className="bg-muted/30 p-8 rounded-2xl border border-dashed text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Content Locked</h3>
                  <p className="text-muted-foreground mb-6">Enroll in this course to access lectures, study materials, quizzes and assignments.</p>
                  <Button onClick={handleEnroll} variant="outline" className="border-primary text-primary hover:bg-primary/5">
                    Enroll for Free
                  </Button>
                </section>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Announcements Section */}
                {course.announcements && course.announcements.length > 0 && (
                  <section className="space-y-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                       <Megaphone className="h-6 w-6 text-accent" />
                       Recent Announcements
                    </h2>
                    <div className="grid gap-4">
                      {course.announcements.slice(0, 2).map((ann: any) => (
                        <div key={ann.id} className="bg-accent/5 border border-accent/10 p-4 rounded-xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Megaphone className="h-12 w-12 rotate-12" />
                          </div>
                          <h4 className="font-bold text-slate-900">{ann.title}</h4>
                          <p className="text-sm text-slate-600 mt-1">{ann.content}</p>
                          <div className="text-[10px] uppercase tracking-wider font-bold text-accent mt-3">
                            Posted {new Date(ann.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <Tabs defaultValue="notes" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8 h-12 bg-muted/50">
                  <TabsTrigger value="notes" className="text-base">Study Materials</TabsTrigger>
                  <TabsTrigger value="quizzes" className="text-base">Quizzes</TabsTrigger>
                  <TabsTrigger value="assignments" className="text-base">Assignments</TabsTrigger>
                </TabsList>

                {/* Notes Tab */}
                <TabsContent value="notes" className="space-y-6">
                  <div className="grid gap-4">
                    {course.notes?.map((note: any) => (
                      <Card key={note.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{note.title}</CardTitle>
                              <CardDescription>{note.description}</CardDescription>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={getDownloadUrl(note.fileUrl)} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" /> Download
                            </a>
                          </Button>
                        </CardHeader>
                      </Card>
                    ))}
                    {(!course.notes || course.notes.length === 0) && (
                      <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                        No study materials available yet.
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Quizzes Tab */}
                <TabsContent value="quizzes" className="space-y-6">
                  <div className="grid gap-4">
                    {course.quizzes?.map((quiz: any) => (
                      <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                              <Trophy className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {quiz.title}
                                {quiz.password && <Lock className="h-4 w-4 text-muted-foreground" />}
                              </CardTitle>
                              <CardDescription>{quiz.questions?.length} Questions</CardDescription>
                            </div>
                          </div>
                          <Button variant="default" className="bg-primary" asChild>
                            <Link href={`/quizzes/${quiz.id}`}>Start Quiz</Link>
                          </Button>
                        </CardHeader>
                      </Card>
                    ))}
                    {(!course.quizzes || course.quizzes.length === 0) && (
                      <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                        No quizzes assigned yet.
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Assignments Tab */}
                <TabsContent value="assignments" className="space-y-6">
                  <div className="grid gap-4">
                    {course.assignments?.map((assignment: any) => (
                      <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                              <Layout className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{assignment.title}</CardTitle>
                              <CardDescription>
                                Deadline: {new Date(assignment.deadline).toLocaleDateString()}
                              </CardDescription>
                            </div>
                          </div>
                          <Button variant="outline" asChild>
                            <Link href={`/courses/${id}/assignments/${assignment.id}`}>View Details</Link>
                          </Button>
                        </CardHeader>
                      </Card>
                    ))}
                    {(!course.assignments || course.assignments.length === 0) && (
                      <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                        No assignments listed yet.
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <Card className="border-primary/10 shadow-lg sticky top-24">
              <CardHeader>
                <CardTitle className="text-xl">Course Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Faculty Leader Highlight */}
                  <div className="p-4 bg-slate-900 rounded-[2rem] text-white shadow-xl shadow-slate-200">
                    <div className="flex items-center gap-3 mb-3">
                       <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-white/10">
                          <Users className="h-5 w-5 text-primary-foreground" />
                       </div>
                       <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assigned Faculty</p>
                          <p className="text-sm font-bold truncate">{course.facultyName || 'University Faculty'}</p>
                       </div>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-primary w-2/3 rounded-full" />
                    </div>
                  </div>

                  {/* Academic Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-blue-50/50 border border-blue-100/50 rounded-2xl">
                       <BookOpen className="h-4 w-4 text-blue-600 mb-2" />
                       <p className="text-[10px] font-bold text-blue-900/60 uppercase">Lectures</p>
                       <p className="text-xl font-black text-blue-900">{course.targetLectures || 0}</p>
                    </div>
                    <div className="p-4 bg-purple-50/50 border border-purple-100/50 rounded-2xl">
                       <AlertCircle className="h-4 w-4 text-purple-600 mb-2" />
                       <p className="text-[10px] font-bold text-purple-900/60 uppercase">Assessments</p>
                       <p className="text-xl font-black text-purple-900">{course.targetAssessments || 0}</p>
                    </div>
                  </div>

                  {/* Course Code Badge */}
                  <div className="p-4 bg-accent/5 border border-accent/20 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Layout className="h-4 w-4 text-accent" />
                       <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Course ID</span>
                    </div>
                    <span className="text-xs font-black text-slate-700 font-mono tracking-tighter">{course.code || '---'}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Requirements</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex gap-2">
                       <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                       Basic understanding of the subject
                    </li>
                    <li className="flex gap-2">
                       <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                       Willingness to learn and explore
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
