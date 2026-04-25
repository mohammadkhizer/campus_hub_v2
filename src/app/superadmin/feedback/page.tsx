"use client";

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { getFeedbacks, updateFeedbackStatus, deleteFeedback } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Loader2, Trash2, Eye, EyeOff, Star, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function FeedbackManagementPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFeedbacks = async () => {
    setLoading(true);
    const data = await getFeedbacks();
    setFeedbacks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleToggleDisplay = async (id: string, currentStatus: boolean) => {
    const result = await updateFeedbackStatus(id, !currentStatus);
    if (result.success) {
      toast({ title: `Feedback ${!currentStatus ? 'Published' : 'Hidden'}`, description: "Platform visibility updated." });
      fetchFeedbacks();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Permanently delete this feedback?")) {
      const result = await deleteFeedback(id);
      if (result.success) {
        toast({ title: "Feedback Deleted", variant: "destructive" });
        fetchFeedbacks();
      }
    }
  };

  return (
    <RouteGuard allowedRole={['superadmin']}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-primary">Feedback Management</h1>
              <p className="text-muted-foreground mt-1">Review and select feedback to display on the platform.</p>
            </div>
            <Badge variant="outline" className="h-8 px-4 font-mono">Total: {feedbacks.length}</Badge>
          </div>

          <Card className="shadow-2xl border-none overflow-hidden">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle>Student Testimonials</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center p-20">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="p-20 text-center text-muted-foreground">No feedback received yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Feedback Content</TableHead>
                      <TableHead className="text-center">Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbacks.map((f) => (
                      <TableRow key={f.id} className={f.isDisplayed ? "bg-accent/5" : ""}>
                        <TableCell className="w-[200px]">
                          <div className="font-bold">{f.studentName}</div>
                          <div className="text-[10px] font-mono text-muted-foreground uppercase">{f.studentEnrollment}</div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm line-clamp-3 leading-relaxed">{f.content}</p>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center items-center gap-1">
                            <span className="font-black text-sm">{f.rating}</span>
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          </div>
                        </TableCell>
                        <TableCell>
                          {f.isDisplayed ? (
                            <Badge className="bg-green-600 hover:bg-green-700">DISPLAYED</Badge>
                          ) : (
                            <Badge variant="secondary">HIDDEN</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                            <Calendar className="h-3 w-3" /> {new Date(f.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleToggleDisplay(f.id, f.isDisplayed)}
                              className={f.isDisplayed ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"}
                            >
                              {f.isDisplayed ? <><EyeOff className="h-4 w-4 mr-1" /> Hide</> : <><Eye className="h-4 w-4 mr-1" /> Publish</>}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(f.id)}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </RouteGuard>
  );
}
