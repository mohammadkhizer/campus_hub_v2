"use client";

import { useEffect, useState, use } from 'react';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { serverGetAttempt, serverGetQuiz, serverGradeAttempt } from '@/app/actions/quizzes';
import { Quiz, QuizAttempt } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Save, CheckCircle, AlertTriangle, UserPen, Mail, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

function ReviewAttemptContent({ attemptId }: { attemptId: string }) {
  const { profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [gradeScore, setGradeScore] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const attemptData = await serverGetAttempt(attemptId);
      if (attemptData) {
        setAttempt(attemptData);
        setGradeScore(attemptData.score);
        setFeedback(attemptData.feedback || '');
        const quizData = await serverGetQuiz(attemptData.quizId);
        setQuiz(quizData);
      }
      setLoading(false);
    };
    fetchData();
  }, [attemptId]);

  const handleSaveGrade = async () => {
    setSubmitting(true);
    const result = await serverGradeAttempt(attemptId, gradeScore, feedback);
    if (result.success) {
      toast({ title: "Graded Successfully", description: "The student's score has been updated." });
      router.back();
    } else {
      toast({ title: "Error", description: result.error || "Failed to save grade", variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!attempt || !quiz) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Attempt not found</h1>
          <Button onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" /> Go Back</Button>
        </div>
      </div>
    );
  }

  const totalPoints = quiz.questions.reduce((acc, q) => acc + (q.points || 1), 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-widest px-3">Reviewing Attempt</Badge>
                {attempt.status === 'pending_review' && (
                    <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-bold uppercase tracking-widest px-3">Pending Review</Badge>
                )}
            </div>
            <h1 className="text-3xl font-headline font-bold text-slate-900">{quiz.title}</h1>
            <p className="text-slate-500 font-medium">Evaluate the student's performance and provide feedback.</p>
          </div>
          <Button variant="outline" onClick={() => router.back()} className="bg-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Student Info Sidebar */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="overflow-hidden border-none shadow-premium">
                    <div className="h-2 bg-primary" />
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <UserPen className="h-5 w-5 text-primary" />
                            Student Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Full Name</p>
                            <p className="font-bold text-slate-900">{attempt.studentName}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Enrollment ID</p>
                            <Badge variant="secondary" className="font-mono text-xs">{attempt.studentEnrollment || 'N/A'}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="text-xs truncate">{attempt.studentEmail}</span>
                        </div>
                        <div className="pt-4 border-t">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Grading Panel</p>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Total Score</Label>
                                    <div className="flex items-center gap-3">
                                        <Input 
                                            type="number" 
                                            value={gradeScore} 
                                            onChange={(e) => setGradeScore(Number(e.target.value))}
                                            className="font-bold text-lg text-primary h-12"
                                        />
                                        <span className="text-slate-400 font-bold">/ {totalPoints}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold">Feedback / Comments</Label>
                                    <Textarea 
                                        value={feedback} 
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Add private feedback for the student..."
                                        className="min-h-[120px] text-sm"
                                    />
                                </div>
                                <Button 
                                    className="w-full bg-primary hover:bg-primary/90 h-12" 
                                    onClick={handleSaveGrade}
                                    disabled={submitting}
                                >
                                    {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    Finalize Grade
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Questions View */}
            <div className="lg:col-span-2 space-y-6">
                <h3 className="font-headline font-bold text-xl text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                    Response Analysis
                </h3>

                {quiz.questions.map((q, idx) => {
                    const studentAnswer = attempt.answers[q.id] || "No answer provided";
                    const isMCQ = q.type === 'mcq';
                    const isCorrectMCQ = isMCQ && studentAnswer.toLowerCase() === (q.correctAnswer || "").toLowerCase();
                    
                    return (
                        <Card key={q.id} className="border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            {isMCQ && (
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${isCorrectMCQ ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            )}
                            {!isMCQ && (
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                            )}
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <Badge variant="outline" className="text-[9px] uppercase tracking-tighter">Question {idx + 1} • {q.type.replace(/-/g, ' ')}</Badge>
                                        <CardTitle className="text-base font-bold text-slate-800 leading-snug">
                                            {q.questionText}
                                        </CardTitle>
                                    </div>
                                    <Badge className="bg-slate-100 text-slate-600 border-none shrink-0">{q.points || 1} Pts</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className={`p-4 rounded-xl ${
                                    isMCQ 
                                    ? (isCorrectMCQ ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' : 'bg-rose-50 text-rose-900 border border-rose-100')
                                    : 'bg-blue-50 text-blue-900 border border-blue-100'
                                }`}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Student's Response</p>
                                    <p className="font-medium whitespace-pre-wrap">{studentAnswer}</p>
                                </div>

                                {q.correctAnswer && (
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Model / Correct Answer</p>
                                        <p className="text-sm font-medium text-slate-700">{q.correctAnswer}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
      </main>
    </div>
  );
}

export default function ReviewAttemptPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = use(params);
  return (
    <RouteGuard allowedRole={['administrator', 'teacher']}>
      <ReviewAttemptContent attemptId={attemptId} />
    </RouteGuard>
  );
}
