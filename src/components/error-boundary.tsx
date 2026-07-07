'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Label shown in the fallback UI (e.g. "Revenue Chart") */
  label?: string;
  /** Custom fallback render */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Generic React error boundary.
 * Catches render errors in children and shows a graceful fallback
 * instead of unmounting the entire page.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', this.props.label || 'widget', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <AlertTriangle className="size-8 mx-auto mb-3 text-destructive/60" />
          <p className="text-sm font-medium mb-1">
            {this.props.label ? `${this.props.label} failed to load` : 'Something went wrong'}
          </p>
          <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
            {this.state.error.message || 'An unexpected error occurred.'}
          </p>
          <Button size="sm" variant="outline" onClick={this.reset}>
            <RefreshCw className="size-3.5 mr-1" />
            Retry
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Convenience wrapper for dashboard widgets.
 * Uses a compact card-style fallback that fits inside grid layouts.
 */
export function WidgetErrorBoundary({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <ErrorBoundary label={label}>
      {children}
    </ErrorBoundary>
  );
}
