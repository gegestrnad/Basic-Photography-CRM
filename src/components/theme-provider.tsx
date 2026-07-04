'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';

export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ThemeInit>{children}</ThemeInit>
    </ThemeProvider>
  );
}

function ThemeInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Ensure dark class is set on first paint
    const isDark = !document.documentElement.classList.contains('light');
    if (isDark) document.documentElement.classList.add('dark');
  }, []);
  return <>{children}</>;
}
