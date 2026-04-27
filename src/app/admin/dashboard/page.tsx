"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { getCourses, updateCourseStatus, deleteCourse } from '@/app/actions/courses';
import { createTeacherAction, getUsersByRoleAction, updateCoordinatorAction, deleteCoordinatorAction } from '@/app/actions/auth';
import { getClassrooms, deleteClassroom } from '@/app/actions/classrooms';
import { Course } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Loader2, Plus, Trash2, Eye, ShieldCheck, Power, BookOpen, Pencil, Layout, Users, UserPlus, Mail, PersonStanding, School, Trophy } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Lazy load heavy components
const Navbar = dynamic(() => import('@/components/navbar').then(mod => mod.Navbar), {
  loading: () => <div className="h-14 bg-white border-b border-border animate-pulse" />,
  ssr: false
});

function AdminContent() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherLoading, setTeacherLoading] = useState(false);

  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const [editCoordinator, setEditCoordinator] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  const loadData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [coursesData, facultyData, classroomData, quizzesData] = await Promise.all([
        getCourses(),
        getUsersByRoleAction(['teacher']),
        getClassrooms(),
        import('@/app/actions/quizzes').then(m => m.serverGetQuizzes())
      ]);
      setCourses(coursesData);
      setFaculty(facultyData);
      setClassrooms(classroomData);
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
  };

  const handleDelete = async (courseId: string) => {
    const result = await deleteCourse(courseId);
    if (result.success) {
      toast({ title: "Course Deleted", description: "Course and all related data removed." });
      loadData();
    } else {
      toast({ title: "Error", description: result.error || "Failed to delete course.", variant: "destructive" });
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherLoading(true);
    const result = await createTeacherAction(newTeacher);
    if (result.success) {
      toast({ title: "Teacher Created", description: "Faculty login is now active." });
      setNewTeacher({ firstName: '', lastName: '', email: '', password: '' });
      loadData();
    } else {
      toast({ title: "Onboarding Failed", description: result.error || "Unknown error", variant: "destructive" });
    }
    setTeacherLoading(false);
  };

  const openEditDialog = (coordinator: any) => {
    setEditCoordinator(coordinator);
    setEditForm({
      firstName: coordinator.firstName,
      lastName: coordinator.lastName,
      email: coordinator.email,
      password: ''
    });
  };

  const handleUpdateCoordinator = async () => {
    if (!editCoordinator) return;
    setEditLoading(true);
    const result = await updateCoordinatorAction(editCoordinator.id, editForm);
    if (result.success) {
      toast({ title: "Updated", description: "Coordinator profile updated successfully." });
      setEditCoordinator(null);
      loadData();
    } else {
      toast({ title: "Update Failed", description: result.error || "Unknown error", variant: "destructive" });
    }
    setEditLoading(false);
  };

  const handleDeleteCoordinator = async (coordinatorId: string, name: string) => {
    const result = await deleteCoordinatorAction(coordinatorId);
    if (result.success) {
      toast({ title: "Coordinator Removed", description: `${name} has been removed from the system.` });
      loadData();
    } else {
      toast({ title: "Error", description: result.error || "Failed to remove coordinator.", variant: "destructive" });
    }
  };

  const handleDeleteClassroom = async (id: string) => {
    const result = await deleteClassroom(id);
    if (result.success) {
      toast({ title: "Deleted", description: "Classroom removed successfully." });
      loadData();
    } else {
      toast({ title: "Error", description: result.error || "Failed to delete classroom.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-surface">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 py-6 md:py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 animate-fade-up">
          <div className="space-y-1">
            <p className="section-label mb-2">Control Panel</p>
            <h1 className="font-headline font-black text-2xl md:text-3xl text-foreground flex items-center gap-3">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-primary rounded-xl flex items-center justify-center shadow-blue shrink-0">
                <ShieldCheck className="h-4 w-4 md:h-5 md:h-5 text-white" />
              </div>
              <span>Administrator <span className="text-primary">Panel</span></span>
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              Welcome, {profile?.firstName}. Manage courses, staff, and classrooms.
            </p>
          </div>
          <div className="flex gap-3">
            <Button className="bg-accent hover:bg-orange-500 text-white shadow-orange" asChild>
              <Link href="/courses/create">
                <Plus className="mr-2 h-4 w-4" /> Create Course
              </Link>
            </Button>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white" asChild>
              <Link href="/admin/classrooms">
                <School className="mr-2 h-4 w-4" /> Classrooms
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="bg-white border border-border p-1 shadow-sm w-full md:w-auto flex overflow-x-auto no-scrollbar">
            <TabsTrigger value="courses" className="flex-1 md:flex-none data-[state=active]:bg-primary data-[state=active]:text-white font-mono text-[10px] md:text-xs tracking-wide">
              <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" /> <span className="whitespace-nowrap">Courses</span>
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex-1 md:flex-none data-[state=active]:bg-primary data-[state=active]:text-white font-mono text-[10px] md:text-xs tracking-wide">
              <Trophy className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" /> <span className="whitespace-nowrap">Quizzes</span>
            </TabsTrigger>
            <TabsTrigger value="faculty" className="flex-1 md:flex-none data-[state=active]:bg-primary data-[state=active]:text-white font-mono text-[10px] md:text-xs tracking-wide">
              <Users className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" /> <span className="whitespace-nowrap">Coordinators</span>
            </TabsTrigger>
            <TabsTrigger value="classrooms" className="flex-1 md:flex-none data-[state=active]:bg-primary data-[state=active]:text-white font-mono text-[10px] md:text-xs tracking-wide">
              <School className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" /> <span className="whitespace-nowrap">Classrooms</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{courses.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Live Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {courses.filter(c => c.isPublished).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-500">
                    {courses.filter(c => !c.isPublished).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">System Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary capitalize">{profile?.role}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Course Inventory</CardTitle>
                <CardDescription>Full curriculum oversight and publishing control.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course Code</TableHead>
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
                            <Badge variant={course.isPublished ? 'default' : 'secondary'}>
                              {course.isPublished ? 'Published' : 'Draft'}
                            </Badge>
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
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete course?</AlertDialogTitle>
                                    <AlertDialogDescription>Permanent removal of "{course.title}" and all related data.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(course.id)} className="bg-destructive">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
                <CardDescription>Monitor institutional quiz performance and leaderboards.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
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
                      {quizzes.map((quiz) => (
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
                      {quizzes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-12 text-muted-foreground font-mono text-xs">
                            No quizzes found in the system.
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
          <TabsContent value="faculty" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Add Coordinator</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTeacher} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input value={newTeacher.firstName} onChange={(e) => setNewTeacher({...newTeacher, firstName: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input value={newTeacher.lastName} onChange={(e) => setNewTeacher({...newTeacher, lastName: e.target.value})} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={newTeacher.email} onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" value={newTeacher.password} onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={teacherLoading}>Register</Button>
                  </form>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Coordinator Registry</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faculty.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.firstName} {user.lastName}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteCoordinator(user.id, user.firstName)}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="classrooms" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Classroom Registry</CardTitle>
                  <CardDescription>Manage all institutional classrooms.</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/admin/classrooms/create"><Plus className="mr-2 h-4 w-4" /> New Classroom</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Classroom</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classrooms.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell className="font-bold">{cls.name}</TableCell>
                        <TableCell>{cls.studentIds?.length || 0} enrolled</TableCell>
                        <TableCell>{cls.courseIds?.length || 0} mapped</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" asChild><Link href={`/admin/classrooms/edit/${cls.id}`}><Pencil className="h-4 w-4" /></Link></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete "{cls.name}"?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently remove this classroom and all student/course assignments.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteClassroom(cls.id)} className="bg-destructive hover:bg-destructive/90">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!editCoordinator} onOpenChange={(open) => { if (!open) setEditCoordinator(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Coordinator</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name</Label><Input value={editForm.firstName} onChange={(e) => setEditForm({...editForm, firstName: e.target.value})} /></div>
              <div className="space-y-2"><Label>Last Name</Label><Input value={editForm.lastName} onChange={(e) => setEditForm({...editForm, lastName: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCoordinator(null)}>Cancel</Button>
            <Button onClick={handleUpdateCoordinator} disabled={editLoading}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdministratorDashboard() {
  return (
    <RouteGuard allowedRole="administrator">
      <AdminContent />
    </RouteGuard>
  );
}
