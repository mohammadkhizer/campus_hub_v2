"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { getAllAttempts, getQuizzes } from '@/lib/store';
import { Quiz, QuizAttempt } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Loader2, Trophy, ArrowLeft, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

function LeaderboardContent() {
  const { profile } = useAuth();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [attemptsData, quizzesData] = await Promise.all([
        getAllAttempts(),
        getQuizzes()
      ]);
      
      // Sort attempts by date (newest first)
      const sortedAttempts = [...attemptsData].sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
      
      setAttempts(sortedAttempts);
      
      // Create a map of quizId -> quiz for easy title lookup
      const quizMap: Record<string, Quiz> = {};
      quizzesData.forEach(q => { quizMap[q.id] = q; });
      setQuizzes(quizMap);
      
      setLoading(false);
    };

    fetchData();
  }, []);

  const filteredAttempts = attempts.filter(a => {
    const quizTitle = quizzes[a.quizId]?.title || 'Unknown Quiz';
    const studentName = a.studentName || 'Unknown Student';
    return quizTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
           studentName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
              <Trophy className="h-8 w-8 text-accent" />
              Student Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Review all quiz attempts and student performances.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Filter results by student name or quiz title.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student or quiz..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
                    <TableHead>Student</TableHead>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttempts.map((attempt) => {
                    const percentage = Math.round((attempt.score / attempt.totalQuestions) * 100);
                    return (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          <div className="font-medium">{attempt.studentName}</div>
                          <div className="text-xs text-muted-foreground">{attempt.studentEmail}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {quizzes[attempt.quizId]?.title || "Deleted Quiz"}
                          </div>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {quizzes[attempt.quizId]?.category || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-lg">
                            {attempt.score} <span className="text-sm font-normal text-muted-foreground">/ {attempt.totalQuestions}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {attempt.status === 'disqualified' ? (
                            <Badge variant="destructive" className="animate-pulse">DISQUALIFIED</Badge>
                          ) : (
                            <Badge variant={percentage >= 80 ? 'default' : percentage >= 50 ? 'secondary' : 'destructive'}>
                              {percentage}%
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(attempt.completedAt).toLocaleDateString()}
                          <br />
                          {new Date(attempt.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredAttempts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
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
    <RouteGuard allowedRole="administrator">
      <LeaderboardContent />
    </RouteGuard>
  );
}
