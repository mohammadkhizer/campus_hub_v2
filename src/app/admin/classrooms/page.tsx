"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { getClassrooms, deleteClassroom } from '@/app/actions/classrooms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Loader2, Plus, Trash2, Users, BookOpen, Pencil, ArrowLeft, School } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function AdminClassroomList() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { profile } = useAuth();

  const loadClassrooms = async () => {
    setLoading(true);
    const data = await getClassrooms();
    setClassrooms(data);
    setLoading(false);
  };

  useEffect(() => {
    loadClassrooms();
  }, []);

  const handleDelete = async (id: string) => {
    const result = await deleteClassroom(id);
    if (result.success) {
      toast({ title: "Deleted", description: "Classroom removed successfully" });
      loadClassrooms();
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  return (
    <RouteGuard allowedRole={['administrator', 'teacher']}>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
             <div>
                <Link href="/admin" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
                <h1 className="text-3xl font-headline font-bold flex items-center gap-3">
                  <School className="h-8 w-8 text-primary" />
                  Classroom Management
                </h1>
                <p className="text-muted-foreground">
                  {profile?.role === 'administrator' 
                    ? 'Organize your university environment by grouping students and courses.'
                    : 'Manage students and courses in classrooms assigned to you.'
                  }
                </p>
             </div>
             {profile?.role === 'administrator' && (
               <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/admin/classrooms/create">
                    <Plus className="mr-2 h-4 w-4" /> Create New Classroom
                  </Link>
               </Button>
             )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
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
          </div>

          <Card className="shadow-sm border-primary/5">
             <CardHeader className="bg-white border-b">
                <CardTitle>All Classrooms</CardTitle>
                <CardDescription>View and manage campus classrooms and their course assignments.</CardDescription>
             </CardHeader>
             <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center p-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                ) : (
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Classroom Name</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Assigned Courses</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classrooms.map((cls) => (
                        <TableRow key={cls.id} className="hover:bg-slate-50/50">
                          <TableCell>
                            <div>
                              <p className="font-bold text-slate-900">{cls.name}</p>
                              {cls.description && <p className="text-xs text-muted-foreground line-clamp-1">{cls.description}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-2">
                               <Users className="h-4 w-4 text-muted-foreground" />
                               <span className="font-semibold">{cls.studentIds?.length || 0}</span>
                               <span className="text-xs text-muted-foreground">enrolled</span>
                             </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex items-center gap-2">
                               <BookOpen className="h-4 w-4 text-muted-foreground" />
                               <span className="font-semibold">{cls.courseIds?.length || 0}</span>
                               <span className="text-xs text-muted-foreground">courses</span>
                             </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{cls.createdByName || '—'}</span>
                          </TableCell>
                          <TableCell className="text-right">
                             <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" asChild title="Edit Classroom">
                                   <Link href={`/admin/classrooms/edit/${cls.id}`}>
                                      <Pencil className="h-4 w-4" />
                                   </Link>
                                </Button>
                                {profile?.role === 'administrator' && (
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
                                        <AlertDialogAction onClick={() => handleDelete(cls.id)} className="bg-destructive hover:bg-destructive/90">
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
                          <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                             No classrooms created yet. Get started by creating your first one.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
             </CardContent>
          </Card>
        </main>
      </div>
    </RouteGuard>
  );
}
