'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service like Sentry
    console.error('Global Error Boundary Caught:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-4 text-center">
          <h2 className="text-3xl font-bold font-heading mb-4 text-red-500">Something went wrong!</h2>
          <p className="text-zinc-400 mb-8 max-w-md">
            A critical error occurred in the application. Our engineering team has been notified.
          </p>
          <Button onClick={() => reset()} className="bg-white text-black hover:bg-zinc-200">
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
