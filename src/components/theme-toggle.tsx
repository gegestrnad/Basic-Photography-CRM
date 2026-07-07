'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Theme toggle button — switches between dark and light mode.
 * Used in the desktop Sidebar footer.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-full justify-start gap-3"
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      {isDark ? 'Light' : 'Dark'}
    </Button>
  );
}
