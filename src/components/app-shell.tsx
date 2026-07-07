'use client';

import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';

/**
 * AppShell — top-level layout composition.
 *
 * Composes three independently-testable pieces:
 *   - <Sidebar />      : desktop left column (md+)
 *   - <main>           : scrollable content area
 *   - <MobileNav />    : mobile bottom bar (below md)
 *
 * Navigation config lives in @/lib/nav-config and is consumed by both
 * Sidebar and MobileNav, so there's a single source of truth.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 md:ml-60 pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
