import type { StorageLike } from './analytics.ts';

export const RECENT_SEARCHES_STORAGE_KEY = 'astreon_recent_searches';
export const MAX_RECENT_SEARCHES = 5;

function getDefaultStorage(): StorageLike | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function getRecentSearchesStorageKey(userId?: string): string {
  const cleanId = typeof userId === 'string' ? userId.trim() : '';
  return cleanId ? `${RECENT_SEARCHES_STORAGE_KEY}_${cleanId}` : RECENT_SEARCHES_STORAGE_KEY;
}

export function normalizeRecentSearches(
  rawList: unknown,
  maxItems: number = MAX_RECENT_SEARCHES
): string[] {
  if (!Array.isArray(rawList)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of rawList) {
    if (typeof item !== 'string') continue;
    const clean = item.trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(clean);
    if (normalized.length >= maxItems) break;
  }

  return normalized;
}

export function loadRecentSearches(
  storage: StorageLike | null = getDefaultStorage(),
  maxItems: number = MAX_RECENT_SEARCHES,
  storageKey: string = RECENT_SEARCHES_STORAGE_KEY
): string[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return [];
    return normalizeRecentSearches(JSON.parse(raw), maxItems);
  } catch {
    return [];
  }
}

export function saveRecentSearches(
  searches: string[],
  storage: StorageLike | null = getDefaultStorage(),
  maxItems: number = MAX_RECENT_SEARCHES,
  storageKey: string = RECENT_SEARCHES_STORAGE_KEY
): string[] {
  const normalized = normalizeRecentSearches(searches, maxItems);
  if (storage) {
    try {
      if (normalized.length === 0) {
        storage.removeItem(storageKey);
      } else {
        storage.setItem(storageKey, JSON.stringify(normalized));
      }
    } catch {
      // Ignore storage quota errors
    }
  }
  return normalized;
}

export function addRecentSearch(
  current: string[],
  term: string,
  storage: StorageLike | null = getDefaultStorage(),
  maxItems: number = MAX_RECENT_SEARCHES,
  storageKey: string = RECENT_SEARCHES_STORAGE_KEY
): string[] {
  const cleanTerm = term.trim();
  if (!cleanTerm) return normalizeRecentSearches(current, maxItems);

  const baseList = storage ? loadRecentSearches(storage, maxItems, storageKey) : current;
  const sourceList = baseList.length > 0 ? baseList : current;

  const next = [
    cleanTerm,
    ...sourceList.filter((item) => item.trim().toLowerCase() !== cleanTerm.toLowerCase())
  ];
  return saveRecentSearches(next, storage, maxItems, storageKey);
}

export function removeRecentSearch(
  current: string[],
  term: string,
  storage: StorageLike | null = getDefaultStorage(),
  maxItems: number = MAX_RECENT_SEARCHES,
  storageKey: string = RECENT_SEARCHES_STORAGE_KEY
): string[] {
  const target = term.trim().toLowerCase();
  const next = current.filter((item) => item.trim().toLowerCase() !== target);
  return saveRecentSearches(next, storage, maxItems, storageKey);
}

export function clearRecentSearches(
  storage: StorageLike | null = getDefaultStorage(),
  storageKey: string = RECENT_SEARCHES_STORAGE_KEY
): string[] {
  if (storage) {
    try {
      storage.removeItem(storageKey);
    } catch {}
  }
  return [];
}
