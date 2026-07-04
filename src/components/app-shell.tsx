'use client';

import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Briefcase, Wallet, CheckSquare, Calculator, Settings, Moon, Sun } from 'lucide-react';
import type { ViewKey } from '@/lib/types';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

const NAV_ITEMS: { key: ViewKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'jobs', label: 'Jobs', icon: Briefcase },
  { key: 'payments', label: 'Payments', icon: Wallet },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'wages', label: 'Wages', icon: Calculator },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const view = useAppStore(s => s.view);
  const setView = useAppStore(s => s.setView);
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      {/* ── Desktop Sidebar (md+) ── */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 border-r border-border bg-sidebar">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
          <div className="size-9 rounded-lg bg-primary/15 flex items-center justify-center">
            <Calculator className="size-5 text-primary" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">PhotoTrack</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Photography Tracker</div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full justify-start gap-3"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            Toggle theme
          </Button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 md:ml-60 pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="grid grid-cols-5">
          {NAV_ITEMS.filter(i => i.key !== 'settings').map(item => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </button>
            );
          })}
          <button
            onClick={() => setView('settings')}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
              view === 'settings' ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Settings className="size-5" />
            Settings
          </button>
        </div>
      </nav>
    </div>
  );
}
