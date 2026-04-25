"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { getAnalyticsData } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Users, GraduationCap, School, ShieldCheck, TrendingUp, BookOpen, MessageSquare, Target } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const analytics = await getAnalyticsData();
      setData(analytics);
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

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

  if (!data) return <div>Error loading data</div>;

  return (
    <RouteGuard allowedRole={['superadmin']}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-10">
            <h1 className="text-4xl font-black tracking-tight text-primary">System Analytics</h1>
            <p className="text-muted-foreground mt-2 text-lg">High-level platform metrics and user trends.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-none shadow-lg bg-gradient-to-br from-primary/10 to-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Total Users</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">{data.users.total}</div>
                <div className="text-xs text-muted-foreground mt-1">Platform-wide registration</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-accent/10 to-accent/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Students</CardTitle>
                <GraduationCap className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">{data.users.students}</div>
                <div className="text-xs text-muted-foreground mt-1">{Math.round((data.users.students / data.users.total) * 100)}% of total users</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-blue-100 to-blue-50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Teachers</CardTitle>
                <School className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">{data.users.teachers}</div>
                <div className="text-xs text-muted-foreground mt-1">Authorized instructors</div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-green-100 to-green-50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Avg. Accuracy</CardTitle>
                <Target className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black">{data.quizzes.avgAccuracy}%</div>
                <div className="text-xs text-muted-foreground mt-1">Performance benchmark</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <Card className="lg:col-span-2 shadow-xl border-none">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>New registrations over the last 7 days.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trends.registrations}>
                      <defs>
                        <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorReg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-none">
              <CardHeader>
                <CardTitle>Platform Activity</CardTitle>
                <CardDescription>Engagement metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 p-3 rounded-xl">
                    <BookOpen className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Total Quizzes</p>
                    <p className="text-2xl font-black">{data.quizzes.total}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-100 p-3 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Quiz Attempts</p>
                    <p className="text-2xl font-black">{data.quizzes.attempts}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-pink-100 p-3 rounded-xl">
                    <MessageSquare className="h-6 w-6 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Feedbacks</p>
                    <p className="text-2xl font-black">{data.feedback.total}</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-dashed">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Feedback Display Rate</span>
                    <span className="text-sm font-bold">{Math.round((data.feedback.displayed / data.feedback.total) * 100 || 0)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-accent h-2 rounded-full" 
                      style={{ width: `${(data.feedback.displayed / data.feedback.total) * 100 || 0}%` }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </RouteGuard>
  );
}
