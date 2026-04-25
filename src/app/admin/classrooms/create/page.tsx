"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { getCourses } from '@/app/actions/courses';
import { getStudentsAction } from '@/app/actions/auth';
import { saveClassroom, getClassroomDetail } from '@/app/actions/classrooms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Save, Search, UserCheck, BookPlus, Check, Lock } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function CreateEditClassroom({ params }: { params?: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const { profile } = useAuth();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    studentIds: [] as string[],
    courseIds: [] as string[]
  });

  const [studentSearch, setStudentSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');

  const isAdmin = profile?.role === 'administrator';
  const isTeacher = profile?.role === 'teacher';

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      const [allStudents, allCourses] = await Promise.all([
        getStudentsAction(),
        getCourses()
      ]);
      setStudents(allStudents?.success && allStudents.data ? allStudents.data : []);
      setCourses(allCourses?.success && allCourses.data ? allCourses.data : []);

      if (id) {
        const detail = await getClassroomDetail(id);
        if (detail) {
          setFormData({
            name: detail.name,
            description: detail.description || '',
            studentIds: detail.studentIds || [],
            courseIds: detail.courseIds || []
          });
        }
      }
      setLoading(false);
    };
    loadAllData();
  }, [id]);

  const toggleStudent = (sId: string) => {
    setFormData(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(sId)
        ? prev.studentIds.filter(idx => idx !== sId)
        : [...prev.studentIds, sId]
    }));
  };

  const toggleCourse = (cId: string) => {
    setFormData(prev => ({
      ...prev,
      courseIds: prev.courseIds.includes(cId)
        ? prev.courseIds.filter(idx => idx !== cId)
        : [...prev.courseIds, cId]
    }));
  };

  const handleSave = async () => {
    if (!formData.name && isAdmin) {
      toast({ title: "Validation Error", description: "Classroom name is required", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const result = await saveClassroom({ id, ...formData });
    if (result.success) {
      toast({ title: "Success", description: "Classroom configuration saved" });
      router.push('/admin/classrooms');
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const filteredStudents = students.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredCourses = courses.filter(c =>
    c.title.toLowerCase().includes(courseSearch.toLowerCase()) ||
    (c.code || '').toLowerCase().includes(courseSearch.toLowerCase())
  );

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <RouteGuard allowedRole={['administrator', 'teacher']}>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
             <Link href="/admin" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
               <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
             </Link>
             <h1 className="text-3xl font-headline font-bold">{id ? 'Edit Classroom' : 'Create New Classroom'}</h1>
             <p className="text-muted-foreground italic">
               {isAdmin 
                 ? 'Assemble a learning cohort and map their curriculum.'
                 : 'Manage students and course assignments for this classroom.'
               }
             </p>
             {isTeacher && !id && (
               <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 rounded-lg p-3 text-sm border border-amber-200">
                 <Lock className="h-4 w-4" />
                 Only administrators can create new classrooms. You can edit existing classrooms assigned to you.
               </div>
             )}
          </div>

          <div className="grid lg:grid-cols-3 gap-10">

            {/* General Info */}
            <div className="lg:col-span-1 space-y-6">
               <Card className="shadow-sm border-primary/5 sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-lg">Classroom Identity</CardTitle>
                    <CardDescription>Primary details for identification.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label>Classroom Name (e.g. CS-2026-A)</Label>
                        <Input
                          placeholder="Enter name..."
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          disabled={isTeacher}
                        />
                        {isTeacher && <p className="text-xs text-muted-foreground">Only administrators can change the name.</p>}
                     </div>
                     <div className="space-y-2">
                        <Label>Program Description</Label>
                        <Textarea
                          placeholder="Brief summary of this classroom group..."
                          rows={4}
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          disabled={isTeacher}
                        />
                     </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                     <Button className="w-full h-12 text-lg" onClick={handleSave} disabled={submitting || (isTeacher && !id)}>
                        {submitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-5 w-5" />}
                        {id ? 'Update Configuration' : 'Establish Classroom'}
                     </Button>
                  </CardFooter>
               </Card>

               {/* Quick Stats */}
               <Card className="shadow-sm border-primary/5">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 rounded-lg bg-primary/5">
                        <p className="text-2xl font-bold text-primary">{formData.studentIds.length}</p>
                        <p className="text-xs text-muted-foreground">Students</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-accent/5">
                        <p className="text-2xl font-bold text-accent">{formData.courseIds.length}</p>
                        <p className="text-xs text-muted-foreground">Courses</p>
                      </div>
                    </div>
                  </CardContent>
               </Card>
            </div>

            {/* Assignments */}
            <div className="lg:col-span-2 space-y-8">

               {/* Students Assignment — Teacher + Admin */}
               <Card className="shadow-sm border-primary/5">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-primary" /> Student Enrollment
                      </CardTitle>
                      <CardDescription>
                        {isTeacher 
                          ? `Add or remove students from this classroom (${formData.studentIds.length} selected)`
                          : `Select students to assign to this classroom (${formData.studentIds.length} selected)`
                        }
                      </CardDescription>
                    </div>
                    <div className="relative w-1/2">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input
                         placeholder="Filter students..."
                         className="pl-10 h-9 text-xs"
                         value={studentSearch}
                         onChange={(e) => setStudentSearch(e.target.value)}
                       />
                    </div>
                  </CardHeader>
                  <CardContent>
                     <div className="max-h-[300px] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 pr-2 scrollbar-thin">
                        {filteredStudents.map((student) => (
                           <div
                             key={student.id}
                             onClick={() => toggleStudent(student.id)}
                             className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                               formData.studentIds.includes(student.id)
                               ? 'border-primary bg-primary/5 shadow-sm'
                               : 'border-slate-100 hover:border-slate-200 bg-white'
                             }`}
                           >
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition-colors ${
                                formData.studentIds.includes(student.id) ? 'bg-primary border-primary' : 'border-slate-200'
                              }`}>
                                {formData.studentIds.includes(student.id) && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-sm font-bold truncate">{student.firstName} {student.lastName}</p>
                                 <p className="text-[10px] text-muted-foreground truncate">{student.email}</p>
                              </div>
                           </div>
                        ))}
                        {filteredStudents.length === 0 && (
                          <p className="text-sm text-muted-foreground col-span-2 text-center py-8">No students found.</p>
                        )}
                     </div>
                  </CardContent>
               </Card>

               {/* Courses Assignment — Both Admin & Teacher */}
               <Card className="shadow-sm border-primary/5">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <BookPlus className="h-5 w-5 text-accent" /> Academic Scope
                      </CardTitle>
                      <CardDescription>
                        Assign courses accessible to this classroom ({formData.courseIds.length} mapped)
                        {isTeacher && <span className="ml-1 text-xs text-amber-600">— Both admin & teacher can assign courses</span>}
                      </CardDescription>
                    </div>
                    <div className="relative w-1/2">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input
                         placeholder="Filter courses..."
                         className="pl-10 h-9 text-xs"
                         value={courseSearch}
                         onChange={(e) => setCourseSearch(e.target.value)}
                       />
                    </div>
                  </CardHeader>
                  <CardContent>
                     <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                        {filteredCourses.map((course) => (
                          <div
                            key={course.id}
                            onClick={() => toggleCourse(course.id)}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              formData.courseIds.includes(course.id)
                              ? 'border-accent bg-accent/5 ring-1 ring-accent/10'
                              : 'border-slate-100 hover:border-slate-200 bg-white'
                            }`}
                          >
                             <div className="flex items-center gap-4">
                               <div className={`p-2 rounded-lg transition-colors ${formData.courseIds.includes(course.id) ? 'bg-accent text-white' : 'bg-slate-100 text-slate-400'}`}>
                                 <BookPlus className="h-4 w-4" />
                               </div>
                               <div>
                                  <p className="text-sm font-bold text-slate-900">{course.title}</p>
                                  <p className="text-[10px] text-muted-foreground">{course.code ? `Code: ${course.code}` : `ID: ${course.id}`}</p>
                               </div>
                             </div>
                             {formData.courseIds.includes(course.id) && (
                                <Badge className="bg-accent text-white">Mapped</Badge>
                             )}
                          </div>
                        ))}
                        {filteredCourses.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-8">No courses found.</p>
                        )}
                     </div>
                  </CardContent>
               </Card>

            </div>
          </div>
        </main>
      </div>
    </RouteGuard>
  );
}
