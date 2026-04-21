"use client";

import { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { saveQuiz } from '@/lib/store';
import { Quiz, Question } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Sparkles, Trash2, Plus, ArrowLeft, Save, Loader2, Wand2,
  CheckCircle2, Circle, GripVertical, BookOpen, Pencil, X, Check,
  Eye, EyeOff,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateQuizQuestions } from '@/ai/flows/generate-quiz-questions';
import { useToast } from '@/hooks/use-toast';

/* ─────────────────────────────── types ────────────────────────────────── */
interface DraftQuestion {
  id: string;
  questionText: string;
  answerChoices: [string, string, string, string];
  correctAnswer: string;
  explanation: string;
}

const BLANK_QUESTION = (): DraftQuestion => ({
  id: Date.now().toString(),
  questionText: '',
  answerChoices: ['', '', '', ''],
  correctAnswer: '',
  explanation: '',
});

/* ─────────────────────────── QuestionEditor ────────────────────────────── */
function QuestionEditor({
  question,
  index,
  onChange,
  onDelete,
}: {
  question: DraftQuestion;
  index: number;
  onChange: (q: DraftQuestion) => void;
  onDelete: () => void;
}) {
  const setChoice = (i: number, value: string) => {
    const choices = [...question.answerChoices] as [string, string, string, string];
    choices[i] = value;
    // If this was the correct answer, update reference
    const updatedCorrect =
      question.correctAnswer === question.answerChoices[i] ? value : question.correctAnswer;
    onChange({ ...question, answerChoices: choices, correctAnswer: updatedCorrect });
  };

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
          <Badge variant="secondary" className="text-xs">Q{index + 1}</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Question Text */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Question
          </Label>
          <Textarea
            value={question.questionText}
            onChange={(e) => onChange({ ...question, questionText: e.target.value })}
            placeholder="Type your question here..."
            className="resize-none text-sm"
            rows={2}
          />
        </div>

        {/* Answer Choices */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Answer Choices — click circle to mark correct
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {question.answerChoices.map((choice, i) => {
              const isCorrect = choice !== '' && choice === question.correctAnswer;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${isCorrect
                      ? 'border-green-400 bg-green-50 dark:bg-green-950/30'
                      : 'border-border bg-card hover:bg-muted/30'
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => onChange({ ...question, correctAnswer: choice })}
                    disabled={!choice}
                    className="shrink-0 focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
                    title="Mark as correct answer"
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <Input
                    value={choice}
                    onChange={(e) => setChoice(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="h-8 text-sm border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none"
                  />
                </div>
              );
            })}
          </div>
          {!question.correctAnswer && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <Circle className="h-3 w-3" /> Select the correct answer above
            </p>
          )}
        </div>

        {/* Explanation */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Explanation (Optional)
          </Label>
          <Input
            value={question.explanation}
            onChange={(e) => onChange({ ...question, explanation: e.target.value })}
            placeholder="Explain why this is the correct answer..."
            className="text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────── Main Page ─────────────────────────────────── */
function CreateQuizContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isAI = searchParams.get('ai') === 'true';
  const { profile } = useAuth();

  /* ── quiz metadata ── */
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  /* ── questions ── */
  const [questions, setQuestions] = useState<DraftQuestion[]>([BLANK_QUESTION()]);

  /* ── AI state ── */
  const [aiContext, setAiContext] = useState('');
  const [aiTopic, setAiTopic] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ─── helpers ─── */
  const addBlankQuestion = () => {
    setQuestions((prev) => [...prev, BLANK_QUESTION()]);
  };

  const updateQuestion = (id: string, updated: DraftQuestion) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? updated : q)));
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const validateQuestions = (): string | null => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return `Question ${i + 1} is missing text.`;
      if (q.answerChoices.some((c) => !c.trim()))
        return `Question ${i + 1} has an empty answer choice.`;
      if (!q.correctAnswer) return `Question ${i + 1} has no correct answer selected.`;
    }
    return null;
  };

  /* ─── AI generation ─── */
  const handleGenerateAI = async () => {
    if (!aiContext && !aiTopic) {
      toast({ title: 'Input Required', description: 'Provide context text or topic keywords.' });
      return;
    }
    setAiLoading(true);
    try {
      const result = await generateQuizQuestions({
        contextText: aiContext,
        topicKeywords: aiTopic ? aiTopic.split(',').map((s) => s.trim()) : [],
        numQuestions: 5,
        difficulty,
      });

      const newQs: DraftQuestion[] = result.questions.map((q, idx) => ({
        id: `ai-${Date.now()}-${idx}`,
        questionText: q.questionText,
        answerChoices: q.answerChoices as [string, string, string, string],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation ?? '',
      }));

      setQuestions((prev) => [...prev, ...newQs]);
      toast({ title: '✨ AI generated 5 questions!', description: 'Review and edit them below.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Generation Failed', description: 'Please try again.' });
    } finally {
      setAiLoading(false);
    }
  };

  /* ─── save ─── */
  const handleSave = async (asDraft = false) => {
    if (!profile) return;
    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Title Required', description: 'Give your quiz a title.' });
      return;
    }
    if (questions.length === 0) {
      toast({ variant: 'destructive', title: 'No Questions', description: 'Add at least one question.' });
      return;
    }
    const validationError = validateQuestions();
    if (validationError) {
      toast({ variant: 'destructive', title: 'Incomplete Question', description: validationError });
      return;
    }

    setSaving(true);

    const quiz: Quiz = {
      id: Date.now().toString(),
      course: '',
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || 'General',
      difficulty,
      timeLimit: timeLimitMinutes || 0,
      isPublished: asDraft ? false : publishImmediately,
      generationType: isAI ? 'ai' : 'manual',
      ...(!password.trim() ? {} : { password: password.trim() }),
      questions: questions.map((q) => ({
        id: q.id,
        questionText: q.questionText.trim(),
        answerChoices: q.answerChoices,
        correctAnswer: q.correctAnswer,
        ...(!q.explanation.trim() ? {} : { explanation: q.explanation.trim() }),
      })),
    };

    try {
      await saveQuiz(quiz);
      toast({
        title: asDraft ? '💾 Draft Saved' : '🚀 Quiz Published',
        description: asDraft
          ? 'Your quiz was saved as a draft.'
          : `"${quiz.title}" is now live for students.`,
      });
      router.push('/admin');
    } catch (err: any) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Failed to Save', description: 'Please try again.' });
      setSaving(false);
    }
  };

  const completedCount = questions.filter(
    (q) => q.questionText && q.correctAnswer && q.answerChoices.every((c) => c)
  ).length;

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">
              {isAI ? '✨ AI Quiz Builder' : '📝 Create Quiz'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAI
                ? 'Let AI draft the questions, then refine them below.'
                : 'Build your quiz manually with full control.'}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[340px_1fr] gap-8 items-start">

          {/* ── LEFT PANEL ── */}
          <div className="space-y-5 lg:sticky lg:top-20">

            {/* Quiz Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> Quiz Details
                </CardTitle>
                <CardDescription className="text-xs">Basic info shown to students.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="quiz-title">Title <span className="text-destructive">*</span></Label>
                  <Input
                    id="quiz-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. World Geography 101"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quiz-desc">Description</Label>
                  <Textarea
                    id="quiz-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What will students learn?"
                    className="resize-none"
                    rows={2}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quiz-category">Category</Label>
                  <Input
                    id="quiz-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Science, History, Math..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Difficulty</Label>
                    <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">🟢 Easy</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="hard">🔴 Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="time-limit">Time Limit (min)</Label>
                    <Input
                      id="time-limit"
                      type="number"
                      min={0}
                      max={180}
                      value={timeLimitMinutes}
                      onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                      placeholder="0 = no limit"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 pt-2 border-t">
                  <Label htmlFor="quiz-password">Quiz Password (Optional)</Label>
                  <div className="relative">
                    <Input
                      id="quiz-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Require a password to access"
                      className="pr-10"
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
                  <p className="text-xs text-muted-foreground">Leave empty for open access.</p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <Label className="font-medium" htmlFor="publish-toggle">Publish immediately</Label>
                    <p className="text-xs text-muted-foreground">Students can see this quiz right away.</p>
                  </div>
                  <Switch
                    id="publish-toggle"
                    checked={publishImmediately}
                    onCheckedChange={setPublishImmediately}
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Panel */}
            {isAI && (
              <Card className="border-accent/40 bg-gradient-to-b from-accent/5 to-transparent">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" /> AI Assistant
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Generate 5 questions from your material.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Source Text</Label>
                    <Textarea
                      placeholder="Paste lecture notes, textbook excerpts..."
                      className="resize-none text-sm h-28"
                      value={aiContext}
                      onChange={(e) => setAiContext(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Topic Keywords</Label>
                    <Input
                      placeholder="e.g. photosynthesis, plant cells"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-accent hover:bg-accent/90 text-white"
                    onClick={handleGenerateAI}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    {aiLoading ? 'Generating...' : 'Generate Questions'}
                  </Button>
                </CardFooter>
              </Card>
            )}

            {/* Mode toggle (non-AI view) */}
            {!isAI && (
              <Card className="border-dashed border-accent/40">
                <CardContent className="pt-4 pb-4 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">Want faster question creation?</p>
                  <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent/10" asChild>
                    <Link href="/admin/create?ai=true">
                      <Sparkles className="mr-2 h-3.5 w-3.5" /> Switch to AI Builder
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── RIGHT PANEL — Questions ── */}
          <div className="space-y-6">

            {/* Questions header + stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-headline font-bold">
                  Questions
                  {questions.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {completedCount}/{questions.length} complete
                    </span>
                  )}
                </h2>
                {questions.length > 0 && completedCount < questions.length && (
                  <p className="text-xs text-amber-600 mt-0.5">
                    {questions.length - completedCount} question{questions.length - completedCount !== 1 ? 's' : ''} still need work
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={addBlankQuestion}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Question
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-muted-foreground/30"
                  onClick={() => handleSave(true)}
                  disabled={saving}
                >
                  <Save className="mr-1.5 h-4 w-4" />
                  Save Draft
                </Button>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-1.5 h-4 w-4" />
                  )}
                  {publishImmediately ? 'Publish Quiz' : 'Save Quiz'}
                </Button>
              </div>
            </div>

            {/* AI Loading skeleton */}
            {aiLoading && (
              <div className="text-center py-16 border-2 border-dashed border-accent/40 rounded-xl bg-accent/5 flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 text-accent animate-spin" />
                <p className="font-medium text-sm">AI is drafting your questions...</p>
                <p className="text-xs text-muted-foreground">This may take a few seconds.</p>
              </div>
            )}

            {/* Empty state */}
            {questions.length === 0 && !aiLoading && (
              <div className="text-center py-20 border-2 border-dashed rounded-xl">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Pencil className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <p className="font-semibold text-lg mb-1">No questions yet</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Add questions manually or use the AI assistant.
                </p>
                <div className="flex justify-center gap-3">
                  <Button onClick={addBlankQuestion}>
                    <Plus className="mr-2 h-4 w-4" /> Add First Question
                  </Button>
                  {!isAI && (
                    <Button variant="outline" className="border-accent text-accent hover:bg-accent/10" asChild>
                      <Link href="/admin/create?ai=true">
                        <Sparkles className="mr-2 h-4 w-4" /> Try AI
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Question cards */}
            {!aiLoading && questions.map((q, idx) => (
              <QuestionEditor
                key={q.id}
                question={q}
                index={idx}
                onChange={(updated) => updateQuestion(q.id, updated)}
                onDelete={() => removeQuestion(q.id)}
              />
            ))}

            {/* Bottom Add + Save bar (visible when questions exist) */}
            {questions.length > 0 && !aiLoading && (
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t">
                <Button variant="outline" className="w-full sm:w-auto" onClick={addBlankQuestion}>
                  <Plus className="mr-2 h-4 w-4" /> Add Another Question
                </Button>
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="outline"
                    className="border-muted-foreground/30"
                    onClick={() => handleSave(true)}
                    disabled={saving}
                  >
                    <Save className="mr-1.5 h-4 w-4" /> Save Draft
                  </Button>
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => handleSave(false)}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-1.5 h-4 w-4" />
                    )}
                    {publishImmediately ? 'Publish Quiz' : 'Save Quiz'}
                  </Button>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default function CreateQuizPage() {
  return (
    <RouteGuard allowedRole="administrator">
      <CreateQuizContent />
    </RouteGuard>
  );
}
