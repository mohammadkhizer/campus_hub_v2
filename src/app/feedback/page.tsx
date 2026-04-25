"use client";

import { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { RouteGuard } from '@/components/route-guard';
import { useAuth } from '@/context/auth-context';
import { submitFeedback } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Star, Send, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function FeedbackPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const result = await submitFeedback(profile?.id || '', content, rating);
      if (result.success) {
        setSubmitted(true);
        toast({
          title: "Feedback Submitted",
          description: "Thank you for your valuable feedback!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit feedback. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 flex justify-center">
          <Card className="max-w-md w-full text-center p-8 border-2 border-primary/10 shadow-xl">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold mb-2">Thank You!</CardTitle>
            <CardDescription className="text-base mb-8">
              Your feedback has been received and will help us improve the Campus Hub experience.
            </CardDescription>
            <Button asChild className="w-full">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <RouteGuard allowedRole={['student']}>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="text-center mb-10 space-y-2">
            <h1 className="text-4xl font-black tracking-tight text-primary">Share Your Thoughts</h1>
            <p className="text-muted-foreground">Your feedback helps us make Campus Hub better for everyone.</p>
          </div>

          <Card className="shadow-2xl border-none overflow-hidden">
            <div className="h-2 bg-primary" />
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Submit Feedback</CardTitle>
                <CardDescription>How was your experience using the platform?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {rating === 5 ? 'Excellent!' : rating === 4 ? 'Great' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Your Comments</label>
                  <Textarea
                    placeholder="Tell us what you liked or what we can improve..."
                    className="min-h-[150px] resize-none focus-visible:ring-primary"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 p-6 flex justify-between items-center">
                <p className="text-xs text-muted-foreground">Logged in as {profile?.email}</p>
                <Button type="submit" disabled={loading || !content.trim()} className="px-8 font-bold">
                  {loading ? 'Submitting...' : (
                    <>
                      Submit Feedback <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </main>
      </div>
    </RouteGuard>
  );
}
