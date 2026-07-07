'use client';

import { useAppStore } from '@/lib/store';
import { useLang } from '@/components/language-provider';
import { NAV_ITEMS } from '@/lib/nav-config';
import { cn } from '@/lib/utils';

/**
 * Mobile bottom navigation — fixed bottom bar (below md).
 * Shows 5 slots: the 4 mobile-eligible nav items plus Settings.
 */
export function MobileNav() {
  const view = useAppStore(s => s.view);
  const setView = useAppStore(s => s.setView);
  const { t } = useLang();

  // Mobile shows items flagged mobile:true, then Settings always last
  const mobileItems = NAV_ITEMS.filter(i => i.mobile);
  const settingsItem = NAV_ITEMS.find(i => i.key === 'settings')!;

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="grid grid-cols-5">
        {mobileItems.map(item => {
          const Icon = item.icon;
          const active = view === item.key;
          const label = t[item.labelKey];
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
              {label}
            </button>
          );
        })}
        {/* Settings is always the 5th slot */}
        <button
          onClick={() => setView(settingsItem.key)}
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
            view === settingsItem.key ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <settingsItem.icon className="size-5" />
          {t[settingsItem.labelKey]}
        </button>
      </div>
    </nav>
  );
}
