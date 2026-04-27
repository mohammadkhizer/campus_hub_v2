"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { getCourses, updateCourseStatus } from '@/app/actions/courses';
import { getClassrooms } from '@/app/actions/classrooms';
import { getStudentsAction, createStudentAction } from '@/app/actions/auth';
import { Course } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Loader2, Eye, Power, BookOpen, Pencil, Layout, School, Users, UserPlus, Mail, Hash, Phone, Trophy } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Lazy load heavy components
const Navbar = dynamic(() => import('@/components/navbar').then(mod => mod.Navbar), {
  loading: () => <div className="h-14 bg-white border-b border-border animate-pulse" />,
  ssr: false
});

function TeacherContent() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(false);

  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    enrollmentNumber: '',
    contactNumber: ''
  });

  const loadData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [coursesData, classroomData, studentData, quizzesData] = await Promise.all([
        getCourses(),
        getClassrooms(),
        getStudentsAction(),
        import('@/app/actions/quizzes').then(m => m.serverGetQuizzes())
      ]);
      setCourses(coursesData);
      setClassrooms(classroomData);
      setStudents(studentData);
      setQuizzes(quizzesData);
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleFocus = () => loadData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [profile]);

  const toggleStatus = async (course: Course) => {
    await updateCourseStatus(course.id, !course.isPublished);
    loadData();
    toast({ title: "Status Updated", description: `Course is now ${!course.isPublished ? 'Published' : 'Draft'}` });
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentLoading(true);
    const result = await createStudentAction(newStudent);
    if (result.success) {
      toast({ title: "Student Created", description: "The student account has been successfully onboarded." });
      setNewStudent({ 
        firstName: '', 
        lastName: '', 
        email: '', 
        password: '', 
        enrollmentNumber: '', 
        contactNumber: '' 
      });
      loadData();
    } else {
      toast({ title: "Error", description: result.error || "Failed to create student", variant: "destructive" });
    }
    setStudentLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-surface">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 py-6 md:py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 animate-fade-up">
          <div className="space-y-1">
            <p className="section-label mb-2">Academic Portal</p>
            <h1 className="font-headline font-black text-2xl md:text-3xl text-foreground flex items-center gap-3">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-success rounded-xl flex items-center justify-center shadow-green shrink-0">
                <Layout className="h-4 w-4 md:h-5 md:h-5 text-white" />
              </div>
              <span>Subject Coordinator <span className="text-success">Dashboard</span></span>
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              Welcome, {profile?.firstName}. Coordinating modules and instructional materials.
            </p>
          </div>
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="bg-white border border-border p-1 shadow-sm w-full md:w-auto flex overflow-x-auto no-scrollbar">
            <TabsTrigger value="courses" className="flex-1 md:flex-none data-[state=active]:bg-success data-[state=active]:text-white font-mono text-[10px] md:text-xs tracking-wide">
              <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" /> <span className="whitespace-nowrap">My Courses</span>
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex-1 md:flex-none data-[state=active]:bg-success data-[state=active]:text-white font-mono text-[10px] md:text-xs tracking-wide">
              <Trophy className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" /> <span className="whitespace-nowrap">Quizzes</span>
            </TabsTrigger>
            <TabsTrigger value="classrooms" className="flex-1 md:flex-none data-[state=active]:bg-success data-[state=active]:text-white font-mono text-[10px] md:text-xs tracking-wide">
              <School className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" /> <span className="whitespace-nowrap">Classrooms</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex-1 md:flex-none data-[state=active]:bg-success data-[state=active]:text-white font-mono text-[10px] md:text-xs tracking-wide">
              <Users className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" /> <span className="whitespace-nowrap">Students</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">My Courses</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold">{courses.length}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Published</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold text-green-600">{courses.filter(c => c.isPublished).length}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Active Students</CardTitle></CardHeader>
                <CardContent><div className="text-3xl font-bold text-primary">{students.length}</div></CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Course Inventory</CardTitle>
                <CardDescription>Manage your curriculum and publishing status.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-success" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {courses.map((course) => (
                          <TableRow key={course.id}>
                            <TableCell className="font-mono text-xs font-bold text-accent">{course.code || '---'}</TableCell>
                            <TableCell className="font-medium">{course.title}</TableCell>
                            <TableCell>
                              <Badge variant={course.isPublished ? 'default' : 'secondary'}>{course.isPublished ? 'Published' : 'Draft'}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => toggleStatus(course)}>
                                  <Power className={`h-4 w-4 ${course.isPublished ? 'text-green-600' : 'text-muted-foreground'}`} />
                                </Button>
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/courses/edit/${course.id}`}><Pencil className="h-4 w-4" /></Link>
                                </Button>
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/courses/${course.id}/manage`}><Layout className="h-4 w-4" /></Link>
                                </Button>
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/courses/${course.id}`}><Eye className="h-4 w-4" /></Link>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Quizzes</CardTitle>
                <CardDescription>Monitor quiz performance and leaderboards.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-success" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Quiz Title</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Questions</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quizzes.filter(q => courses.some(c => c.id === q.course)).map((quiz) => (
                          <TableRow key={quiz.id}>
                            <TableCell className="font-medium">{quiz.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{courses.find(c => c.id === quiz.course)?.title || 'Course'}</Badge>
                            </TableCell>
                            <TableCell>{quiz.questions?.length || 0} items</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" asChild className="border-accent text-accent hover:bg-accent/5">
                                <Link href={`/quizzes/${quiz.id}/leaderboard`}>
                                  <Trophy className="h-4 w-4 mr-2" /> Leaderboard
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {quizzes.filter(q => courses.some(c => c.id === q.course)).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                              No quizzes found for your courses.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classrooms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Classrooms</CardTitle>
                <CardDescription>View students and courses in your assigned classrooms.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Classroom</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Courses</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classrooms.map((cls) => (
                        <TableRow key={cls.id}>
                          <TableCell className="font-bold">{cls.name}</TableCell>
                          <TableCell>{cls.studentIds?.length || 0} enrolled</TableCell>
                          <TableCell>{cls.courseIds?.length || 0} mapped</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-1 border-primary/10 shadow-sm">
                <CardHeader className="bg-neutral-surface/50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" /> Onboard Student
                  </CardTitle>
                  <CardDescription>Create a new student account.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleCreateStudent} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">First Name</Label>
                        <Input 
                          value={newStudent.firstName} 
                          onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})} 
                          required 
                          placeholder="John"
                          className="font-mono text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Last Name</Label>
                        <Input 
                          value={newStudent.lastName} 
                          onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})} 
                          required 
                          placeholder="Doe"
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Email Address</Label>
                      <Input 
                        type="email" 
                        value={newStudent.email} 
                        onChange={(e) => setNewStudent({...newStudent, email: e.target.value})} 
                        required 
                        placeholder="john.doe@university.edu"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Enrollment Number</Label>
                      <Input 
                        value={newStudent.enrollmentNumber} 
                        onChange={(e) => setNewStudent({...newStudent, enrollmentNumber: e.target.value})} 
                        required 
                        placeholder="ENR-2024-001"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Contact Number</Label>
                      <Input 
                        value={newStudent.contactNumber} 
                        onChange={(e) => setNewStudent({...newStudent, contactNumber: e.target.value})} 
                        required 
                        placeholder="+1 (555) 000-0000"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Access Password</Label>
                      <Input 
                        type="password" 
                        value={newStudent.password} 
                        onChange={(e) => setNewStudent({...newStudent, password: e.target.value})} 
                        required 
                        placeholder="••••••••"
                        className="font-mono text-sm"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary-dark shadow-blue mt-2" disabled={studentLoading}>
                      {studentLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                      Register Student
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 shadow-sm">
                <CardHeader className="border-b bg-neutral-surface/50">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-success" /> Student Registry
                  </CardTitle>
                  <CardDescription>Comprehensive list of all registered students.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                      <TableHeader className="bg-neutral-surface/30">
                        <TableRow>
                          <TableHead className="font-mono text-[10px] uppercase tracking-widest">Student</TableHead>
                          <TableHead className="font-mono text-[10px] uppercase tracking-widest">Enrollment</TableHead>
                          <TableHead className="font-mono text-[10px] uppercase tracking-widest">Contact</TableHead>
                          <TableHead className="font-mono text-[10px] uppercase tracking-widest text-right">Access</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => (
                          <TableRow key={student.id} className="hover:bg-neutral-surface/20">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xs">
                                  {student.firstName[0]}{student.lastName[0]}
                                </div>
                                <div>
                                  <p className="font-bold text-sm">{student.firstName} {student.lastName}</p>
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                                    <Mail className="h-2.5 w-2.5" /> {student.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-accent">
                                <Hash className="h-3 w-3" /> {student.enrollmentNumber || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" /> {student.contactNumber || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-bold text-success border-success/20 bg-success/5">Active</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {students.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-mono text-xs">
                              No students found in the system.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function TeacherDashboard() {
  return (
    <RouteGuard allowedRole="teacher">
      <TeacherContent />
    </RouteGuard>
  );
}
