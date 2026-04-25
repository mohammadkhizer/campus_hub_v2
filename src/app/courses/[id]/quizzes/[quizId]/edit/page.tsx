"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { getCourseDetail } from '@/app/actions/courses';
import { serverSaveQuiz, serverGetQuiz } from '@/app/actions/quizzes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  BrainCircuit, 
  UserPen, 
  Save, 
  ArrowLeft, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';

interface Question {
  id: string;
  type: 'mcq' | 'fill-in-the-blanks' | 'short-answer' | 'long-answer';
  questionText: string;
  answerChoices: string[];
  correctAnswer: string;
  points: number;
}

export default function EditQuizPage() {
  const { profile } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const quizId = params.quizId as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  
  const [quizDetails, setQuizDetails] = useState({
    title: '',
    description: '',
    timeLimitMinutes: '30',
    difficulty: 'medium',
    password: ''
  });

  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', type: 'mcq', questionText: '', answerChoices: ['', '', '', ''], correctAnswer: '', points: 1 }
  ]);

  // AI Generation State
  const [aiTopic, setAiTopic] = useState('');
  const [questionCount, setQuestionCount] = useState('5');

  useEffect(() => {
    const checkCourseAndQuiz = async () => {
      const course = await getCourseDetail(id);
      if (!course) {
        toast({ title: "Error", description: "Course not found", variant: "destructive" });
        router.push('/admin');
        return;
      }

      if (quizId) {
        const quiz = await serverGetQuiz(quizId);
        if (quiz) {
          setQuizDetails({
            title: quiz.title || '',
            description: quiz.description || '',
            timeLimitMinutes: quiz.timeLimit?.toString() || '30',
            difficulty: quiz.difficulty || 'medium',
            password: quiz.password || ''
          });

          if (quiz.questions && quiz.questions.length > 0) {
             setQuestions(quiz.questions.map((q: any) => ({
               id: q.id || Math.random().toString(36).substr(2, 9),
               type: q.type || 'mcq',
               questionText: q.questionText,
               answerChoices: q.answerChoices && q.answerChoices.length > 0 ? [...q.answerChoices, '', '', ''].slice(0, 4) : ['', '', '', ''],
               correctAnswer: q.correctAnswer || '',
               points: q.points || 1
             })));
          }
        } else {
           toast({ title: "Error", description: "Quiz not found", variant: "destructive" });
           router.push(`/courses/${id}/manage`);
           return;
        }
      }

      setLoading(false);
    };
    checkCourseAndQuiz();
  }, [id, quizId, router, toast]);

  const addQuestion = () => {
    setQuestions([...questions, { 
      id: Date.now().toString(), 
      type: 'mcq',
      questionText: '', 
      answerChoices: ['', '', '', ''], 
      correctAnswer: '',
      points: 1
    }]);
  };

  const removeQuestion = (qId: string) => {
    setQuestions(questions.filter(q => q.id !== qId));
  };

  const updateQuestion = (qId: string, field: string, value: any) => {
    setQuestions(questions.map(q => q.id === qId ? { ...q, [field]: value } : q));
  };

  const updateChoice = (qId: string, choiceIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newChoices = [...q.answerChoices];
        newChoices[choiceIndex] = value;
        return { ...q, answerChoices: newChoices };
      }
      return q;
    }));
  };

  const handleManualSave = async () => {
    if (!profile) return;
    
    // Validation
    if (!quizDetails.title) {
        toast({ title: "Title Missing", description: "Please enter a quiz title.", variant: "destructive" });
        return;
    }

    if (questions.some(q => !q.questionText || (q.type === 'mcq' && !q.correctAnswer))) {
        toast({ title: "Incomplete Questions", description: "Please fill all question texts and select correct answers for MCQs.", variant: "destructive" });
        return;
    }

    setSubmitting(true);
    const result = await serverSaveQuiz({
      ...quizDetails,
      id: quizId,
      adminId: profile.id,
      courseId: id,
      questions,
      published: true,
      timeLimitMinutes: parseInt(quizDetails.timeLimitMinutes)
    });

    if (result.success) {
      toast({ title: "Success", description: "Quiz updated successfully!" });
      router.push(`/courses/${id}/manage`);
    } else {
      toast({ title: "Error", description: "Failed to update quiz.", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const generateAIQuestions = async () => {
    if (!aiTopic) {
        toast({ title: "Topic Required", description: "Enter a topic for AI generation" });
        return;
    }

    setSubmitting(true);
    // Simulation of AI generation logic
    setTimeout(() => {
        const count = parseInt(questionCount);
        const generated: Question[] = Array.from({ length: count }).map((_, i) => ({
            id: `ai-${Date.now()}-${i}`,
            type: 'mcq',
            questionText: `Generated Question about ${aiTopic} #${i+1}?`,
            answerChoices: [`Correct answer for ${aiTopic}`, `Wrong option B`, `Wrong option C`, `Wrong option D`],
            correctAnswer: `Correct answer for ${aiTopic}`,
            points: 1
        }));
        setQuestions([...questions, ...generated]);
        setMode('manual'); // Switch to manual to allow review
        setSubmitting(false);
        toast({ title: "AI Generation Complete", description: `${count} questions generated. Review them below.` });
    }, 2000);
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <RouteGuard allowedRole={['administrator', 'teacher']}>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        
        <header className="bg-white border-b py-6">
          <div className="container mx-auto px-4">
             <Link href={`/courses/${id}/manage`} className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
               <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course Management
             </Link>
             <h1 className="text-3xl font-headline font-bold">Edit Academic Quiz</h1>
             <p className="text-muted-foreground">Modify this assessment for your students.</p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-10">
          <div className="grid lg:grid-cols-3 gap-10">
            
            {/* Sidebar Settings */}
            <div className="lg:col-span-1 space-y-6">
               <Card className="shadow-sm">
                 <CardHeader>
                   <CardTitle className="text-lg">Quiz Settings</CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Quiz Title</Label>
                        <Input 
                          placeholder="Final Assessment: Module 1" 
                          value={quizDetails.title}
                          onChange={(e) => setQuizDetails({...quizDetails, title: e.target.value})}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Instructions</Label>
                        <Textarea 
                          placeholder="Read questions carefully..." 
                          value={quizDetails.description}
                          onChange={(e) => setQuizDetails({...quizDetails, description: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Time (Mins)</Label>
                            <Input 
                              type="number" 
                              value={quizDetails.timeLimitMinutes}
                              onChange={(e) => setQuizDetails({...quizDetails, timeLimitMinutes: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Difficulty</Label>
                            <Select 
                              value={quizDetails.difficulty} 
                              onValueChange={(v) => setQuizDetails({...quizDetails, difficulty: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Beginner</SelectItem>
                                    <SelectItem value="medium">Intermediate</SelectItem>
                                    <SelectItem value="hard">Advanced</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2 pt-2 border-t">
                        <Label className="flex items-center gap-2 justify-between">
                           <div className="flex items-center gap-2">
                             <AlertCircle className="h-4 w-4 text-amber-500" />
                             Security Password (Optional)
                           </div>
                           {quizDetails.password && (
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-6 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                               onClick={() => setQuizDetails({...quizDetails, password: ''})}
                             >
                               Remove Password
                             </Button>
                           )}
                        </Label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="e.g. EXAM2024" 
                            value={quizDetails.password}
                            onChange={(e) => setQuizDetails({...quizDetails, password: e.target.value})}
                            className="flex-1"
                          />
                          <Button 
                            variant="outline"
                            onClick={() => {
                              const randomPwd = Math.random().toString(36).slice(-6).toUpperCase();
                              setQuizDetails({...quizDetails, password: randomPwd});
                            }}
                          >
                            Generate
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Students must enter this to start. Leave blank for no password.</p>
                    </div>
                 </CardContent>
                 <CardFooter className="pt-0">
                    <Button className="w-full bg-primary" onClick={handleManualSave} disabled={submitting}>
                        {submitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Update Quiz
                    </Button>
                 </CardFooter>
               </Card>

               <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                  <h4 className="font-bold text-primary flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4" />
                    Pro Tip
                  </h4>
                  <p className="text-xs text-slate-600">
                    All questions will be automatically shuffled for each student to prevent copying and ensure fresh assessment.
                  </p>
               </div>
            </div>

            {/* Questions Area */}
            <div className="lg:col-span-2">
              <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-white shadow-sm border">
                  <TabsTrigger value="manual" className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2 transition-all">
                    <UserPen className="h-4 w-4" /> Manual Setup
                  </TabsTrigger>
                  <TabsTrigger value="ai" className="data-[state=active]:bg-accent data-[state=active]:text-white gap-2 transition-all">
                    <BrainCircuit className="h-4 w-4" /> AI Generator
                  </TabsTrigger>
                </TabsList>

                {/* Manual Mode */}
                <TabsContent value="manual" className="space-y-6">
                    {questions.map((q, qIndex) => (
                      <Card key={q.id} className="relative overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all">
                         <div className="absolute top-0 left-0 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Q{qIndex + 1}</div>
                         <CardHeader className="pt-8 flex flex-row justify-between items-start gap-4">
                            <div className="flex-1 space-y-4">
                               <div className="flex items-center gap-4">
                                 <Select 
                                   value={q.type} 
                                   onValueChange={(v: any) => updateQuestion(q.id, 'type', v)}
                                 >
                                   <SelectTrigger className="w-[180px] bg-white">
                                     <SelectValue placeholder="Question Type" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="mcq">Multiple Choice</SelectItem>
                                     <SelectItem value="fill-in-the-blanks">Fill in Blanks</SelectItem>
                                     <SelectItem value="short-answer">Short Answer</SelectItem>
                                     <SelectItem value="long-answer">Long Answer</SelectItem>
                                   </SelectContent>
                                 </Select>
                                 <div className="flex items-center gap-2">
                                   <Label className="text-xs uppercase font-bold text-muted-foreground">Points</Label>
                                   <Input 
                                     type="number" 
                                     className="w-16 h-8" 
                                     value={q.points} 
                                     onChange={(e) => updateQuestion(q.id, 'points', parseInt(e.target.value))}
                                   />
                                 </div>
                               </div>
                               <Textarea 
                                 placeholder={q.type === 'fill-in-the-blanks' ? "Enter text with _______ for blank..." : "Enter your question text here..."}
                                 className="text-lg font-medium border-none shadow-none focus-visible:ring-0 px-0 min-h-[60px]"
                                 value={q.questionText}
                                 onChange={(e) => updateQuestion(q.id, 'questionText', e.target.value)}
                               />
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => removeQuestion(q.id)}
                              disabled={questions.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                         </CardHeader>
                         <CardContent className="space-y-4">
                            {q.type === 'mcq' ? (
                              <div className="grid md:grid-cols-2 gap-4">
                                 {q.answerChoices.map((choice, cIndex) => (
                                   <div key={cIndex} className="flex items-center gap-2 group">
                                      <div 
                                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 cursor-pointer transition-all ${
                                          q.correctAnswer === choice && choice !== '' 
                                          ? 'bg-green-600 border-green-600 text-white' 
                                          : 'bg-slate-50 text-slate-400 group-hover:border-primary/40'
                                        }`}
                                        onClick={() => choice !== '' && updateQuestion(q.id, 'correctAnswer', choice)}
                                        title="Set as correct answer"
                                      >
                                        {String.fromCharCode(65 + cIndex)}
                                      </div>
                                      <Input 
                                        placeholder={`Option ${String.fromCharCode(65 + cIndex)}`}
                                        value={choice}
                                        onChange={(e) => updateChoice(q.id, cIndex, e.target.value)}
                                        className="bg-slate-50 border-slate-200"
                                      />
                                   </div>
                                 ))}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Label className="text-xs uppercase font-bold text-muted-foreground">
                                  {q.type === 'fill-in-the-blanks' ? 'Correct Word(s)' : 'Model Answer (Optional for long-answer)'}
                                </Label>
                                <Input 
                                  placeholder={q.type === 'fill-in-the-blanks' ? "The word that fills the blank" : "What should the student write?"}
                                  value={q.correctAnswer}
                                  onChange={(e) => updateQuestion(q.id, 'correctAnswer', e.target.value)}
                                  className="bg-slate-50 border-slate-200"
                                />
                              </div>
                            )}
                         </CardContent>
                      </Card>
                    ))}
                   
                   <Button 
                     variant="outline" 
                     className="w-full border-dashed border-2 h-16 text-primary hover:bg-primary/5 hover:border-primary/40"
                     onClick={addQuestion}
                   >
                     <Plus className="mr-2 h-5 w-5" /> Add Another Question
                   </Button>
                </TabsContent>

                {/* AI Mode */}
                <TabsContent value="ai">
                  <Card className="border-2 border-accent/20 bg-accent/5">
                    <CardHeader className="text-center">
                       <div className="mx-auto bg-accent/20 p-4 rounded-full w-fit mb-4 text-accent">
                          <BrainCircuit className="h-10 w-10" />
                       </div>
                       <CardTitle className="text-2xl font-headline">AI Smart Generator</CardTitle>
                       <CardDescription>Generate academic questions from your course content automatically.</CardDescription>
                    </CardHeader>
                    <CardContent className="max-w-md mx-auto space-y-6 py-4">
                       <div className="space-y-2">
                          <Label>Generation Topic</Label>
                          <Input 
                            placeholder="e.g. Molecular Biology basics" 
                            className="h-12 border-accent/20 focus:border-accent"
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                          />
                       </div>
                       <div className="space-y-2">
                          <Label>Number of Questions</Label>
                          <Select value={questionCount} onValueChange={setQuestionCount}>
                             <SelectTrigger className="h-12 border-accent/20">
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="5">5 Questions</SelectItem>
                                <SelectItem value="10">10 Questions</SelectItem>
                                <SelectItem value="20">20 Questions</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                       <Button 
                         className="w-full h-14 bg-accent hover:bg-accent/90 text-lg shadow-lg"
                         onClick={generateAIQuestions}
                         disabled={submitting}
                       >
                         {submitting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <BrainCircuit className="h-5 w-5 mr-2" />}
                         Generate Academic Quiz Now
                       </Button>
                       
                       <div className="flex items-center gap-2 p-4 bg-white/50 rounded-xl border border-accent/10 text-xs text-muted-foreground mt-6">
                          <HelpCircle className="h-4 w-4 shrink-0 text-accent" />
                          The AI will analyze established academic standards to create challenging multiple-choice questions. You can review and edit them before saving.
                       </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

          </div>
        </main>
      </div>
    </RouteGuard>
  );
}
