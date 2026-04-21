"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { getCourseDetail, updateCourse } from '@/app/actions/courses';
import { getUsersByRoleAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, Save, Book, Users, Image as ImageIcon, Layout } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

function EditCourseContent() {
  const { profile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [faculty, setFaculty] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    thumbnail: '',
    faculty: '',
    targetLectures: 0,
    targetAssessments: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      const [course, allFaculty] = await Promise.all([
        getCourseDetail(id),
        getUsersByRoleAction(['teacher', 'subject_coordinator'])
      ]);
      
      setFaculty(allFaculty);

      if (course) {
        setFormData({
          title: course.title,
          code: course.code || '',
          description: course.description,
          thumbnail: course.thumbnail || '',
          faculty: course.faculty || '',
          targetLectures: course.targetLectures || 0,
          targetAssessments: course.targetAssessments || 0,
        });
      } else {
        toast({
          title: "Error",
          description: "Course not found.",
          variant: "destructive",
        });
        router.push('/admin');
      }
      setLoading(false);
    };
    loadData();
  }, [id, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const result = await updateCourse(id, formData);
    
    if (result.success) {
      toast({
        title: "Course Updated",
        description: "Your changes have been saved successfully.",
      });
      router.push('/admin');
    } else {
      toast({
        title: "Update Failed",
        description: result.error || "Failed to update course.",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/admin" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Administrator Panel
        </Link>
        
        <div className="grid gap-8">
           <div>
              <h1 className="text-3xl font-headline font-bold">Refine Academic Module</h1>
              <p className="text-muted-foreground">Adjust the module parameters and instructional oversight.</p>
           </div>

           <Card className="border-primary/5 shadow-sm">
             <CardHeader className="bg-white border-b">
               <CardTitle className="flex items-center gap-2">
                 <Layout className="h-5 w-5 text-primary" /> Course Summary & Academic Parameters
               </CardTitle>
               <CardDescription>Adjust the fundamental curriculum data and instructional targets for this module.</CardDescription>
             </CardHeader>
             <CardContent className="p-6">
               <form onSubmit={handleSubmit} className="space-y-8">
                 <div className="grid md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <Label htmlFor="title">Course Title</Label>
                     <Input 
                       id="title" 
                       value={formData.title}
                       onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                       required
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="code">Course Code</Label>
                     <Input 
                       id="code" 
                       value={formData.code}
                       onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                       required
                     />
                   </div>
                 </div>
                 
                 <div className="space-y-2">
                   <Label htmlFor="description">Module Description</Label>
                   <Textarea 
                     id="description" 
                     className="min-h-[140px]"
                     value={formData.description}
                     onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                     required
                   />
                 </div>

                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="flex items-center gap-2">
                         <Users className="h-4 w-4" /> Assigned Faculty (Teacher)
                       </Label>
                       <Select 
                          value={formData.faculty} 
                          onValueChange={(val) => setFormData({ ...formData, faculty: val })}
                       >
                          <SelectTrigger>
                             <SelectValue placeholder="Select faculty member..." />
                          </SelectTrigger>
                          <SelectContent>
                             {faculty.map((f) => (
                                <SelectItem key={f.id} value={f.id}>
                                   {f.firstName} {f.lastName} ({f.role})
                                </SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label className="flex items-center gap-2">
                         <ImageIcon className="h-4 w-4" /> Thumbnail URL
                       </Label>
                       <Input 
                         id="thumbnail" 
                         value={formData.thumbnail}
                         onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                       />
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label>Total Lectures Planned</Label>
                       <Input 
                          type="number" 
                          value={formData.targetLectures} 
                          onChange={(e) => setFormData({ ...formData, targetLectures: parseInt(e.target.value) || 0 })}
                       />
                    </div>
                    <div className="space-y-2">
                       <Label>Total Assessments Planned</Label>
                       <Input 
                          type="number" 
                          value={formData.targetAssessments}
                          onChange={(e) => setFormData({ ...formData, targetAssessments: parseInt(e.target.value) || 0 })}
                       />
                    </div>
                 </div>

                 <div className="h-px bg-slate-100 my-8" />

                 <div className="flex justify-end">
                   <Button type="submit" className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-bold" disabled={saving}>
                     {saving ? (
                       <>
                         <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Committing Changes...
                       </>
                     ) : (
                       <>
                         <Save className="mr-2 h-5 w-5" /> Persist Changes
                       </>
                     )}
                   </Button>
                 </div>
               </form>
             </CardContent>
           </Card>
        </div>
      </main>
    </div>
  );
}

export default function EditCoursePage() {
  return (
    <RouteGuard allowedRole="administrator">
      <EditCourseContent />
    </RouteGuard>
  );
}
