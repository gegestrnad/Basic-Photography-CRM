'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryProvider } from '@/components/query-provider';
import { AppShell } from '@/components/app-shell';
import { SettingsProvider } from '@/components/settings-provider';
import { LanguageProvider } from '@/components/language-provider';
import { useAppStore } from '@/lib/store';
import { LoginView } from '@/components/views/login-view';
import { DashboardView } from '@/components/views/dashboard-view';
import { JobsView } from '@/components/views/jobs-view';
import { PaymentsView } from '@/components/views/payments-view';
import { TasksView } from '@/components/views/tasks-view';
import { WagesView } from '@/components/views/wages-view';
import { ClientsView } from '@/components/views/clients-view';
import { SettingsView } from '@/components/views/settings-view';
import { Loader2 } from 'lucide-react';

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <LanguageProvider>
        <QueryProvider>
          <AuthGate>
            <SettingsProvider>
              <AppShell>
                <ActiveView />
              </AppShell>
            </SettingsProvider>
          </AuthGate>
        </QueryProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

/** Checks session on mount, then shows login or app */
function AuthGate({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore(s => s.isAuthenticated);
  const setAuth = useAppStore(s => s.setAuth);

  useEffect(() => {
    checkSession(setAuth);
  }, [setAuth]);

  if (isAuthenticated === null) {
    // Loading state — centered spinner
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAuthenticated) return <LoginView />;
  return <>{children}</>;
}

async function checkSession(setAuth: (auth: boolean, user?: any) => void) {
  try {
    const res = await fetch('/api/auth/session');
    const data = await res.json();
    setAuth(data.authenticated, data.user || null);
  } catch {
    setAuth(false);
  }
}

function ActiveView() {
  const view = useAppStore(s => s.view);
  switch (view) {
    case 'dashboard': return <DashboardView />;
    case 'jobs':      return <JobsView />;
    case 'payments':  return <PaymentsView />;
    case 'tasks':     return <TasksView />;
    case 'wages':     return <WagesView />;
    case 'clients':   return <ClientsView />;
    case 'settings':  return <SettingsView />;
    default:          return <DashboardView />;
  }
}
