'use client';

import { createContext, useContext, useEffect } from 'react';
import { type Lang, type Messages, getT } from './messages';

interface LanguageContextValue {
  lang: Lang;
  t: Messages;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'tr',
  t: getT('tr'),
});

export function LanguageProvider({
  language,
  children,
}: {
  language: Lang;
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Sync cookie so server components read the correct language on next request
    document.cookie = `app_lang=${language}; path=/; max-age=31536000; SameSite=Lax`;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ lang: language, t: getT(language) }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation(): LanguageContextValue {
  return useContext(LanguageContext);
}
