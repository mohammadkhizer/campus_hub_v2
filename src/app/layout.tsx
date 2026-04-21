
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/auth-context";

import { getSessionAction } from '@/app/actions/auth';

export const metadata: Metadata = {
  title: 'Campus Hub | Academic Excellence Platform',
  description: 'The next-generation LMS for institutional excellence — AI-driven assessments, role-based governance, and scholarly progress tracking.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // SSR Hydration point: Fetch session on the server before client paints
  const session = await getSessionAction() as any;

  return (
    <html lang="en">
      <head>
        {/* Fraunces — distinctive optical-size variable serif for headlines */}
        {/* JetBrains Mono — premium monospace for UI/body text */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-background min-h-screen">
        <AuthProvider initialProfile={session}>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
