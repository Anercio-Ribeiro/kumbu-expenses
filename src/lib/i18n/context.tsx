'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type Locale, t as translate, type TranslationKey } from './translations'

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'pt',
  setLocale: () => {},
  t: (key) => key,
})

const STORAGE_KEY = 'kanza-locale'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('pt')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored === 'pt' || stored === 'en') setLocaleState(stored)
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: (key) => translate(locale, key) }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}
