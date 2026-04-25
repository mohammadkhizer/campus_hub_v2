"use client";

import { useEffect, useState, use, useMemo } from 'react';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { getQuizAttempts, getQuiz, deleteAttempt } from '@/lib/store';
import { Quiz, QuizAttempt } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Loader2, Trophy, ArrowLeft, Calendar, Clock, Trash2, Search, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function QuizLeaderboardContent({ id }: { id: string }) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('rank');

  const fetchData = async () => {
    setLoading(true);
    const [attemptsData, quizData] = await Promise.all([
      getQuizAttempts(id),
      getQuiz(id)
    ]);
    
    setAttempts(attemptsData);
    setQuiz(quizData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const filteredAndSortedAttempts = useMemo(() => {
    // 1. Filter
    let result = attempts.filter(a => {
      const studentName = a.studentName || 'Unknown Student';
      const enrollment = a.studentEnrollment || '';
      
      const search = searchTerm.toLowerCase();
      return studentName.toLowerCase().includes(search) ||
             enrollment.toLowerCase().includes(search);
    });

    // 2. Sort
    result.sort((a, b) => {
      const percentageA = (a.score / a.totalQuestions) * 100;
      const percentageB = (b.score / b.totalQuestions) * 100;

      if (sortOrder === 'high-to-low') return percentageB - percentageA;
      if (sortOrder === 'low-to-high') return percentageA - percentageB;
      if (sortOrder === 'newest') return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      if (sortOrder === 'oldest') return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
      // Default 'rank' is already handled by server GetQuizAttempts (sorted by score desc)
      return 0;
    });

    return result;
  }, [attempts, searchTerm, sortOrder]);

  const handleDeleteAttempt = async (attemptId: string) => {
    if (confirm("Are you sure you want to delete this attempt?")) {
      const result = await deleteAttempt(attemptId);
      if (result.success) {
        toast({ title: "Attempt Deleted", description: "The quiz attempt has been removed." });
        fetchData();
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete attempt", variant: "destructive" });
      }
    }
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

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz not found</h1>
          <Button asChild><Link href="/quizzes">Back to Quizzes</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-surface/30">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <Badge variant="outline" className="mb-2 uppercase tracking-wider text-[10px]">{quiz.category || 'Quiz'}</Badge>
            <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-3">
              <Trophy className="h-8 w-8 text-accent" />
              {quiz.title} Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Official rankings and performance metrics.
            </p>
          </div>
          <Button variant="outline" asChild className="bg-white">
            <Link href={profile?.role === 'student' ? `/quizzes` : `/dashboard-redirect`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <Card className="bg-white shadow-sm border-primary/5">
             <CardHeader className="pb-2">
               <CardDescription className="text-xs uppercase font-mono tracking-tight">Total Participants</CardDescription>
               <CardTitle className="text-2xl font-black">{attempts.length}</CardTitle>
             </CardHeader>
           </Card>
           <Card className="bg-white shadow-sm border-primary/5">
             <CardHeader className="pb-2">
               <CardDescription className="text-xs uppercase font-mono tracking-tight">Average Score</CardDescription>
               <CardTitle className="text-2xl font-black">
                 {attempts.length > 0 
                   ? Math.round((attempts.reduce((acc, curr) => acc + curr.score, 0) / attempts.reduce((acc, curr) => acc + curr.totalQuestions, 0)) * 100) 
                   : 0}%
               </CardTitle>
             </CardHeader>
           </Card>
           <Card className="bg-white shadow-sm border-primary/5">
             <CardHeader className="pb-2">
               <CardDescription className="text-xs uppercase font-mono tracking-tight">Difficulty</CardDescription>
               <CardTitle className="text-2xl font-black capitalize">{quiz.difficulty || 'Medium'}</CardTitle>
             </CardHeader>
           </Card>
        </div>

        <Card className="bg-white shadow-sm border-none mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name or enrollment..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full md:w-64">
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger>
                    <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rank">Default (Rank)</SelectItem>
                    <SelectItem value="high-to-low">Marks: High to Low</SelectItem>
                    <SelectItem value="low-to-high">Marks: Low to High</SelectItem>
                    <SelectItem value="newest">Latest Attempts</SelectItem>
                    <SelectItem value="oldest">Oldest Attempts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-xl border-none overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">Rankings</CardTitle>
                <CardDescription>Based on performance and accuracy.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[60px] text-center font-mono text-[10px] uppercase tracking-widest">Rank</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest">Student Details</TableHead>
                  <TableHead className="font-mono text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                  {(profile?.role === 'administrator' || profile?.role === 'teacher') && (
                    <TableHead className="w-[120px] text-right font-mono text-[10px] uppercase tracking-widest">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedAttempts.map((attempt, index) => {
                  // Find the true rank in the original sorted attempts array
                  const trueRank = attempts.findIndex(a => a.id === attempt.id);
                  const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                  const isFail = percentage < 30;
                  
                  return (
                    <TableRow key={attempt.id} className={attempt.studentId === profile?.id ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"}>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {trueRank === 0 ? (
                            <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-yellow-200">1</div>
                          ) : trueRank === 1 ? (
                            <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-slate-200">2</div>
                          ) : trueRank === 2 ? (
                            <div className="w-7 h-7 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-amber-200">3</div>
                          ) : (
                            <span className="font-mono text-muted-foreground text-xs font-bold">#{trueRank + 1}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold flex items-center gap-2">
                            {attempt.studentName}
                            {attempt.studentId === profile?.id && (
                              <Badge variant="secondary" className="text-[9px] h-4">YOU</Badge>
                            )}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[9px] font-mono py-0">{attempt.studentEnrollment || 'No ID'}</Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">{attempt.studentEmail}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          {attempt.status === 'disqualified' && <Badge variant="destructive" className="text-[10px] font-black uppercase">DQ</Badge>}
                          {attempt.status === 'pending_review' && <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-black uppercase">Pending Review</Badge>}
                          {attempt.status === 'completed' && <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] font-black uppercase">Completed</Badge>}
                          
                          <div className="flex flex-col items-center mt-1">
                            <span className={`text-lg font-black ${isFail ? 'text-destructive' : percentage >= 80 ? 'text-green-600' : 'text-blue-600'}`}>
                              {percentage}%
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">{attempt.score}/{attempt.totalQuestions} pts</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end text-xs text-muted-foreground font-mono">
                          <span className="flex items-center gap-1 font-bold text-foreground">
                            <Calendar className="h-3 w-3" /> {new Date(attempt.completedAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(attempt.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </TableCell>
                      {(profile?.role === 'administrator' || profile?.role === 'teacher') && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-xs font-bold uppercase tracking-wider"
                              asChild
                            >
                                <Link href={`/quizzes/attempts/${attempt.id}/review`}>
                                    {attempt.status === 'pending_review' ? 'Grade' : 'Review'}
                                </Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDeleteAttempt(attempt.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {attempts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-muted-foreground font-mono text-sm">
                      No attempts recorded yet. Be the first!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function QuizLeaderboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RouteGuard allowedRole={['administrator', 'teacher']}>
      <QuizLeaderboardContent id={id} />
    </RouteGuard>
  );
}
