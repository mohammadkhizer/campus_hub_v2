"use client";

import { Navbar } from '@/components/navbar';
import { getQuizzes } from '@/lib/store';
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Clock, BookOpen, Layers, Search, X, SlidersHorizontal, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { Quiz } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { RouteGuard } from '@/components/route-guard';

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  hard: 'bg-red-50 text-red-700 border-red-200',
};

const DIFFICULTY_DOT: Record<string, string> = {
  easy: 'bg-green-500',
  medium: 'bg-amber-500',
  hard: 'bg-red-500',
};

function QuizListContent() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [search, setSearch] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  const loadQuizzes = async () => {
    if (!profile) return;
    setLoading(true);
    const data = await getQuizzes();
    // Student view only shows published quizzes (getQuizzes(db) without adminId returns only published)
    setQuizzes(data.filter((q) => q.isPublished));
    setLoading(false);
  };

  useEffect(() => {
    loadQuizzes();

    const handleFocus = () => loadQuizzes();

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [profile]);

  // Derived category list
  const categories = useMemo(() => {
    const cats = Array.from(new Set(quizzes.map((q) => q.category).filter(Boolean))) as string[];
    return cats.sort();
  }, [quizzes]);

  // Filtered results
  const filtered = useMemo(() => {
    return quizzes.filter((q) => {
      const matchesSearch =
        !search ||
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.description?.toLowerCase().includes(search.toLowerCase()) ||
        q.category?.toLowerCase().includes(search.toLowerCase());

      const matchesDifficulty =
        filterDifficulty === 'all' || q.difficulty === filterDifficulty;

      const matchesCategory =
        filterCategory === 'all' || q.category === filterCategory;

      return matchesSearch && matchesDifficulty && matchesCategory;
    });
  }, [quizzes, search, filterDifficulty, filterCategory]);

  const hasActiveFilters =
    search || filterDifficulty !== 'all' || filterCategory !== 'all';

  const clearFilters = () => {
    setSearch('');
    setFilterDifficulty('all');
    setFilterCategory('all');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-7xl">

        {/* ── Header ── */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-headline font-bold text-primary mb-3">
            Available Quizzes
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Test your knowledge across various subjects. Choose a category and difficulty that fits your goals.
          </p>
          {quizzes.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              <span className="font-semibold text-foreground">{quizzes.length}</span> quiz{quizzes.length !== 1 ? 'zes' : ''} available
            </p>
          )}
        </header>

        {/* ── Filters ── */}
        {quizzes.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search quizzes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-full sm:w-40">
                <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="easy">🟢 Easy</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="hard">🔴 Hard</SelectItem>
              </SelectContent>
            </Select>

            {categories.length > 1 && (
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} title="Clear filters">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* ── Quiz Grid ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
            <p>Loading quizzes...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((quiz) => (
              <Card
                key={quiz.id}
                className="flex flex-col h-full hover:shadow-xl transition-all duration-200 border-2 hover:border-primary/20 group"
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-3">
                    <Badge
                      variant="secondary"
                      className="bg-accent/10 text-accent border border-accent/20 text-xs font-medium"
                    >
                      {quiz.category || 'General'}
                    </Badge>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border ${DIFFICULTY_COLOR[quiz.difficulty] ?? ''}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${DIFFICULTY_DOT[quiz.difficulty] ?? 'bg-gray-400'}`} />
                      {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                    </span>
                  </div>
                  <CardTitle className="font-headline text-xl group-hover:text-primary transition-colors leading-snug flex items-center justify-between">
                    {quiz.title}
                    {quiz.password && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                    {quiz.description || 'Test your knowledge on this topic.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      <span>{quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {quiz.timeLimit
                          ? `${quiz.timeLimit} min`
                          : 'No time limit'}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-0">
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 transition-colors"
                    asChild
                  >
                    <Link href={`/quizzes/${quiz.id}`}>Start Quiz →</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : quizzes.length === 0 ? (
          /* No quizzes created at all */
          <div className="text-center py-28">
            <div className="flex justify-center mb-6">
              <div className="bg-muted rounded-full p-6">
                <Layers className="h-12 w-12 text-muted-foreground opacity-40" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">No quizzes available yet</h2>
            <p className="text-muted-foreground">Check back later for new content.</p>
          </div>
        ) : (
          /* Quizzes exist but filters show nothing */
          <div className="text-center py-20">
            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h2 className="text-lg font-semibold mb-1">No quizzes match your filters</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search or clearing the filters.
            </p>
            <Button variant="outline" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function QuizListPage() {
  return (
    <RouteGuard>
      <QuizListContent />
    </RouteGuard>
  );
}
