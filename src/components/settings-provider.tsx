'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import type { SettingsBundle } from '@/lib/api';
import { settingsApi } from '@/lib/api';
import type { Lists, Staff, WageRule, WageConfig } from '@/lib/types';

// Shared context — list values + wage rules + staff + config cached client-side
// so all forms can populate dropdowns without re-fetching
import { createContext, useContext } from 'react';

interface SettingsCtx {
  lists: Lists | null;
  wageRules: WageRule[];
  staff: Staff[];
  wageConfig: WageConfig | null;
  reload: () => Promise<void>;
  loading: boolean;
}

const Ctx = createContext<SettingsCtx>({
  lists: null,
  wageRules: [],
  staff: [],
  wageConfig: null,
  reload: async () => {},
  loading: true,
});

export function useSettings() {
  return useContext(Ctx);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [bundle, setBundle] = useState<SettingsBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const reloadListsFlag = useAppStore(s => s.reloadListsFlag);

  const reload = async () => {
    setLoading(true);
    try {
      const b = await settingsApi.get();
      setBundle(b);
    } catch (e) {
      console.error('Failed to load settings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [reloadListsFlag]);

  return (
    <Ctx.Provider value={{
      lists: bundle?.lists || null,
      wageRules: bundle?.wageRules || [],
      staff: bundle?.staff || [],
      wageConfig: bundle?.wageConfig || null,
      reload,
      loading,
    }}>
      {children}
    </Ctx.Provider>
  );
}
