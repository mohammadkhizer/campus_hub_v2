
"use client";

import { useEffect, useState, use } from 'react';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { getQuiz, saveAttempt, getAttempts } from '@/lib/store';
import { checkEnrollment } from '@/app/actions/courses';
import { Quiz, QuizAttempt } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Trophy, Home, Lock, Eye, EyeOff, AlertTriangle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

function TakeQuizContent({ id }: { id: string }) {
  const { profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const isPreview = profile?.role === 'teacher' || profile?.role === 'administrator';
  const [showAnswers, setShowAnswers] = useState(false);

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Password state
  const [isLocked, setIsLocked] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  // Anti-Cheat state
  const [isCheated, setIsCheated] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      const [data, studentAttempts] = await Promise.all([
        getQuiz(id),
        profile?.role === 'student' ? getAttempts(profile.id) : Promise.resolve([])
      ]);

      if (data) {

        // One Attempt per Student Rule
        if (profile?.role === 'student' && studentAttempts.some((a: any) => a.quiz === id)) {
          toast({ 
            title: "Access Denied", 
            description: "You have already completed this quiz. Multiple attempts are not allowed.", 
            variant: "destructive" 
          });
          router.push(`/quizzes`);
          return;
        }

        // Enrollment Check for Students
        if (profile?.role === 'student' && data.course) {
          const isEnrolled = await checkEnrollment(data.course, profile.id);
          if (!isEnrolled) {
            router.push('/dashboard');
            return;
          }
        }

        // Shuffle questions for each user
        const shuffledQuestions = [...data.questions].sort(() => Math.random() - 0.5);
        setQuiz({ ...data, questions: shuffledQuestions });
        if (data.password) {
          setIsLocked(true);
        }
      } else {
        router.push('/dashboard');
      }
      setLoading(false);
    };
    if (profile) {
      fetchQuiz();
    }
  }, [id, profile, router]);

  // Activity Monitor (Anti-Cheat)
  useEffect(() => {
    if (!quiz || isLocked || isSubmitted || isCheated || isPreview || quiz.activityMonitoring === false) return;

    const handleSecurityBreach = () => {
      if (!isCheated && !isSubmitted) {
        setIsCheated(true);
        // Automatically save disqualified attempt
        const disqualifiedAttempt: QuizAttempt = {
          id: Date.now().toString(),
          quizId: id,
          studentId: profile?.id || 'unknown',
          studentName: profile ? `${profile.firstName} ${profile.lastName}` : 'Unknown Student',
          studentEmail: profile?.email || 'N/A',
          score: 0,
          totalQuestions: quiz.questions.length,
          completedAt: new Date().toISOString(),
          status: 'disqualified',
          answers: answers,
        };
        saveAttempt(profile?.id || 'unknown', disqualifiedAttempt);
      }
    };

    // Tab Switch / Minimize Detection
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleSecurityBreach();
      }
    };

    const handleBlur = () => {
      handleSecurityBreach();
    };

    // Clipboard & Right-click Prevention
    const preventCopyPaste = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Attach listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('contextmenu', preventContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [quiz, isLocked, isSubmitted, isCheated, profile, answers, id]);

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;
  if (!quiz) return <div className="flex justify-center items-center h-screen">Quiz not found or not published.</div>;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPassword === quiz.password) {
      setIsLocked(false);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 flex justify-center items-center" style={{ height: 'calc(100vh - 100px)' }}>
          <Card className="w-full max-w-md shadow-lg border-2">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto bg-muted w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl font-headline">Protected Quiz</CardTitle>
              <CardDescription>
                This quiz requires a password to access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUnlock} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Quiz Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoFocus
                      placeholder="Enter password"
                      value={enteredPassword}
                      onChange={(e) => {
                        setEnteredPassword(e.target.value);
                        setPasswordError(false);
                      }}
                      className={`${passwordError ? "border-destructive focus-visible:ring-destructive" : ""} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-sm text-destructive font-medium mt-1">Incorrect password. Please try again.</p>
                  )}
                </div>
                <Button type="submit" className="w-full bg-primary mt-2">
                  Unlock Quiz
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const handleAnswerChange = (value: string) => {
    if (isSubmitted) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  if (isCheated) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-2 border-destructive shadow-2xl overflow-hidden">
            <div className="bg-destructive/10 p-6 flex justify-center">
              <div className="bg-destructive p-4 rounded-full ring-8 ring-destructive/10 animate-pulse">
                <AlertTriangle className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-3xl font-headline font-bold text-destructive">Activity Blocked!</CardTitle>
              <CardDescription className="text-lg mt-2">
                Suspicious movement detected (tab switch or window minimize).
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4 pb-8">
              <p className="text-muted-foreground">
                To maintain exam integrity, this quiz has been automatically **disqualified**. Your attempt has been logged for teacher review.
              </p>
              <div className="pt-4">
                <Button size="lg" variant="outline" className="border-destructive text-destructive hover:bg-destructive/5" asChild>
                  <Link href="/dashboard">Return to Dashboard</Link>
                </Button>
              </div>
            </CardContent>
            <div className="bg-destructive py-3 text-center text-xs text-white uppercase tracking-widest font-bold">
              Security Violation Logged
            </div>
          </Card>
        </main>
      </div>
    );
  }
  const submitQuiz = async () => {
    let correctCount = 0;
    let hasManualGrading = false;
    quiz.questions.forEach(q => {
      if (q.type === 'mcq') {
        const userAnswer = (answers[q.id] || "").trim().toLowerCase();
        const correctAnswer = (q.correctAnswer || "").trim().toLowerCase();
        if (userAnswer === correctAnswer) {
          correctCount += (q.points || 1);
        }
      } else if (q.type === 'fill-in-the-blanks') {
        const userAnswer = (answers[q.id] || "").trim().toLowerCase();
        const correctAnswer = (q.correctAnswer || "").trim().toLowerCase();
        if (userAnswer === correctAnswer) {
          correctCount += (q.points || 1);
        }
      }
    });

    if (profile) {
      const attempt: QuizAttempt = {
        id: Date.now().toString(),
        quizId: quiz.id,
        studentId: profile.id,
        studentName: `${profile.firstName} ${profile.lastName}`,
        studentEmail: profile.email,
        score: correctCount,
        totalQuestions: quiz.questions.length,
        completedAt: new Date().toISOString(),
        status: 'completed',
        answers,
      };

      try {
        await saveAttempt(profile.id, attempt);
      } catch (e) {
        console.error("Failed to save attempt", e);
      }
    }

    // Set score and show the results page *after* trying to save
    setScore(correctCount);
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    const accuracy = (score / quiz.questions.length) * 100;
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 max-w-3xl">
          <Card className="text-center p-8 mb-8 border-2 border-primary/20">
            <div className="flex justify-center mb-6">
              <div className="bg-accent/10 p-4 rounded-full">
                <Trophy className="h-16 w-16 text-accent" />
              </div>
            </div>
            <h1 className="text-4xl font-headline font-bold text-primary mb-2">Quiz Submitted!</h1>
            {false ? (
              <div className="space-y-4">
                <p className="text-muted-foreground mb-6">Your answers have been saved and sent to your teacher for manual grading.</p>
                <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 inline-block">
                  <p className="text-amber-800 font-bold flex items-center justify-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Grading in Progress
                  </p>
                  <p className="text-xs text-amber-700 mt-1">Final results will be available after 1-2 days.</p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground mb-6">You've finished the {quiz.title} quiz.</p>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
                  <div className="p-4 bg-muted rounded-xl">
                    <p className="text-3xl font-bold text-primary">{score} / {quiz.questions.length}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                  <div className="p-4 bg-muted rounded-xl">
                    <p className="text-3xl font-bold text-accent">{Math.round(accuracy)}%</p>
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-center gap-4 mt-8">
              <Button asChild className="bg-primary">
                <Link href="/dashboard"><Home className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/quizzes">Take More Quizzes</Link>
              </Button>
            </div>
          </Card>

          <h2 className="text-2xl font-headline font-bold mb-6 text-center">Detailed Review</h2>
          <div className="space-y-6">
            {quiz.questions.map((q, idx) => (
              <Card key={q.id} className={`border-l-4 ${answers[q.id] === q.correctAnswer ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <CardHeader>
                  <CardTitle className="text-lg font-headline">Question {idx + 1}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="font-medium">{q.questionText}</p>
                  {q.type === 'mcq' && q.answerChoices && q.answerChoices.map((choice) => (
                    <div key={choice} className={`p-3 rounded-lg border flex items-center justify-between ${choice === q.correctAnswer ? 'bg-green-50 border-green-200' :
                        choice === answers[q.id] ? 'bg-red-50 border-red-200' : 'bg-white'
                      }`}>
                      <span className={choice === q.correctAnswer ? 'font-bold text-green-700' : ''}>{choice}</span>
                      {choice === q.correctAnswer && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      {choice === answers[q.id] && choice !== q.correctAnswer && <XCircle className="h-5 w-5 text-red-600" />}
                    </div>
                  ))}
                  {q.type === 'fill-in-the-blanks' && (
                    <div className="space-y-2">
                      <div className={`p-3 rounded-lg border ${answers[q.id]?.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase()
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                        }`}>
                        <p className="text-sm font-semibold mb-1">Your Answer:</p>
                        <p>{answers[q.id] || "No answer provided"}</p>
                      </div>
                      
                      {q.correctAnswer && (
                        <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                          <p className="text-sm font-semibold mb-1">Model Answer:</p>
                          <p>{q.correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {q.explanation && q.type === 'mcq' && (
                    <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {isPreview && (
        <div className="bg-amber-500 text-white py-2 px-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
            <Eye className="h-4 w-4" /> Preview Mode
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium">
              <span>Show Answers</span>
              <Button 
                variant={showAnswers ? "secondary" : "outline"} 
                size="sm" 
                className="h-7 px-3 bg-white/20 hover:bg-white/30 border-white/40 text-white"
                onClick={() => setShowAnswers(!showAnswers)}
              >
                {showAnswers ? "ON" : "OFF"}
              </Button>
            </div>
            <p className="text-[10px] opacity-80 italic hidden md:block">Teacher/Admin Preview • Security checks disabled</p>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-headline font-bold text-primary">{quiz.title}</h1>
            <div className="flex items-center gap-2">
              {quiz.activityMonitoring !== false && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 gap-1">
                  <ShieldAlert className="h-3 w-3" /> Monitor Active
                </Badge>
              )}
              <Badge variant="outline">{currentQuestionIndex + 1} of {quiz.questions.length}</Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="shadow-lg border-2 border-primary/5">
          <CardHeader>
            <CardDescription className="text-sm font-semibold text-accent uppercase tracking-wider">Question {currentQuestionIndex + 1}</CardDescription>
            <CardTitle className="text-xl font-headline leading-relaxed">
              {currentQuestion.questionText}
              {showAnswers && currentQuestion.correctAnswer && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <CheckCircle2 className="h-4 w-4" /> Correct Answer:
                  </div>
                  <p className="font-medium">{currentQuestion.correctAnswer}</p>
                  {currentQuestion.explanation && (
                    <p className="mt-2 text-xs opacity-80 italic"><span className="font-bold">Explanation:</span> {currentQuestion.explanation}</p>
                  )}
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentQuestion.type === 'mcq' && currentQuestion.answerChoices && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={handleAnswerChange}
                className="space-y-3"
              >
                {currentQuestion.answerChoices.map((choice, i) => (
                  <div key={i} className="flex items-center space-x-2 group">
                    <RadioGroupItem value={choice} id={`option-${i}`} className="peer sr-only" />
                    <Label
                      htmlFor={`option-${i}`}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all cursor-pointer hover:bg-primary/5 
                        ${answers[currentQuestion.id] === choice
                          ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm'
                          : 'border-muted hover:border-primary/20 bg-card'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
                          ${answers[currentQuestion.id] === choice
                            ? 'bg-primary border-primary text-white'
                            : 'border-muted text-muted-foreground group-hover:border-primary/40'}`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        {choice}
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'fill-in-the-blanks' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-2 italic">Type the missing word(s) in the box below.</p>
                <Input
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Enter your answer..."
                  className="text-lg py-6"
                />
              </div>
            )}


          </CardContent>
          <CardFooter className="flex justify-between items-center bg-muted/30 p-6">
            <Button
              variant="outline"
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" /> Previous
            </Button>

            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <Button
                className="bg-accent hover:bg-accent/90 px-8"
                onClick={submitQuiz}
                disabled={Object.keys(answers).length < quiz.questions.length}
              >
                Finish Quiz
              </Button>
            ) : (
              <Button
                onClick={nextQuestion}
                className="bg-primary hover:bg-primary/90 px-8"
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
        {Object.keys(answers).length < quiz.questions.length && (
          <p className="text-center mt-4 text-xs text-muted-foreground">
            Please answer all questions before submitting.
          </p>
        )}
      </main>
    </div>
  );
}

export default function TakeQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RouteGuard allowedRole={['student', 'teacher', 'administrator']}>
      <TakeQuizContent id={id} />
    </RouteGuard>
  );
}
