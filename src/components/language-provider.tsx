'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { dictionaries, type Dict, type Lang } from '@/lib/i18n';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const Ctx = createContext<LangCtx>({
  lang: 'en',
  setLang: () => {},
  t: dictionaries.en,
});

const STORAGE_KEY = 'pcm_lang';

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved === 'en' || saved === 'id') return saved;
  } catch {}
  return 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Lazy initializer runs once on the client; SSR falls back to 'en' then hydrates
  const [lang, setLangState] = useState<Lang>(getInitialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  return (
    <Ctx.Provider value={{ lang, setLang, t: dictionaries[lang] }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLang() {
  return useContext(Ctx);
}
