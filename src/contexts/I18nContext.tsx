import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  SupportedLocale,
  UiTranslationKey,
  LOCALE_CONFIGS,
  getLocaleConfig,
  resolveInitialLocale,
  translateUi,
  mapGenreLabel
} from '../utils/i18n';
import {
  detectBrowserTranslatorAvailability,
  translateTextWithBrowser
} from '../services/translator';

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (next: SupportedLocale) => void;
  toggleLocalized: () => void;
  isLocalized: boolean;
  isTranslating: boolean;
  setIsTranslating: (val: boolean) => void;
  engineMode: 'native-browser-api' | 'localized-pack';
  tmdbLanguage: string;
  t: (key: UiTranslationKey, vars?: Record<string, string | number>) => string;
  tGenre: (genre: string) => string;
  formatDate: (dateStr: string, options?: Intl.DateTimeFormatOptions) => string;
  translateDynamicText: (text: string) => Promise<string>;
}

const LOCALE_STORAGE_KEY = 'astreon_locale';
const LAST_LOCALIZED_STORAGE_KEY = 'astreon_last_localized_locale';

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      return resolveInitialLocale(saved, window.navigator?.language);
    } catch {
      return 'en';
    }
  });

  const [lastLocalized, setLastLocalized] = useState<Exclude<SupportedLocale, 'en'>>(() => {
    if (typeof window === 'undefined') return 'es';
    try {
      const saved = window.localStorage.getItem(LAST_LOCALIZED_STORAGE_KEY);
      if (saved === 'es' || saved === 'fr' || saved === 'de' || saved === 'ja' || saved === 'pt') {
        return saved;
      }
    } catch {}
    return 'es';
  });

  const [engineMode, setEngineMode] = useState<'native-browser-api' | 'localized-pack'>('localized-pack');
  const [isTranslating, setIsTranslating] = useState(false);

  const setLocale = useCallback((next: SupportedLocale) => {
    setLocaleState(next);
    if (next !== 'en') {
      setLastLocalized(next);
      try {
        window.localStorage.setItem(LAST_LOCALIZED_STORAGE_KEY, next);
      } catch {}
    }
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {}
  }, []);

  const toggleLocalized = useCallback(() => {
    if (locale === 'en') {
      setLocale(lastLocalized);
    } else {
      setLocale('en');
    }
  }, [locale, lastLocalized, setLocale]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
    let active = true;
    detectBrowserTranslatorAvailability(locale).then((mode) => {
      if (active) setEngineMode(mode);
    });
    return () => {
      active = false;
    };
  }, [locale]);

  const config = useMemo(() => getLocaleConfig(locale), [locale]);

  const t = useCallback(
    (key: UiTranslationKey, vars?: Record<string, string | number>) => translateUi(locale, key, vars),
    [locale]
  );

  const tGenre = useCallback(
    (genre: string) => mapGenreLabel(genre, locale),
    [locale]
  );

  const formatDate = useCallback(
    (dateStr: string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) => {
      try {
        const trimmed = dateStr.trim();
        const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
        const parsed = isDateOnly ? new Date(`${trimmed}T12:00:00Z`) : new Date(trimmed);
        return new Intl.DateTimeFormat(config.bcp47, {
          ...(isDateOnly ? { timeZone: 'UTC' } : {}),
          ...options
        }).format(parsed);
      } catch {
        return dateStr;
      }
    },
    [config.bcp47]
  );

  const translateDynamicText = useCallback(
    (text: string) => translateTextWithBrowser(text, locale),
    [locale]
  );

  const value: I18nContextValue = {
    locale,
    setLocale,
    toggleLocalized,
    isLocalized: locale !== 'en',
    isTranslating,
    setIsTranslating,
    engineMode,
    tmdbLanguage: config.tmdbLanguage,
    t,
    tGenre,
    formatDate,
    translateDynamicText
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

export { LOCALE_CONFIGS };
