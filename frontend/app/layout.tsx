import type { Metadata, Viewport } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/use-auth';
import { ErrorBoundary } from '@/components/error-boundary';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
});

export const metadata: Metadata = {
  title: 'SyncScript - Academic Collaboration Platform',
  description:
    'Collaborate on research documents, annotate PDFs, manage citations, and track activity with your research team.',
  keywords: ['research', 'collaboration', 'academic', 'annotation', 'citations', 'vault'],
  authors: [{ name: 'FAST NUCES' }],
  openGraph: {
    title: 'SyncScript - Academic Collaboration Platform',
    description: 'Collaborate on research documents, annotate PDFs, manage citations, and track activity with your research team.',
    type: 'website',
    siteName: 'SyncScript',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SyncScript - Academic Collaboration Platform',
    description: 'Collaborate on research documents, annotate PDFs, manage citations, and track activity with your research team.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </AuthProvider>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
