"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, UploadCloud, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { uploadFileToCloudinary } from '@/app/actions/upload';
import { submitAssignment, getSubmissions, getCourseDetail } from '@/app/actions/courses';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function AssignmentDetailPage() {
  const { profile } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const assignmentId = params.assignmentId as string;
  const { toast } = useToast();

  const [assignment, setAssignment] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Submission state
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mySubmission, setMySubmission] = useState<any>(null);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const courseData = await getCourseDetail(courseId);
      if (!courseData) {
        toast({ title: "Error", description: "Course not found", variant: "destructive" });
        router.push('/courses');
        return;
      }
      setCourse(courseData);

      const assign = courseData.assignments?.find((a: any) => a.id === assignmentId);
      if (!assign) {
        toast({ title: "Error", description: "Assignment not found", variant: "destructive" });
        router.push(`/courses/${courseId}`);
        return;
      }
      setAssignment(assign);

      const subs = await getSubmissions(assignmentId);
      setAllSubmissions(subs);

      if (profile) {
        const mine = subs.find((s: any) => s.student === profile.id);
        if (mine) setMySubmission(mine);
      }

      setLoading(false);
    };
    loadData();
  }, [courseId, assignmentId, profile, router, toast]);

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

  const handleSubmit = async () => {
    if (!submissionFile) {
      toast({ title: "Error", description: "Please select a file to submit", variant: "destructive" });
      return;
    }
    if (!profile) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', submissionFile);
      const uploadRes = await uploadFileToCloudinary(formData);
      
      if (!uploadRes.success || !uploadRes.url) {
        throw new Error(uploadRes.error || "Failed to upload submission");
      }

      const result = await submitAssignment({
        assignmentId,
        studentId: profile.id,
        studentName: `${profile.firstName} ${profile.lastName}`,
        fileUrl: uploadRes.url
      });

      if (result.success) {
        toast({ title: "Success", description: "Assignment submitted successfully!" });
        // Reload to show submission
        const subs = await getSubmissions(assignmentId);
        setAllSubmissions(subs);
        const mine = subs.find((s: any) => s.student === profile.id);
        if (mine) setMySubmission(mine);
      } else {
        throw new Error("Failed to save submission");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
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

  const isTeacher = profile?.role === 'teacher' || profile?.role === 'administrator' || profile?.role === 'superadmin';
  const isDeadlinePassed = assignment && new Date() > new Date(assignment.deadline);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <main className="container mx-auto px-4 mt-8 max-w-4xl space-y-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/courses/${courseId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
          </Link>
        </Button>

        <Card>
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-headline text-primary mb-2">
                  {assignment.title}
                </CardTitle>
                <CardDescription className={`flex items-center gap-2 text-base ${isDeadlinePassed ? 'text-destructive font-bold' : ''}`}>
                  <Clock className="h-4 w-4" /> 
                  Due: <span className="font-semibold">{new Date(assignment.deadline).toLocaleString()}</span>
                  {isDeadlinePassed && <Badge variant="destructive" className="ml-2">Deadline Passed</Badge>}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="prose max-w-none text-muted-foreground">
              {assignment.description}
            </div>

            {assignment.attachmentUrl && (
              <div className="pt-4">
                <h4 className="text-sm font-semibold mb-2">Reference Material</h4>
                <Button variant="outline" asChild>
                  <a href={getDownloadUrl(assignment.attachmentUrl)} target="_blank" rel="noopener noreferrer" download>
                    <FileText className="mr-2 h-4 w-4" /> Download Attached File
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student View: Submit Work */}
        {!isTeacher && (
          <Card className={isDeadlinePassed && !mySubmission ? 'border-destructive/20' : ''}>
            <CardHeader>
              <CardTitle>Your Submission</CardTitle>
            </CardHeader>
            <CardContent>
              {mySubmission ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <div>
                    <h3 className="font-bold text-green-900 text-lg">Assignment Submitted!</h3>
                    <p className="text-sm text-green-700">Submitted on: {new Date(mySubmission.createdAt).toLocaleString()}</p>
                  </div>
                  <Button variant="outline" className="mt-2" asChild>
                    <a href={getDownloadUrl(mySubmission.fileUrl)} target="_blank" rel="noopener noreferrer">
                      View My Submission
                    </a>
                  </Button>
                  {mySubmission.grade && (
                    <div className="mt-4 p-4 bg-white rounded-lg border text-left">
                      <p><strong>Grade:</strong> {mySubmission.grade}</p>
                      <p><strong>Feedback:</strong> {mySubmission.feedback}</p>
                    </div>
                  )}
                </div>
              ) : isDeadlinePassed ? (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 text-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                  <div>
                    <h3 className="font-bold text-destructive text-lg">Deadline Passed</h3>
                    <p className="text-sm text-muted-foreground">The deadline for this assignment was {new Date(assignment.deadline).toLocaleString()}. Submissions are no longer accepted.</p>
                  </div>
                  <Button variant="outline" disabled className="mt-2">
                    Submission Closed
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Upload your work (PDF, DOC, JPG)</Label>
                    <Input 
                      type="file" 
                      accept=".pdf,.doc,.docx,.jpg,.png" 
                      onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)} 
                    />
                  </div>
                  <Button className="w-full" onClick={handleSubmit} disabled={submitting || !submissionFile}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    Submit Assignment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Teacher View: All Submissions */}
        {isTeacher && (
          <Card>
            <CardHeader>
              <CardTitle>Student Submissions ({allSubmissions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {allSubmissions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No submissions yet.</p>
              ) : (
                <div className="space-y-4">
                  {allSubmissions.map((sub: any) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{sub.studentName}</p>
                        <p className="text-xs text-muted-foreground">Submitted: {new Date(sub.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        {sub.grade && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold self-center mr-2">Graded: {sub.grade}</span>}
                        <Button variant="outline" size="sm" asChild>
                          <a href={getDownloadUrl(sub.fileUrl)} target="_blank" rel="noopener noreferrer">
                            View File
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  );
}
