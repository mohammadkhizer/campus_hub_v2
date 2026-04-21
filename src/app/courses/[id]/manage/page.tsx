"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { 
  getCourseDetail, 
  saveNote, 
  saveAssignment, 
  saveAnnouncement 
} from '@/app/actions/courses';
import { serverSaveQuiz } from '@/app/actions/quizzes';
import { Course } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Loader2, 
  Plus, 
  FileText, 
  Trophy, 
  Megaphone, 
  Layout, 
  ArrowLeft,
  Calendar,
  Settings,
  MoreVertical,
  Trash2,
  ShieldCheck,
  BookOpen,
  Users,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

function CourseManagePage() {
  const { profile } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Form States
  const [noteForm, setNoteForm] = useState({ title: '', description: '', fileUrl: '' });
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });
  const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', deadline: '', attachmentUrl: '' });
  const [quizForm, setQuizForm] = useState({ title: '', description: '', timeLimit: '30' });

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const data = await getCourseDetail(id);
    if (!data) {
      toast({ title: "Error", description: "Course not found", variant: "destructive" });
      router.push('/admin');
      return;
    }
    setCourse(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id, router, toast]);

  const handleSaveNote = async () => {
    setSubmitting(true);
    const result = await saveNote({ ...noteForm, courseId: id });
    if (result.success) {
      toast({ title: "Success", description: "Note uploaded successfully" });
      setNoteForm({ title: '', description: '', fileUrl: '' });
      loadData();
    }
    setSubmitting(false);
  };

  const handleSaveAnnouncement = async () => {
    if (!profile) return;
    setSubmitting(true);
    const result = await saveAnnouncement({ 
      ...announcementForm, 
      courseId: id, 
      adminId: profile.id 
    });
    if (result.success) {
      toast({ title: "Success", description: "Announcement posted" });
      setAnnouncementForm({ title: '', content: '' });
      loadData();
    }
    setSubmitting(false);
  };

  const handleSaveAssignment = async () => {
    setSubmitting(true);
    const result = await saveAssignment({ 
      ...assignmentForm, 
      courseId: id, 
      deadline: new Date(assignmentForm.deadline) 
    });
    if (result.success) {
      toast({ title: "Success", description: "Assignment created" });
      setAssignmentForm({ title: '', description: '', deadline: '', attachmentUrl: '' });
      loadData();
    }
    setSubmitting(false);
  };

  const handleGenerateQuiz = async () => {
    if (!profile) return;
    setSubmitting(true);
    // Simple placeholder for quiz generation - in reality this would hit an AI API or show a builder
    const result = await serverSaveQuiz({
      adminId: profile.id,
      courseId: id,
      title: quizForm.title,
      description: quizForm.description,
      timeLimitMinutes: parseInt(quizForm.timeLimit),
      published: true,
      questions: [
        {
          id: 'q1',
          questionText: 'Demo Question 1',
          answerChoices: ['Choice A', 'Choice B', 'Choice C', 'Choice D'],
          correctAnswer: 'Choice A',
          explanation: 'Standard explanation'
        }
      ]
    });
    if (result.success) {
      toast({ title: "Success", description: "Quiz generated (Demo Mode: 1 Question added)" });
      setQuizForm({ title: '', description: '', timeLimit: '30' });
      loadData();
    }
    setSubmitting(false);
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
    <div className="min-h-screen bg-slate-50 pb-20">
        <Navbar />
        
        {/* Header Section */}
        <div className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-8">
            <Link href="/admin" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to {profile?.role === 'administrator' ? 'Admin Panel' : 'Coordinator Dashboard'}
            </Link>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-3xl font-headline font-bold text-slate-900">{course.title}</h1>
                <p className="text-slate-500 mt-1 max-w-2xl">{course.description}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href={`/courses/${id}`}>View as Student</Link>
                </Button>
                <Button className="bg-primary hover:bg-primary/90" asChild>
                  <Link href={`/courses/edit/${id}`}>Edit Course Settings</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 mt-8">
          <div className="grid lg:grid-cols-4 gap-8">
            
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1 space-y-2">
              <Button 
                variant={activeTab === 'overview' ? 'secondary' : 'ghost'} 
                className="w-full justify-start font-medium"
                onClick={() => setActiveTab('overview')}
              >
                <Layout className="mr-2 h-4 w-4" /> Management Overview
              </Button>
              <Button 
                variant={activeTab === 'notes' ? 'secondary' : 'ghost'} 
                className="w-full justify-start font-medium"
                onClick={() => setActiveTab('notes')}
              >
                <FileText className="mr-2 h-4 w-4" /> Study Materials ({course.notes?.length || 0})
              </Button>
              <Button 
                variant={activeTab === 'quizzes' ? 'secondary' : 'ghost'} 
                className="w-full justify-start font-medium"
                onClick={() => setActiveTab('quizzes')}
              >
                <Trophy className="mr-2 h-4 w-4" /> Quizzes ({course.quizzes?.length || 0})
              </Button>
              <Button 
                variant={activeTab === 'assignments' ? 'secondary' : 'ghost'} 
                className="w-full justify-start font-medium"
                onClick={() => setActiveTab('assignments')}
              >
                <Calendar className="mr-2 h-4 w-4" /> Assignments ({course.assignments?.length || 0})
              </Button>
              <Button 
                variant={activeTab === 'announcements' ? 'secondary' : 'ghost'} 
                className="w-full justify-start font-medium"
                onClick={() => setActiveTab('announcements')}
              >
                <Megaphone className="mr-2 h-4 w-4" /> Announcements ({course.announcements?.length || 0})
              </Button>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              
              {/* Quick Actions Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold capitalize text-slate-800">{activeTab}</h2>
                <div className="flex gap-2">
                  
                  {/* Upload Note Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-accent text-white hover:bg-accent/90">
                        <Plus className="mr-2 h-4 w-4" /> Add Material
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Study Material</DialogTitle>
                        <DialogDescription>Add a PDF or file link for your students.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input value={noteForm.title} onChange={(e) => setNoteForm({...noteForm, title: e.target.value})} placeholder="e.g. Chapter 1: Introduction" />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea value={noteForm.description} onChange={(e) => setNoteForm({...noteForm, description: e.target.value})} placeholder="What's this material about?" />
                        </div>
                        <div className="space-y-2">
                          <Label>File URL</Label>
                          <Input value={noteForm.fileUrl} onChange={(e) => setNoteForm({...noteForm, fileUrl: e.target.value})} placeholder="https://drive.google.com/..." />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSaveNote} disabled={submitting}>
                          {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                          Save Material
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Create Assignment Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="border-accent text-accent hover:bg-accent/5">
                        <Calendar className="mr-2 h-4 w-4" /> Create Assignment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Make Assignment</DialogTitle>
                        <DialogDescription>Set a deadline and provide instructions.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input value={assignmentForm.title} onChange={(e) => setAssignmentForm({...assignmentForm, title: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Description / Instructions</Label>
                          <Textarea value={assignmentForm.description} onChange={(e) => setAssignmentForm({...assignmentForm, description: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Deadline Date</Label>
                          <Input type="date" value={assignmentForm.deadline} onChange={(e) => setAssignmentForm({...assignmentForm, deadline: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Reference Link (Optional)</Label>
                          <Input value={assignmentForm.attachmentUrl} onChange={(e) => setAssignmentForm({...assignmentForm, attachmentUrl: e.target.value})} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSaveAssignment} disabled={submitting}>
                          Create
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Generate Quiz Button */}
                  <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/5" asChild>
                    <Link href={`/courses/${id}/quizzes/create`}>
                      <Trophy className="mr-2 h-4 w-4" /> Generate Quiz
                    </Link>
                  </Button>

                  {/* Announcement Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Megaphone className="mr-2 h-4 w-4" /> Announce
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Post Announcement</DialogTitle>
                        <DialogDescription>This will be visible to all enrolled students.</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Subject</Label>
                          <Input value={announcementForm.title} onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <Label>Announcement Message</Label>
                          <Textarea value={announcementForm.content} onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})} className="min-h-[150px]" />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleSaveAnnouncement} disabled={submitting}>Post Now</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                </div>
              </div>

              {/* List Displays */}
              <div className="space-y-4">
                
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Instructional Dashboard Header */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 overflow-hidden relative">
                       <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                          <ShieldCheck className="h-40 w-40 text-primary" />
                       </div>
                       
                       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative">
                          <div className="space-y-1">
                             <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-widest px-3">Official Catalog</Badge>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 border-l">Semester 1</span>
                             </div>
                             <h2 className="text-3xl font-black text-slate-900 tracking-tight">{course.code || 'CODE-PENDING'}</h2>
                             <p className="text-slate-500 font-medium">Global Curriculum ID • Institutional Standard</p>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 w-full md:w-auto">
                             <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Primary Lead</span>
                                <div className="flex items-center gap-2">
                                   <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                                      {course.facultyName?.[0] || 'F'}
                                   </div>
                                   <span className="text-sm font-bold text-slate-800">{course.facultyName || 'No Faculty Assigned'}</span>
                                </div>
                             </div>
                             <div className="space-y-1 border-l pl-6">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Instructional Goal</span>
                                <div className="flex items-center gap-2">
                                   <BookOpen className="h-4 w-4 text-primary" />
                                   <span className="text-sm font-bold text-slate-800">{course.targetLectures || 0} Lectures</span>
                                </div>
                             </div>
                             <div className="space-y-1 border-l pl-6 hidden lg:block">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Evaluations</span>
                                <div className="flex items-center gap-2">
                                   <Trophy className="h-4 w-4 text-accent" />
                                   <span className="text-sm font-bold text-slate-800">{course.targetAssessments || 0} Assessments</span>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Recent Announcements</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {course.announcements?.slice(0, 3).map((ann: any) => (
                              <div key={ann.id} className="border-l-4 border-accent pl-4 py-1">
                                <h4 className="font-semibold">{ann.title}</h4>
                                <p className="text-xs text-muted-foreground">{new Date(ann.createdAt).toLocaleDateString()}</p>
                              </div>
                            ))}
                            {(!course.announcements || course.announcements.length === 0) && <p className="text-sm text-muted-foreground">No announcements yet.</p>}
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">Material Inventory</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <ul className="space-y-3">
                              {course.notes?.slice(0, 5).map((note: any) => (
                                <li key={note.id} className="flex justify-between items-center text-sm border-b pb-2">
                                  <span>{note.title}</span>
                                  <span className="text-xs text-muted-foreground">PDF</span>
                                </li>
                              ))}
                           </ul>
                           {(!course.notes || course.notes.length === 0) && <p className="text-sm text-muted-foreground">No materials uploaded.</p>}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="grid gap-4">
                    {course.notes?.map((note: any) => (
                      <Card key={note.id}>
                        <CardContent className="flex items-center justify-between p-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                              <FileText className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-bold">{note.title}</h3>
                              <p className="text-sm text-muted-foreground">{note.description}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="text-muted-foreground"><Settings className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {(!course.notes || course.notes.length === 0) && <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed">No materials yet. Click "Add Material" to start.</div>}
                  </div>
                )}

                {activeTab === 'quizzes' && (
                  <div className="grid gap-4">
                    {course.quizzes?.map((quiz: any) => (
                      <Card key={quiz.id}>
                        <CardContent className="flex items-center justify-between p-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                              <Trophy className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-bold flex items-center gap-2">
                                {quiz.title}
                                {quiz.password && <ShieldCheck className="h-4 w-4 text-green-600" />}
                              </h3>
                              <p className="text-sm text-muted-foreground">{quiz.questions?.length} Questions • {quiz.timeLimit} Mins</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild><Link href={`/quizzes/${quiz.id}`}>Preview</Link></Button>
                            <Button variant="outline" size="sm" asChild><Link href={`/courses/${course.id}/quizzes/${quiz.id}/edit`}>Edit</Link></Button>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {(!course.quizzes || course.quizzes.length === 0) && <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed">No quizzes created yet.</div>}
                  </div>
                )}

                {activeTab === 'assignments' && (
                  <div className="grid gap-4">
                    {course.assignments?.map((asg: any) => (
                      <Card key={asg.id}>
                        <CardContent className="flex items-center justify-between p-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
                              <Calendar className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-bold">{asg.title}</h3>
                              <p className="text-sm text-muted-foreground">Due: {new Date(asg.deadline).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">View Submissions</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {(!course.assignments || course.assignments.length === 0) && <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed">No assignments yet.</div>}
                  </div>
                )}

                {activeTab === 'announcements' && (
                  <div className="grid gap-4">
                    {course.announcements?.map((ann: any) => (
                      <Card key={ann.id}>
                        <CardHeader>
                           <div className="flex justify-between items-start">
                             <div>
                               <CardTitle>{ann.title}</CardTitle>
                               <CardDescription>{new Date(ann.createdAt).toLocaleString()}</CardDescription>
                             </div>
                             <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                           </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-600 whitespace-pre-wrap">{ann.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                    {(!course.announcements || course.announcements.length === 0) && <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed">No announcements posted yet.</div>}
                  </div>
                )}

              </div>
            </div>
          </div>
        </main>
      </div>
  );
}

export default function CourseManageWrapper() {
  return (
    <RouteGuard allowedRole={['administrator', 'teacher']}>
       <CourseManagePage />
    </RouteGuard>
  );
}
