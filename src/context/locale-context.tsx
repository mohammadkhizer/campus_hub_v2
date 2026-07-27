'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '@/i18n/dictionaries/en.json';
import ur from '@/i18n/dictionaries/ur.json';

export type Locale = 'en' | 'ur';

interface LocaleContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  dir: 'ltr' | 'rtl';
  t: (keyPath: string) => string;
}

const dictionaries: Record<Locale, any> = { en, ur };

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('campus_hub_locale') as Locale;
    if (saved && (saved === 'en' || saved === 'ur')) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('campus_hub_locale', newLocale);
    document.documentElement.dir = newLocale === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLocale;
  };

  useEffect(() => {
    document.documentElement.dir = locale === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale]);

  const t = (keyPath: string): string => {
    const keys = keyPath.split('.');
    let current: any = dictionaries[locale] || dictionaries.en;
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        return keyPath;
      }
    }
    return typeof current === 'string' ? current : keyPath;
  };

  const dir = locale === 'ur' ? 'rtl' : 'ltr';

  return (
    <LocaleContext.Provider value={{ locale, setLocale, dir, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
