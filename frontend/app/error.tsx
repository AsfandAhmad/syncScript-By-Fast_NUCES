'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-600 mb-6">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} className="bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
