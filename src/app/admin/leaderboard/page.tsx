"use client";

import { useEffect, useState, useMemo } from 'react';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { getAllAttempts, getQuizzes } from '@/lib/store';
import { Quiz, QuizAttempt } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Loader2, Trophy, ArrowLeft, Search, Filter, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, SortAsc, SortDesc } from 'lucide-react';

function LeaderboardContent() {
  const { profile } = useAuth();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [attemptsData, quizzesData] = await Promise.all([
        getAllAttempts(),
        getQuizzes()
      ]);
      
      setAttempts(attemptsData);
      
      // Create a map of quizId -> quiz for easy title lookup
      const quizMap: Record<string, Quiz> = {};
      quizzesData.forEach(q => { quizMap[q.id] = q; });
      setQuizzes(quizMap);
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredAndSortedAttempts = useMemo(() => {
    // 1. Filter
    let result = attempts.filter(a => {
      const quizTitle = quizzes[a.quizId]?.title || 'Unknown Quiz';
      const studentName = a.studentName || 'Unknown Student';
      const enrollment = a.studentEnrollment || '';
      
      const search = searchTerm.toLowerCase();
      return quizTitle.toLowerCase().includes(search) || 
             studentName.toLowerCase().includes(search) ||
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
      return 0;
    });

    return result;
  }, [attempts, searchTerm, sortOrder, quizzes]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
              <Trophy className="h-8 w-8 text-accent" />
              Academic Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Review quiz attempts and student performances across all modules.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href={profile?.role === 'teacher' ? '/teacher/dashboard' : '/admin'}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search & Sort</CardTitle>
            <CardDescription>Find specific students or filter by performance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student, enrollment, or quiz..."
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
                    <SelectItem value="newest">Latest Attempts</SelectItem>
                    <SelectItem value="oldest">Oldest Attempts</SelectItem>
                    <SelectItem value="high-to-low">Marks: High to Low</SelectItem>
                    <SelectItem value="low-to-high">Marks: Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attempt History</CardTitle>
            <CardDescription>A complete log of all completed quizzes.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Details</TableHead>
                    <TableHead>Quiz</TableHead>
                    <TableHead className="text-center">Attempted</TableHead>
                    <TableHead>Score (%)</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedAttempts.map((attempt) => {
                    const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                    const isFail = percentage < 30;
                    const quiz = quizzes[attempt.quizId];
                    return (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          <div className="font-bold text-sm">{attempt.studentName}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] font-mono py-0">{attempt.studentEnrollment || 'No ID'}</Badge>
                            <div className="text-[10px] text-muted-foreground">{attempt.studentEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {quiz?.title || "Deleted Quiz"}
                          </div>
                          <Badge variant="outline" className="text-[10px] uppercase mt-1">
                            {quiz?.category || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          <span className="font-bold">{attempt.attemptedCount ?? attempt.totalQuestions}</span>
                          <span className="text-muted-foreground">/{attempt.totalQuestions}</span>
                        </TableCell>
                        <TableCell>
                          {attempt.status === 'disqualified' ? (
                            <Badge variant="destructive" className="animate-pulse text-[10px] font-black">DISQUALIFIED</Badge>
                          ) : (
                            <div className="flex flex-col">
                              <span className={`text-lg font-black ${isFail ? 'text-destructive' : percentage >= 80 ? 'text-green-600' : 'text-blue-600'}`}>
                                {percentage}%
                              </span>
                              {isFail && <Badge variant="destructive" className="text-[8px] h-3 px-1 w-fit uppercase font-black">FAIL</Badge>}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs font-mono">
                          <div className="flex items-center gap-1 font-bold text-foreground">
                            <Calendar className="h-3 w-3 text-muted-foreground" /> {new Date(attempt.completedAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" /> {new Date(attempt.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild className="hover:bg-primary/5">
                            <Link href={`/quizzes/${attempt.quizId}/leaderboard`}>
                              <Trophy className="h-4 w-4 mr-1 text-accent" /> Quiz Board
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredAndSortedAttempts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                        {searchTerm ? "No matching results found." : "No attempts recorded yet."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <RouteGuard allowedRole={['administrator', 'teacher']}>
      <LeaderboardContent />
    </RouteGuard>
  );
}
