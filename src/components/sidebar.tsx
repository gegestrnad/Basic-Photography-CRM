'use client';

import { useAppStore } from '@/lib/store';
import { useLang } from '@/components/language-provider';
import { NAV_ITEMS } from '@/lib/nav-config';
import { ThemeToggle } from '@/components/theme-toggle';
import { Calculator, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Desktop sidebar — fixed left column (md+).
 * Shows app branding, full nav list, theme toggle, and user info + logout in the footer.
 */
export function Sidebar() {
  const view = useAppStore(s => s.view);
  const setView = useAppStore(s => s.setView);
  const authUser = useAppStore(s => s.authUser);
  const setAuth = useAppStore(s => s.setAuth);
  const { t } = useLang();

  async function handleLogout() {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          csrfToken: await fetch('/api/auth/csrf').then(r => r.json()).then(d => d.csrfToken),
          callbackUrl: '/',
          json: 'true',
        }),
      });
      setAuth(false);
      toast.success('Signed out');
    } catch {
      toast.error('Sign out failed');
    }
  }

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 border-r border-border bg-sidebar">
      {/* Branding */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <div className="size-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Calculator className="size-5 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm leading-tight truncate">Photography Client</div>
          <div className="font-bold text-sm leading-tight truncate">Management</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS
          .filter(item => !item.roles || (authUser && item.roles.includes(authUser.role as 'admin' | 'user')))
          .map(item => {
          const Icon = item.icon;
          const active = view === item.key;
          const label = t[item.labelKey];
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
              {label}
            </button>
          );
        })}
      </nav>

      {/* Footer — user info, theme toggle, logout */}
      <div className="p-3 border-t border-border space-y-2">
        {authUser && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/50">
            <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <User className="size-3.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium truncate">{authUser.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{authUser.email}</div>
            </div>
          </div>
        )}
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="size-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
