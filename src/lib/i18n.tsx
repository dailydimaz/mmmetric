import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import enTranslations from '@/i18n/en';

export type Locale = 'en' | 'id' | 'th' | 'vi' | 'ms' | 'fil';

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LOCALES: LocaleInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'th', name: 'Thai', nativeName: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
];

type TranslationValue = string | Record<string, any>;
type Translations = Record<string, TranslationValue>;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  localeInfo: LocaleInfo;
}

const I18nContext = createContext<I18nContextType | null>(null);

// Lazy-load translations
const translationCache: Partial<Record<Locale, Translations>> = {};

async function loadTranslations(locale: Locale): Promise<Translations> {
  if (translationCache[locale]) return translationCache[locale]!;
  
  const modules: Record<Locale, () => Promise<{ default: Translations }>> = {
    en: () => import('@/i18n/en'),
    id: () => import('@/i18n/id'),
    th: () => import('@/i18n/th'),
    vi: () => import('@/i18n/vi'),
    ms: () => import('@/i18n/ms'),
    fil: () => import('@/i18n/fil'),
  };

  const mod = await modules[locale]();
  translationCache[locale] = mod.default;
  return mod.default;
}

function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('mmmetric_locale');
    if (saved && SUPPORTED_LOCALES.some(l => l.code === saved)) return saved as Locale;
    // Auto-detect from browser
    const browserLang = navigator.language.split('-')[0];
    const match = SUPPORTED_LOCALES.find(l => l.code === browserLang);
    return match?.code || 'en';
  });

  const [translations, setTranslations] = useState<Translations>({});
  const [enFallback, setEnFallback] = useState<Translations>({});

  useEffect(() => {
    loadTranslations('en').then(setEnFallback);
  }, []);

  useEffect(() => {
    loadTranslations(locale).then(setTranslations);
    localStorage.setItem('mmmetric_locale', locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(translations, key) || getNestedValue(enFallback, key) || key;
    
    if (typeof value !== 'string') return key;
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = (value as string).replace(`{{${k}}}`, String(v));
      });
    }
    
    return value as string;
  }, [translations, enFallback]);

  const localeInfo = SUPPORTED_LOCALES.find(l => l.code === locale) || SUPPORTED_LOCALES[0];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, localeInfo }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
