'use client';

import { create } from 'zustand';
import type { ViewKey } from '@/lib/types';

interface AppState {
  // ── Navigation ──
  view: ViewKey;
  setView: (v: ViewKey) => void;

  // ── Auth ──
  isAuthenticated: boolean | null; // null = checking, true = logged in, false = not
  authUser: { email: string; name: string; role: string } | null;
  setAuth: (authenticated: boolean, user?: { email: string; name: string; role: string } | null) => void;

  // ── Theme ──
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (t: 'dark' | 'light') => void;

  // ── Settings cache (lists, wage rules, staff) ──
  listsLoaded: boolean;
  reloadListsFlag: number;
  triggerListsReload: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  view: 'dashboard',
  setView: (v) => set({ view: v }),

  isAuthenticated: null,
  authUser: null,
  setAuth: (authenticated, user = null) =>
    set({ isAuthenticated: authenticated, authUser: user }),

  theme: 'dark',
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: next });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next === 'dark');
    }
  },
  setTheme: (t) => {
    set({ theme: t });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', t === 'dark');
    }
  },

  listsLoaded: false,
  reloadListsFlag: 0,
  triggerListsReload: () => set({ reloadListsFlag: get().reloadListsFlag + 1 }),
}));
