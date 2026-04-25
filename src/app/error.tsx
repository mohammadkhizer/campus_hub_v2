'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry automatically
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <div className="p-4 bg-destructive/10 rounded-full">
        <AlertCircle className="w-12 h-12 text-destructive" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
        <p className="text-muted-foreground max-w-[500px]">
          We apologize for the inconvenience. An unexpected error has occurred and has been reported to our engineering team.
        </p>
      </div>

      <Button onClick={() => reset()} variant="outline" className="min-w-[120px]">
        Try again
      </Button>
    </div>
  );
}
