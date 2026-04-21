"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { getCourses, updateCourseStatus, deleteCourse } from '@/app/actions/courses';
import { createTeacherAction, getUsersByRoleAction, updateCoordinatorAction, deleteCoordinatorAction } from '@/app/actions/auth';
import { getClassrooms } from '@/app/actions/classrooms';
import { Course } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Loader2, Plus, Trash2, Eye, ShieldCheck, Power, BookOpen, Pencil, Layout, Users, UserPlus, Mail, PersonStanding, School, X } from 'lucide-react';
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

function AdminContent() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherLoading, setTeacherLoading] = useState(false);

  // Form State for new teacher
  const [newTeacher, setNewTeacher] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  // Edit coordinator state
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
      const [coursesData, facultyData, classroomData] = await Promise.all([
        getCourses(),
        getUsersByRoleAction(['teacher']),
        getClassrooms()
      ]);
      setCourses(coursesData);
      setFaculty(facultyData);
      setClassrooms(classroomData);
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

  return (
    <div className="min-h-screen bg-neutral-surface">
      <Navbar />
      <main className="container mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 animate-fade-up">
          <div className="space-y-1">
            <p className="section-label mb-2">Control Panel</p>
            <h1 className="font-headline font-black text-3xl text-foreground flex items-center gap-3">
              {['administrator', 'superadmin'].includes(profile?.role || '') ? (
                <>
                  <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-blue">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <span>Administrator <span className="text-primary">Panel</span></span>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 bg-success rounded-xl flex items-center justify-center shadow-green">
                    <Layout className="h-5 w-5 text-white" />
                  </div>
                  <span>Subject Coordinator <span className="text-success">Dashboard</span></span>
                </>
              )}
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              Welcome, {profile?.firstName}. {['administrator', 'superadmin'].includes(profile?.role || '') ? 'Manage courses, staff, and classrooms.' : 'Coordinating modules and instructional materials.'}
            </p>
          </div>
          {['administrator', 'superadmin'].includes(profile?.role || '') && (
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
          )}
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="bg-white border border-border p-1 shadow-sm">
            <TabsTrigger value="courses" className="data-[state=active]:bg-primary data-[state=active]:text-white font-mono text-xs tracking-wide">
              <BookOpen className="h-4 w-4 mr-2" /> Courses
            </TabsTrigger>
            {['administrator', 'superadmin'].includes(profile?.role || '') && (
              <TabsTrigger value="faculty" className="data-[state=active]:bg-primary data-[state=active]:text-white font-mono text-xs tracking-wide">
                <Users className="h-4 w-4 mr-2" /> Subject Coordinators
              </TabsTrigger>
            )}
            <TabsTrigger value="classrooms" className="data-[state=active]:bg-primary data-[state=active]:text-white font-mono text-xs tracking-wide">
              <School className="h-4 w-4 mr-2" /> Classrooms
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
                  <CardTitle className="text-sm font-medium">Platform Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary capitalize">{profile?.role}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Course Inventory</CardTitle>
                <CardDescription>Manage your curriculum and publishing status.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-mono text-xs font-bold text-accent">
                          {course.code || '---'}
                        </TableCell>
                        <TableCell className="font-medium flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          {course.title}
                        </TableCell>
                        <TableCell>{new Date(course.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={course.isPublished ? 'default' : 'secondary'}>
                            {course.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => toggleStatus(course)} title={course.isPublished ? 'Unpublish' : 'Publish'}>
                              <Power className={`h-4 w-4 ${course.isPublished ? 'text-green-600' : 'text-muted-foreground'}`} />
                            </Button>
                            <Button variant="ghost" size="icon" asChild title="Edit Course">
                              <Link href={`/courses/edit/${course.id}`}><Pencil className="h-4 w-4" /></Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild title="Manage Course">
                              <Link href={`/courses/${course.id}/manage`}><Layout className="h-4 w-4" /></Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild title="View as Student">
                              <Link href={`/courses/${course.id}`}><Eye className="h-4 w-4" /></Link>
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the course "{course.title}" and all associated items.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(course.id)} className="bg-destructive hover:bg-destructive/90">
                                    Delete Course
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                      </TableCell>
                      </TableRow>
                    ))}
                    {courses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No courses found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faculty" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-accent" /> Add Subject Coordinator
                  </CardTitle>
                  <CardDescription>Onboard a new Subject Coordinator to the system.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTeacher} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="t-fname">First Name</Label>
                        <Input id="t-fname" value={newTeacher.firstName} onChange={(e) => setNewTeacher({...newTeacher, firstName: e.target.value})} placeholder="Jane" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="t-lname">Last Name</Label>
                        <Input id="t-lname" value={newTeacher.lastName} onChange={(e) => setNewTeacher({...newTeacher, lastName: e.target.value})} placeholder="Smith" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="t-email">Work Email</Label>
                      <Input id="t-email" type="email" value={newTeacher.email} onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})} placeholder="jane@university.edu" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="t-pass">Initial Password</Label>
                      <Input id="t-pass" type="password" value={newTeacher.password} onChange={(e) => setNewTeacher({...newTeacher, password: e.target.value})} placeholder="••••••••" required />
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white shadow-blue" disabled={teacherLoading}>
                      {teacherLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Register Coordinator'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Active Coordinator Inventory</CardTitle>
                  <CardDescription>Members currently authorized to manage courses. Full CRUD operations available.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center p-8">
                       <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No.</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faculty.map((user, index) => (
                        <TableRow key={user.id}>
                          <TableCell className="text-muted-foreground text-xs">{index + 1}</TableCell>
                          <TableCell className="font-medium flex items-center gap-2">
                            <PersonStanding className="h-4 w-4 text-accent" />
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" /> {user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-accent text-accent bg-accent/5">
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" title="Edit Coordinator" onClick={() => openEditDialog(user)}>
                                <Pencil className="h-4 w-4 text-primary" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Remove Coordinator">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove {user.firstName} {user.lastName}?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete this coordinator account and unassign them from all courses. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteCoordinator(user.id, `${user.firstName} ${user.lastName}`)} className="bg-destructive hover:bg-destructive/90">
                                      Remove Coordinator
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {faculty.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                            No faculty members registered.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Classrooms Tab */}
          <TabsContent value="classrooms" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Classrooms</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{classrooms.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Students Assigned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {classrooms.reduce((acc: number, cls: any) => acc + (cls.studentIds?.length || 0), 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Courses Mapped</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-accent">
                    {classrooms.reduce((acc: number, cls: any) => acc + (cls.courseIds?.length || 0), 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Your Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-primary capitalize">{profile?.role}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {profile?.role === 'administrator' ? 'Full access' : 'Student & course mgmt'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Classroom Registry</CardTitle>
                  <CardDescription>
                    {profile?.role === 'administrator' 
                      ? 'Manage all classrooms, students, and course assignments.'
                      : 'Manage students and courses for classrooms assigned to you.'
                    }
                  </CardDescription>
                </div>
                {['administrator', 'superadmin'].includes(profile?.role || '') && (
                  <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link href="/admin/classrooms/create">
                      <Plus className="mr-2 h-4 w-4" /> New Classroom
                    </Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Classroom</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Courses</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classrooms.map((cls) => (
                      <TableRow key={cls.id}>
                        <TableCell>
                          <div>
                            <p className="font-bold text-slate-900">{cls.name}</p>
                            {cls.description && <p className="text-xs text-muted-foreground line-clamp-1">{cls.description}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="font-semibold">{cls.studentIds?.length || 0}</span>
                            <span className="text-xs text-muted-foreground">enrolled</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-accent" />
                            <span className="font-semibold">{cls.courseIds?.length || 0}</span>
                            <span className="text-xs text-muted-foreground">mapped</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{cls.createdByName || '—'}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild title="Edit Classroom">
                              <Link href={`/admin/classrooms/edit/${cls.id}`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            {['administrator', 'superadmin'].includes(profile?.role || '') && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" title="Delete Classroom">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete "{cls.name}"?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently remove this classroom and detach all students and course assignments.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => {
                                      (async () => {
                                        const { deleteClassroom } = await import('@/app/actions/classrooms');
                                        const result = await deleteClassroom(cls.id);
                                        if (result.success) {
                                          toast({ title: "Deleted", description: "Classroom removed." });
                                          loadData();
                                        } else {
                                          toast({ title: "Error", description: result.error, variant: "destructive" });
                                        }
                                      })();
                                    }} className="bg-destructive hover:bg-destructive/90">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {classrooms.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          {['administrator', 'superadmin'].includes(profile?.role || '')
                            ? 'No classrooms created yet. Create your first classroom above.'
                            : 'No classrooms are associated with your courses.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Coordinator Dialog */}
      <Dialog open={!!editCoordinator} onOpenChange={(open) => { if (!open) setEditCoordinator(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-accent" /> Edit Coordinator
            </DialogTitle>
            <DialogDescription>
              Update the coordinator's profile. Leave password blank to keep existing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={editForm.firstName} onChange={(e) => setEditForm({...editForm, firstName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={editForm.lastName} onChange={(e) => setEditForm({...editForm, lastName: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>New Password (optional)</Label>
              <Input type="password" value={editForm.password} onChange={(e) => setEditForm({...editForm, password: e.target.value})} placeholder="Leave blank to keep current" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCoordinator(null)}>Cancel</Button>
            <Button onClick={handleUpdateCoordinator} disabled={editLoading}>
              {editLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <RouteGuard allowedRole={['administrator', 'teacher', 'superadmin']}>
      <AdminContent />
    </RouteGuard>
  );
}
