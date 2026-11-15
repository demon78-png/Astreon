import type { MediaItem, NewsArticle } from '../types/entertainment.ts';
import type { SupportedLocale } from '../utils/i18n.ts';
import { LOCALIZED_MEDIA_CONTENT, LOCALIZED_NEWS_CONTENT } from '../data/localizedContent.ts';

export interface BrowserTranslatorInstance {
  translate(text: string): Promise<string>;
}

export interface BrowserTranslatorApi {
  availability?: (opts: { sourceLanguage: string; targetLanguage: string }) => Promise<string>;
  create: (opts: { sourceLanguage: string; targetLanguage: string }) => Promise<BrowserTranslatorInstance>;
}

const STORAGE_CACHE_KEY = 'astreon_tr_cache_v1';
const memoryCache = new Map<string, string>();
const translatorInstances = new Map<string, Promise<BrowserTranslatorInstance | null>>();

let cacheHydrated = false;

function hydrateCache() {
  if (cacheHydrated) return;
  cacheHydrated = true;
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, string>;
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'string') memoryCache.set(k, v);
    }
  } catch {
    // Ignore storage corruption
  }
}

function persistCache() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const entries = Array.from(memoryCache.entries()).slice(-400);
    window.localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Ignore quota limits
  }
}

export function getNativeBrowserTranslatorApi(
  host: Record<string, any> = typeof globalThis !== 'undefined' ? (globalThis as any) : {}
): BrowserTranslatorApi | null {
  if (host && host.Translator && typeof host.Translator.create === 'function') {
    return host.Translator as BrowserTranslatorApi;
  }
  return null;
}

export async function detectBrowserTranslatorAvailability(
  targetLocale: SupportedLocale,
  host?: Record<string, any>
): Promise<'native-browser-api' | 'localized-pack'> {
  if (targetLocale === 'en') {
    return getNativeBrowserTranslatorApi(host) ? 'native-browser-api' : 'localized-pack';
  }
  const api = getNativeBrowserTranslatorApi(host);
  if (!api) return 'localized-pack';
  if (typeof api.availability === 'function') {
    try {
      const status = await api.availability({
        sourceLanguage: 'en',
        targetLanguage: targetLocale
      });
      if (status && status !== 'unavailable') {
        return 'native-browser-api';
      }
      return 'localized-pack';
    } catch {
      return 'localized-pack';
    }
  }
  return 'native-browser-api';
}

async function getOrCreateTranslator(
  targetLocale: Exclude<SupportedLocale, 'en'>,
  host?: Record<string, any>
): Promise<BrowserTranslatorInstance | null> {
  const api = getNativeBrowserTranslatorApi(host);
  if (!api) return null;

  const key = `en->${targetLocale}`;
  if (!host && translatorInstances.has(key)) {
    return translatorInstances.get(key)!;
  }

  const createPromise = (async () => {
    try {
      if (typeof api.availability === 'function') {
        const avail = await api.availability({
          sourceLanguage: 'en',
          targetLanguage: targetLocale
        });
        if (avail === 'unavailable') return null;
      }
      return await api.create({
        sourceLanguage: 'en',
        targetLanguage: targetLocale
      });
    } catch {
      return null;
    }
  })();

  if (!host) {
    translatorInstances.set(key, createPromise);
  }
  return createPromise;
}

export async function translateTextWithBrowser(
  text: string,
  targetLocale: SupportedLocale,
  host?: Record<string, any>
): Promise<string> {
  if (!text || !text.trim() || targetLocale === 'en') {
    return text;
  }

  hydrateCache();
  const cacheKey = `${targetLocale}:${text}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const translator = await getOrCreateTranslator(targetLocale, host);
  if (translator) {
    try {
      const translated = await translator.translate(text);
      if (translated && translated.trim()) {
        memoryCache.set(cacheKey, translated);
        persistCache();
        return translated;
      }
    } catch {
      // Fall back safely to source text
    }
  }

  return text;
}

export function getSeedLocalizedMediaSync(
  item: MediaItem,
  locale: SupportedLocale
): MediaItem {
  if (locale === 'en') return item;
  const localized = LOCALIZED_MEDIA_CONTENT[locale]?.[item.id];
  if (!localized) return item;
  return {
    ...item,
    title: localized.title || item.title,
    overview: localized.overview || item.overview,
    tagline: localized.tagline || item.tagline
  };
}

export function getSeedLocalizedArticleSync(
  article: NewsArticle,
  locale: SupportedLocale
): NewsArticle {
  if (locale === 'en') return article;
  const localized = LOCALIZED_NEWS_CONTENT[locale]?.[article.id];
  if (!localized) return article;
  return {
    ...article,
    title: localized.title,
    excerpt: localized.excerpt,
    body: localized.body,
    category: localized.category as NewsArticle['category'],
    readTime: localized.readTime
  };
}

export async function localizeMediaItem(
  item: MediaItem,
  locale: SupportedLocale,
  host?: Record<string, any>
): Promise<MediaItem> {
  if (locale === 'en') return item;

  const seedLocalized = LOCALIZED_MEDIA_CONTENT[locale]?.[item.id];
  if (seedLocalized) {
    return {
      ...item,
      title: seedLocalized.title || item.title,
      overview: seedLocalized.overview || item.overview,
      tagline: seedLocalized.tagline || item.tagline
    };
  }

  const translator = await getOrCreateTranslator(locale, host);
  if (!translator) return item;

  const [overview, tagline] = await Promise.all([
    translateTextWithBrowser(item.overview, locale, host),
    item.tagline ? translateTextWithBrowser(item.tagline, locale, host) : Promise.resolve(item.tagline)
  ]);

  return {
    ...item,
    overview,
    tagline
  };
}

export async function localizeNewsArticle(
  article: NewsArticle,
  locale: SupportedLocale,
  host?: Record<string, any>
): Promise<NewsArticle> {
  if (locale === 'en') return article;

  const seedLocalized = LOCALIZED_NEWS_CONTENT[locale]?.[article.id];
  if (seedLocalized) {
    return {
      ...article,
      title: seedLocalized.title,
      excerpt: seedLocalized.excerpt,
      body: seedLocalized.body,
      category: seedLocalized.category as NewsArticle['category'],
      readTime: seedLocalized.readTime
    };
  }

  const translator = await getOrCreateTranslator(locale, host);
  if (!translator) return article;

  const [title, excerpt, body] = await Promise.all([
    translateTextWithBrowser(article.title, locale, host),
    translateTextWithBrowser(article.excerpt, locale, host),
    translateTextWithBrowser(article.body, locale, host)
  ]);

  return {
    ...article,
    title,
    excerpt,
    body
  };
}

export function clearTranslationMemoryCache() {
  memoryCache.clear();
  translatorInstances.clear();
}
