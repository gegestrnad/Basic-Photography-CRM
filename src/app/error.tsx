'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';

/**
 * Route-level error boundary.
 * Catches fatal errors that escape widget-level boundaries.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const setView = useAppStore(s => s.setView);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center">
        <div className="size-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold mb-2">Application Error</h2>
        <p className="text-sm text-muted-foreground mb-1">
          {error.message || 'An unexpected error occurred.'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} size="sm">
            <RefreshCw className="size-4 mr-1" />
            Try Again
          </Button>
          <Button
            onClick={() => { setView('dashboard'); reset(); }}
            variant="outline"
            size="sm"
          >
            <Home className="size-4 mr-1" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
