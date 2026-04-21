"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { createCourse } from '@/app/actions/courses';
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

function CreateCourseContent() {
  const { profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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
    const loadFaculty = async () => {
      const users = await getUsersByRoleAction(['teacher', 'subject_coordinator']);
      setFaculty(users);
    };
    loadFaculty();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    const result = await createCourse(formData);
    
    if (result.success) {
      toast({
        title: "Course Created",
        description: "Your academic course has been established.",
      });
      router.push(`/admin`);
    } else {
      toast({
        title: "Entry Validation Error",
        description: result.error || "Failed to create course. Please verify the code and required fields.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/admin" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Administrator Panel
        </Link>
        
        <div className="grid gap-8">
          <div>
            <h1 className="text-3xl font-headline font-bold">Establish New Module</h1>
            <p className="text-muted-foreground">Define the academic parameters and assign instruction responsibility.</p>
          </div>

          <Card className="border-primary/5 shadow-sm">
             <CardHeader className="bg-slate-50/50 border-b">
               <CardTitle className="text-xl font-headline flex items-center gap-2">
                 <Layout className="h-5 w-5 text-primary" /> Course Summary & Academic Parameters
               </CardTitle>
               <CardDescription>Specify the fundamental metadata and curriculum goals for this module.</CardDescription>
             </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Course Title</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g., Advanced Fluid Mechanics" 
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Course Code</Label>
                    <Input 
                      id="code" 
                      placeholder="e.g., MECH-402" 
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
                    placeholder="Provide a comprehensive summary of the learning objectives..." 
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
                        placeholder="https://..." 
                        value={formData.thumbnail}
                        onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                      />
                   </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pb-6">
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

                <Separator className="my-8" />

                <div className="flex justify-end">
                  <Button type="submit" className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-bold" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-5 w-5" /> Establish Course
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

// Helper to keep the file clean
const Separator = ({ className }: { className?: string }) => <div className={`h-px bg-slate-100 ${className}`} />;

export default function CreateCoursePage() {
  return (
    <RouteGuard allowedRole="administrator">
      <CreateCourseContent />
    </RouteGuard>
  );
}
