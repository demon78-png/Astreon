import type { MediaItem, MediaType, WatchHistoryItem } from '../types/entertainment.ts';

export const MAX_WATCH_HISTORY_ITEMS = 50;

export function buildWatchHistoryDocId(mediaType: MediaType, mediaId: number): string {
  return `${mediaType}_${mediaId}`;
}

export function sanitizeWatchHistoryItem(entry: WatchHistoryItem): WatchHistoryItem {
  const safeRating = Number.isFinite(entry.voteAverage)
    ? Math.min(10, Math.max(0, Math.round(entry.voteAverage * 10) / 10))
    : 0;
  const safeGenres = Array.isArray(entry.genres)
    ? entry.genres
        .filter((g): g is string => typeof g === 'string' && g.trim().length > 0)
        .slice(0, 10)
        .map((g) => g.trim().slice(0, 50))
    : [];
  const safeReleaseDate =
    typeof entry.releaseDate === 'string' && entry.releaseDate.trim()
      ? entry.releaseDate.trim().slice(0, 50)
      : undefined;

  return {
    id: (entry.id || buildWatchHistoryDocId(entry.mediaType, entry.mediaId)).slice(0, 128),
    mediaId: Number(entry.mediaId),
    mediaType: entry.mediaType === 'tv' ? 'tv' : 'movie',
    title: (entry.title || 'Untitled').trim().slice(0, 200) || 'Untitled',
    posterPath: (entry.posterPath || '').slice(0, 500),
    ...(entry.backdropPath ? { backdropPath: entry.backdropPath.slice(0, 500) } : {}),
    voteAverage: safeRating,
    ...(safeReleaseDate ? { releaseDate: safeReleaseDate } : {}),
    genres: safeGenres,
    viewedAt: (entry.viewedAt || new Date().toISOString()).slice(0, 64)
  };
}

export function createWatchHistoryEntry(
  item: MediaItem,
  viewedAt: string = new Date().toISOString()
): WatchHistoryItem {
  return sanitizeWatchHistoryItem({
    id: buildWatchHistoryDocId(item.mediaType, item.id),
    mediaId: item.id,
    mediaType: item.mediaType,
    title: item.title,
    posterPath: item.posterPath || '',
    backdropPath: item.backdropPath || undefined,
    voteAverage: item.voteAverage || 0,
    releaseDate: item.releaseDate || item.firstAirDate,
    genres: item.genres || [],
    viewedAt
  });
}

export function sortWatchHistoryNewestFirst(items: WatchHistoryItem[]): WatchHistoryItem[] {
  return [...items].sort((a, b) => (b.viewedAt || '').localeCompare(a.viewedAt || ''));
}

export function recordWatchHistoryEntry(
  existing: WatchHistoryItem[],
  item: MediaItem,
  viewedAt: string = new Date().toISOString(),
  maxItems: number = MAX_WATCH_HISTORY_ITEMS
): WatchHistoryItem[] {
  if (!item || !Number.isFinite(item.id) || item.id <= 0) {
    return existing;
  }
  const nextEntry = createWatchHistoryEntry(item, viewedAt);
  const filtered = (existing || []).filter(
    (entry) => !(entry.mediaId === nextEntry.mediaId && entry.mediaType === nextEntry.mediaType)
  );
  return sortWatchHistoryNewestFirst([nextEntry, ...filtered]).slice(0, Math.max(1, maxItems));
}

export function removeWatchHistoryEntry(
  existing: WatchHistoryItem[],
  entryId: string
): WatchHistoryItem[] {
  return (existing || []).filter((entry) => entry.id !== entryId);
}

export function mergeWatchHistoryEntries(
  primary: WatchHistoryItem[],
  secondary: WatchHistoryItem[],
  maxItems: number = MAX_WATCH_HISTORY_ITEMS
): WatchHistoryItem[] {
  const byKey = new Map<string, WatchHistoryItem>();

  for (const raw of [...(secondary || []), ...(primary || [])]) {
    if (!raw || !Number.isFinite(raw.mediaId) || raw.mediaId <= 0) continue;
    const sanitized = sanitizeWatchHistoryItem(raw);
    const key = `${sanitized.mediaType}_${sanitized.mediaId}`;
    const prev = byKey.get(key);
    if (!prev || (sanitized.viewedAt || '') >= (prev.viewedAt || '')) {
      byKey.set(key, sanitized);
    }
  }

  return sortWatchHistoryNewestFirst(Array.from(byKey.values())).slice(0, Math.max(1, maxItems));
}
