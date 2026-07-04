'use client';

import { ThemeProvider } from 'next-themes';
import { QueryProvider } from '@/components/query-provider';
import { AppShell } from '@/components/app-shell';
import { SettingsProvider } from '@/components/settings-provider';
import { LanguageProvider } from '@/components/language-provider';
import { useAppStore } from '@/lib/store';
import { DashboardView } from '@/components/views/dashboard-view';
import { JobsView } from '@/components/views/jobs-view';
import { PaymentsView } from '@/components/views/payments-view';
import { TasksView } from '@/components/views/tasks-view';
import { WagesView } from '@/components/views/wages-view';
import { SettingsView } from '@/components/views/settings-view';

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <LanguageProvider>
        <QueryProvider>
          <SettingsProvider>
            <AppShell>
              <ActiveView />
            </AppShell>
          </SettingsProvider>
        </QueryProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

function ActiveView() {
  const view = useAppStore(s => s.view);
  switch (view) {
    case 'dashboard': return <DashboardView />;
    case 'jobs':      return <JobsView />;
    case 'payments':  return <PaymentsView />;
    case 'tasks':     return <TasksView />;
    case 'wages':     return <WagesView />;
    case 'settings':  return <SettingsView />;
    default:          return <DashboardView />;
  }
}
