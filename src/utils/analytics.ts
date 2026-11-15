import type { MediaItem, UserReview } from '../types/entertainment';

export const TELEMETRY_STORAGE_KEY = 'astreon_usage_telemetry_v1';

export interface TitleUsageEntry {
  mediaId: number;
  title: string;
  mediaType: 'movie' | 'tv';
  views: number;
  trailerPlays: number;
  lastViewedAt: string;
}

export interface SearchQueryUsageEntry {
  query: string;
  displayQuery: string;
  count: number;
  lastSearchedAt: string;
  lastResultCount: number;
}

export interface UsageTelemetryStore {
  titles: Record<string, TitleUsageEntry>;
  searches: Record<string, SearchQueryUsageEntry>;
  knownUserIds: string[];
  updatedAt: string;
}

export interface PopularTitleStat {
  mediaId: number;
  title: string;
  mediaType: 'movie' | 'tv';
  views: number;
  trailerPlays: number;
  reviewCount: number;
  voteAverage: number;
  engagementScore: number;
  sharePct: number;
}

export interface TopSearchQueryStat {
  query: string;
  count: number;
  lastResultCount: number;
  lastSearchedAt: string;
  sharePct: number;
}

export interface GenreUsageStat {
  genre: string;
  count: number;
  pct: number;
}

export interface UsageSummary {
  userCount: number;
  totalTitleViews: number;
  totalTrailerPlays: number;
  totalSearches: number;
  uniqueSearchTerms: number;
  avgCommunityRating: number;
  topGenres: GenreUsageStat[];
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getDefaultStorage(): StorageLike | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function createEmptyTelemetry(): UsageTelemetryStore {
  return {
    titles: {},
    searches: {},
    knownUserIds: [],
    updatedAt: new Date().toISOString()
  };
}

export function loadUsageTelemetry(storage: StorageLike | null = getDefaultStorage()): UsageTelemetryStore {
  if (!storage) return createEmptyTelemetry();
  try {
    const raw = storage.getItem(TELEMETRY_STORAGE_KEY);
    if (!raw) return createEmptyTelemetry();
    const parsed = JSON.parse(raw) as Partial<UsageTelemetryStore>;
    return {
      titles: parsed.titles && typeof parsed.titles === 'object' ? parsed.titles : {},
      searches: parsed.searches && typeof parsed.searches === 'object' ? parsed.searches : {},
      knownUserIds: Array.isArray(parsed.knownUserIds) ? parsed.knownUserIds : [],
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString()
    };
  } catch {
    return createEmptyTelemetry();
  }
}

function saveUsageTelemetry(store: UsageTelemetryStore, storage: StorageLike | null = getDefaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage quota errors
  }
}

export function resetUsageTelemetry(storage: StorageLike | null = getDefaultStorage()): UsageTelemetryStore {
  const empty = createEmptyTelemetry();
  if (storage) {
    try {
      storage.removeItem(TELEMETRY_STORAGE_KEY);
    } catch {}
  }
  return empty;
}

export function trackTitleInteraction(
  item: Pick<MediaItem, 'id' | 'title' | 'mediaType'>,
  action: 'detail_view' | 'trailer_play' = 'detail_view',
  storage: StorageLike | null = getDefaultStorage(),
  nowIso: string = new Date().toISOString()
): UsageTelemetryStore {
  const store = loadUsageTelemetry(storage);
  const key = String(item.id);
  const existing = store.titles[key] || {
    mediaId: item.id,
    title: item.title,
    mediaType: item.mediaType,
    views: 0,
    trailerPlays: 0,
    lastViewedAt: nowIso
  };

  store.titles[key] = {
    ...existing,
    title: item.title || existing.title,
    mediaType: item.mediaType || existing.mediaType,
    views: existing.views + (action === 'detail_view' ? 1 : 0),
    trailerPlays: existing.trailerPlays + (action === 'trailer_play' ? 1 : 0),
    lastViewedAt: nowIso
  };
  store.updatedAt = nowIso;
  saveUsageTelemetry(store, storage);
  return store;
}

export function trackSearchInteraction(
  rawQuery: string,
  resultCount: number = 0,
  storage: StorageLike | null = getDefaultStorage(),
  nowIso: string = new Date().toISOString()
): UsageTelemetryStore {
  const trimmed = rawQuery.trim();
  if (trimmed.length < 2) {
    return loadUsageTelemetry(storage);
  }

  const normalized = trimmed.toLowerCase();
  const store = loadUsageTelemetry(storage);
  const existing = store.searches[normalized];

  store.searches[normalized] = {
    query: normalized,
    displayQuery: existing?.displayQuery || trimmed,
    count: (existing?.count || 0) + 1,
    lastSearchedAt: nowIso,
    lastResultCount: Math.max(0, resultCount)
  };
  store.updatedAt = nowIso;
  saveUsageTelemetry(store, storage);
  return store;
}

export function trackUserSession(
  uid: string | undefined,
  storage: StorageLike | null = getDefaultStorage()
): UsageTelemetryStore {
  const store = loadUsageTelemetry(storage);
  const id = uid?.trim();
  if (!id) return store;
  if (!store.knownUserIds.includes(id)) {
    store.knownUserIds = [...store.knownUserIds, id].slice(-500);
    store.updatedAt = new Date().toISOString();
    saveUsageTelemetry(store, storage);
  }
  return store;
}

export function computePopularTitles(params: {
  mediaList: MediaItem[];
  reviews: UserReview[];
  telemetry: UsageTelemetryStore;
  typeFilter?: 'all' | 'movie' | 'tv';
  limit?: number;
}): PopularTitleStat[] {
  const { mediaList, reviews, telemetry, typeFilter = 'all', limit = 6 } = params;

  const reviewCountByMedia = new Map<number, number>();
  for (const r of reviews) {
    if (r.status === 'flagged') continue;
    reviewCountByMedia.set(r.mediaId, (reviewCountByMedia.get(r.mediaId) || 0) + 1);
  }

  const byId = new Map<number, MediaItem>();
  for (const m of mediaList) {
    byId.set(m.id, m);
  }

  const candidates: Omit<PopularTitleStat, 'sharePct'>[] = [];

  for (const m of byId.values()) {
    if (typeFilter !== 'all' && m.mediaType !== typeFilter) continue;
    const tStats = telemetry.titles[String(m.id)];
    const views = tStats?.views || 0;
    const trailerPlays = tStats?.trailerPlays || 0;
    const reviewCount = reviewCountByMedia.get(m.id) || 0;
    const voteWeight = Math.round((m.voteAverage || 0) * 10 + Math.min(m.voteCount || 0, 10000) / 500);
    const engagementScore = views * 12 + trailerPlays * 15 + reviewCount * 20 + voteWeight;

    candidates.push({
      mediaId: m.id,
      title: m.title,
      mediaType: m.mediaType,
      views,
      trailerPlays,
      reviewCount,
      voteAverage: m.voteAverage || 0,
      engagementScore
    });
  }

  candidates.sort((a, b) => {
    if (b.engagementScore !== a.engagementScore) return b.engagementScore - a.engagementScore;
    if (b.views !== a.views) return b.views - a.views;
    return b.voteAverage - a.voteAverage;
  });

  const top = candidates.slice(0, limit);
  const maxScore = top.length > 0 ? Math.max(...top.map((t) => t.engagementScore), 1) : 1;

  return top.map((entry) => ({
    ...entry,
    sharePct: Math.max(8, Math.round((entry.engagementScore / maxScore) * 100))
  }));
}

export function computeTopSearchQueries(params: {
  telemetry: UsageTelemetryStore;
  recentSearches?: string[];
  limit?: number;
}): TopSearchQueryStat[] {
  const { telemetry, recentSearches = [], limit = 8 } = params;
  const map = new Map<string, Omit<TopSearchQueryStat, 'sharePct'>>();

  for (const entry of Object.values(telemetry.searches)) {
    map.set(entry.query, {
      query: entry.displayQuery || entry.query,
      count: entry.count,
      lastResultCount: entry.lastResultCount,
      lastSearchedAt: entry.lastSearchedAt
    });
  }

  for (const term of recentSearches) {
    const clean = term.trim();
    if (clean.length < 2) continue;
    const key = clean.toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        query: clean,
        count: 1,
        lastResultCount: 0,
        lastSearchedAt: telemetry.updatedAt
      });
    }
  }

  const list = Array.from(map.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return (b.lastSearchedAt || '').localeCompare(a.lastSearchedAt || '');
  });

  const top = list.slice(0, limit);
  const maxCount = top.length > 0 ? Math.max(...top.map((q) => q.count), 1) : 1;

  return top.map((q) => ({
    ...q,
    sharePct: Math.max(12, Math.round((q.count / maxCount) * 100))
  }));
}

export function computeUsageSummary(params: {
  mediaList: MediaItem[];
  reviews: UserReview[];
  telemetry: UsageTelemetryStore;
  firestoreUserCount?: number | null;
  userGenreLists?: string[][];
}): UsageSummary {
  const { mediaList, reviews, telemetry, firestoreUserCount, userGenreLists = [] } = params;

  const titleEntries = Object.values(telemetry.titles);
  const totalTitleViews = titleEntries.reduce((sum, t) => sum + (t.views || 0), 0);
  const totalTrailerPlays = titleEntries.reduce((sum, t) => sum + (t.trailerPlays || 0), 0);

  const searchEntries = Object.values(telemetry.searches);
  const totalSearches = searchEntries.reduce((sum, s) => sum + (s.count || 0), 0);

  const publishedReviews = reviews.filter((r) => r.status !== 'flagged');
  const avgCommunityRating =
    publishedReviews.length > 0
      ? Number(
          (
            publishedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
            publishedReviews.length
          ).toFixed(1)
        )
      : 0;

  const userCount =
    typeof firestoreUserCount === 'number' && firestoreUserCount > 0
      ? Math.max(firestoreUserCount, telemetry.knownUserIds.length)
      : Math.max(telemetry.knownUserIds.length, 1);

  // Build genre breakdown from Firestore user preferences when present, otherwise catalog genre density
  const genreCounts = new Map<string, number>();
  const sourceGenres =
    userGenreLists.length > 0 ? userGenreLists : mediaList.map((m) => m.genres || []);

  for (const list of sourceGenres) {
    for (const genre of list) {
      if (!genre) continue;
      genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
    }
  }

  const sortedGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxGenreCount = sortedGenres.length > 0 ? Math.max(sortedGenres[0][1], 1) : 1;

  return {
    userCount,
    totalTitleViews,
    totalTrailerPlays,
    totalSearches,
    uniqueSearchTerms: searchEntries.length,
    avgCommunityRating,
    topGenres: sortedGenres.map(([genre, count]) => ({
      genre,
      count,
      pct: Math.round((count / maxGenreCount) * 100)
    }))
  };
}
