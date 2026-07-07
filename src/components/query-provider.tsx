'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AuthenticationError } from '@/lib/api';
import { useAppStore } from '@/lib/store';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // Don't retry 401s — the session is gone, retrying just generates
        // more console noise. The fetchJson helper already calls
        // setAuth(false) on 401, so the AuthGate swaps to the LoginView.
        retry: (failureCount, error) => {
          if (error instanceof AuthenticationError) return false;
          return failureCount < 3;
        },
      },
      mutations: {
        retry: (failureCount, error) => {
          if (error instanceof AuthenticationError) return false;
          return failureCount < 1;
        },
      },
    },
  }));

  // When authentication is lost (sign-out, session expiry), clear the entire
  // query cache so components don't keep firing requests that will 401, and
  // stale data doesn't linger after the LoginView is shown.
  useEffect(() => {
    const unsubscribe = useAppStore.subscribe((state, prev) => {
      if (prev.isAuthenticated && !state.isAuthenticated) {
        client.clear();
      }
    });
    return unsubscribe;
  }, [client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
