'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getT, type Lang, type Translations } from './i18n'

const COOKIE_KEY = 'lang'
const DEFAULT_LANG: Lang = 'tr'

interface LangContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: Translations
}

const LangContext = createContext<LangContextValue>({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: getT(DEFAULT_LANG),
})

export function LangProvider({ children, initialLang }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang ?? DEFAULT_LANG)

  useEffect(() => {
    // Sync from cookie on mount (in case server and client differ)
    const cookieLang = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${COOKIE_KEY}=`))
      ?.split('=')[1] as Lang | undefined
    if (cookieLang && (cookieLang === 'tr' || cookieLang === 'en')) {
      setLangState(cookieLang)
    }
  }, [])

  function setLang(next: Lang) {
    setLangState(next)
    // Persist to cookie (1 year)
    document.cookie = `${COOKIE_KEY}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: getT(lang) }}>
      {children}
    </LangContext.Provider>
  )
}

export function useT(): Translations {
  return useContext(LangContext).t
}

export function useLang(): { lang: Lang; setLang: (l: Lang) => void } {
  const { lang, setLang } = useContext(LangContext)
  return { lang, setLang }
}
