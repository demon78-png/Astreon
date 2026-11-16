import type { MediaItem, MediaType, FilterState, UserReview, WatchlistItem, WatchHistoryItem } from '../types/entertainment.ts';

/**
 * Canonical media-type-scoped key to prevent movie/TV numeric TMDB ID collisions.
 */
export function getMediaKey(mediaId: number, mediaType: MediaType): string {
  return `${mediaType}:${mediaId}`;
}

/**
 * Deterministic Firestore-safe document ID scoped by mediaType and mediaId.
 */
export function buildSavedEntryDocId(
  prefix: 'wl' | 'fav',
  mediaId: number,
  mediaType: MediaType
): string {
  const cleanType: MediaType = mediaType === 'tv' ? 'tv' : 'movie';
  return `${prefix}_${cleanType}_${Math.trunc(Math.abs(mediaId))}`;
}

/**
 * Check whether an entry list contains a matching (mediaId, mediaType) pair.
 */
export function hasMediaEntry(
  entries: ReadonlyArray<{ mediaId: number; mediaType: MediaType }>,
  mediaId: number,
  mediaType: MediaType
): boolean {
  return entries.some((entry) => entry.mediaId === mediaId && entry.mediaType === mediaType);
}

/**
 * Format numeric rating to 1 decimal place with safety checks
 */
export function formatRating(rating?: number | null): string {
  if (rating === undefined || rating === null || isNaN(rating) || rating <= 0) {
    return 'NR';
  }
  return Number(rating).toFixed(1);
}

/**
 * Format runtime minutes into "Xh Ym" notation
 */
export function formatRuntime(minutes?: number | null): string {
  if (!minutes || minutes <= 0) return 'Runtime unavailable';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Extract 4-digit release year from date string (YYYY-MM-DD)
 */
export function formatReleaseYear(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return 'TBA';
  const match = dateStr.match(/^\d{4}/);
  return match ? match[0] : 'TBA';
}

const GENRE_FILTER_ALIASES: Record<string, string[]> = {
  'science fiction': ['science fiction', 'sci-fi & fantasy'],
  fantasy: ['fantasy', 'sci-fi & fantasy'],
  'sci-fi & fantasy': ['sci-fi & fantasy', 'science fiction', 'fantasy'],
  action: ['action', 'action & adventure'],
  adventure: ['adventure', 'action & adventure'],
  'action & adventure': ['action & adventure', 'action', 'adventure'],
  war: ['war', 'war & politics'],
  'war & politics': ['war & politics', 'war']
};

/**
 * Filter an array of MediaItems based on FilterState criteria
 */
export function filterMedia(items: MediaItem[], filter: Partial<FilterState>): MediaItem[] {
  return items.filter((item) => {
    // Media type filter
    if (filter.type && filter.type !== 'all' && item.mediaType !== filter.type) {
      return false;
    }

    // Genre filter (handles movie vs TV compound TMDB genres)
    if (filter.genre && filter.genre !== 'All' && filter.genre !== '') {
      const normalizedFilter = filter.genre.trim().toLowerCase();
      const accepted = GENRE_FILTER_ALIASES[normalizedFilter] || [normalizedFilter];
      if (!item.genres || !item.genres.some((g) => accepted.includes(g.toLowerCase()))) {
        return false;
      }
    }

    // Year filter
    if (filter.year && filter.year !== 'All' && filter.year !== '') {
      const year = formatReleaseYear(item.releaseDate || item.firstAirDate);
      if (year !== filter.year) {
        return false;
      }
    }

    // Min rating filter
    if (filter.minRating !== undefined && filter.minRating > 0) {
      if (item.voteAverage < filter.minRating) {
        return false;
      }
    }

    // Search query filter
    if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
      const q = filter.searchQuery.toLowerCase().trim();
      const inTitle = item.title.toLowerCase().includes(q);
      const inOverview = item.overview.toLowerCase().includes(q);
      const inGenres = item.genres.some((g) => g.toLowerCase().includes(q));
      const inCast = item.cast?.some((c) => c.name.toLowerCase().includes(q)) ?? false;
      if (!inTitle && !inOverview && !inGenres && !inCast) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort media items deterministically
 */
export function sortMedia(
  items: MediaItem[],
  sortBy: FilterState['sortBy'] = 'popularity.desc'
): MediaItem[] {
  const cloned = [...items];
  switch (sortBy) {
    case 'vote_average.desc':
      return cloned.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
    case 'primary_release_date.desc':
      return cloned.sort((a, b) => {
        const dateA = a.releaseDate || a.firstAirDate || '';
        const dateB = b.releaseDate || b.firstAirDate || '';
        return dateB.localeCompare(dateA);
      });
    case 'title.asc':
      return cloned.sort((a, b) => a.title.localeCompare(b.title));
    case 'popularity.desc':
    default:
      // Weight by voteCount * voteAverage
      return cloned.sort((a, b) => {
        const scoreB = (b.voteAverage || 0) * Math.log10(Math.max(b.voteCount || 1, 10));
        const scoreA = (a.voteAverage || 0) * Math.log10(Math.max(a.voteCount || 1, 10));
        return scoreB - scoreA;
      });
  }
}

/**
 * Calculate transparent, rule-based recommendation affinity score
 */
export function calculateRecommendationScore(
  item: MediaItem,
  preferredGenres: string[] = [],
  watchlistGenreCounts: Record<string, number> = {},
  historyGenreCounts: Record<string, number> = {}
): number {
  let score = item.voteAverage * 10; // Baseline TMDB rating (0-100)

  // Explicit user preferred genres add +25 points per match
  if (preferredGenres.length > 0 && item.genres) {
    for (const g of item.genres) {
      if (preferredGenres.includes(g)) {
        score += 25;
      }
    }
  }

  // Watchlist affinity (+10 points per genre occurrence in watchlist, capped at 30)
  if (item.genres) {
    for (const g of item.genres) {
      if (watchlistGenreCounts[g]) {
        score += Math.min(watchlistGenreCounts[g] * 10, 30);
      }
    }
  }

  // Watch History affinity (+8 points per genre occurrence in recent views, capped at 24)
  if (item.genres) {
    for (const g of item.genres) {
      if (historyGenreCounts[g]) {
        score += Math.min(historyGenreCounts[g] * 8, 24);
      }
    }
  }

  return Math.round(score);
}

/**
 * Rank catalog items for a user based on preferred genres, saved watchlist items,
 * and watch history viewing patterns.
 */
export function getPersonalizedRecommendations(
  items: MediaItem[],
  preferredGenres: string[] = ['Science Fiction', 'Drama'],
  watchlist: WatchlistItem[] = [],
  watchHistory: WatchHistoryItem[] = []
): MediaItem[] {
  const watchlistGenreCounts: Record<string, number> = {};
  for (const w of watchlist) {
    for (const g of w.genres || []) {
      watchlistGenreCounts[g] = (watchlistGenreCounts[g] || 0) + 1;
    }
  }

  const historyGenreCounts: Record<string, number> = {};
  for (const h of watchHistory.slice(0, 20)) {
    for (const g of h.genres || []) {
      historyGenreCounts[g] = (historyGenreCounts[g] || 0) + 1;
    }
  }

  return [...items].sort((a, b) => {
    const scoreB = calculateRecommendationScore(
      b,
      preferredGenres,
      watchlistGenreCounts,
      historyGenreCounts
    );
    const scoreA = calculateRecommendationScore(
      a,
      preferredGenres,
      watchlistGenreCounts,
      historyGenreCounts
    );
    return scoreB - scoreA;
  });
}

/**
 * Convert WatchHistoryEntry records into MediaItem objects for homepage "Recently Viewed" rail,
 * enriching from the active catalog when available.
 */
export function watchHistoryToMediaItems(
  history: WatchHistoryItem[],
  catalog: MediaItem[] = [],
  limit: number = 12
): MediaItem[] {
  if (!Array.isArray(history) || history.length === 0) return [];
  const catalogMap = new Map<string, MediaItem>();
  for (const item of catalog) {
    catalogMap.set(`${item.mediaType}:${item.id}`, item);
  }

  return history.slice(0, Math.max(0, limit)).map((entry) => {
    const match = catalogMap.get(`${entry.mediaType}:${entry.mediaId}`);
    if (match) return match;
    return {
      id: entry.mediaId,
      title: entry.title,
      overview: '',
      mediaType: entry.mediaType,
      ...(entry.mediaType === 'tv'
        ? { firstAirDate: entry.releaseDate }
        : { releaseDate: entry.releaseDate }),
      posterPath: entry.posterPath,
      backdropPath: entry.backdropPath || entry.posterPath,
      voteAverage: entry.voteAverage || 0,
      voteCount: 0,
      genres: entry.genres || []
    };
  });
}

/**
 * Derive dynamic genre and release year filter facets from loaded media items
 */
export function extractCatalogFacets(items: MediaItem[]): {
  genres: string[];
  years: string[];
} {
  const genreSet = new Set<string>();
  const yearSet = new Set<string>();

  for (const item of items) {
    for (const g of item.genres || []) {
      if (g && g.trim()) genreSet.add(g.trim());
    }
    const y = formatReleaseYear(item.releaseDate || item.firstAirDate);
    if (/^\d{4}$/.test(y)) {
      yearSet.add(y);
    }
  }

  return {
    genres: Array.from(genreSet).sort((a, b) => a.localeCompare(b)),
    years: Array.from(yearSet).sort((a, b) => b.localeCompare(a))
  };
}

/**
 * Calculate ASTREON community aggregate ratings, optionally scoped by mediaType
 */
export function calculateCommunityRating(
  reviews: UserReview[],
  mediaType?: MediaType
): {
  average: number;
  count: number;
  formatted: string;
} {
  const published = reviews.filter(
    (r) => r.status === 'published' && (!mediaType || !r.mediaType || r.mediaType === mediaType)
  );
  if (published.length === 0) {
    return { average: 0, count: 0, formatted: 'No reviews yet' };
  }
  const sum = published.reduce((acc, r) => acc + r.rating, 0);
  const avg = sum / published.length;
  return {
    average: avg,
    count: published.length,
    formatted: `${avg.toFixed(1)}/10`
  };
}

export type ReviewSortOption = 'newest' | 'helpful' | 'rating_desc';

/**
 * Sort community reviews deterministically
 */
export function sortReviews(
  reviews: UserReview[],
  sortBy: ReviewSortOption = 'newest'
): UserReview[] {
  const cloned = [...reviews];
  switch (sortBy) {
    case 'helpful':
      return cloned.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
    case 'rating_desc':
      return cloned.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'newest':
    default:
      return cloned.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }
}

/**
 * Find similar titles based on explicit similarIds and shared genre overlap
 */
export function findSimilarMedia(
  target: MediaItem,
  catalog: MediaItem[],
  limit: number = 4
): MediaItem[] {
  if (!catalog || catalog.length === 0) return [];
  const targetGenres = new Set((target.genres || []).map((g) => g.toLowerCase()));
  const explicitIds = new Set(target.similarIds || []);

  return catalog
    .filter((candidate) => candidate.id !== target.id || candidate.mediaType !== target.mediaType)
    .map((candidate) => {
      let score = 0;
      if (explicitIds.has(candidate.id)) score += 50;
      if (candidate.mediaType === target.mediaType) score += 10;
      for (const g of candidate.genres || []) {
        if (targetGenres.has(g.toLowerCase())) score += 15;
      }
      score += (candidate.voteAverage || 0);
      return { candidate, score };
    })
    .filter((entry) => entry.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

/**
 * Generate a user-scoped localStorage key to prevent cross-account data bleed
 */
export function getScopedStorageKey(baseKey: string, uid?: string | null): string {
  return uid ? `${baseKey}_${uid}` : `${baseKey}_guest`;
}

/**
 * Generate a URL-safe, non-empty article slug with optional collision deduplication
 */
export function generateArticleSlug(
  title: string,
  existingSlugs?: Iterable<string>,
  fallbackId?: string
): string {
  const normalized = (title || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const fallbackClean = (fallbackId || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  const base = normalized || fallbackClean || `dispatch-${Date.now()}`;

  if (!existingSlugs) return base;

  const taken = new Set(Array.from(existingSlugs, (s) => s.toLowerCase()));
  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

/**
 * Resolve the effective auto-play trailers preference from user profile or local fallback.
 * Defaults to true unless explicitly toggled off for data saving.
 */
export function resolveAutoplayTrailersPreference(
  user?: { playbackPreferences?: { autoplayTrailers?: boolean } } | null,
  savedLocalValue?: string | null
): boolean {
  if (typeof user?.playbackPreferences?.autoplayTrailers === 'boolean') {
    return user.playbackPreferences.autoplayTrailers;
  }
  if (savedLocalValue === 'false') return false;
  if (savedLocalValue === 'true') return true;
  return true;
}

/**
 * Determine whether a media card should auto-play an inline muted trailer preview.
 */
export function shouldAutoplayCardTrailer(options: {
  autoplayEnabled: boolean;
  isOnline: boolean;
  isHovered: boolean;
  hasTrailer: boolean;
  prefersReducedMotion?: boolean;
}): boolean {
  const {
    autoplayEnabled,
    isOnline,
    isHovered,
    hasTrailer,
    prefersReducedMotion = false
  } = options;
  return Boolean(autoplayEnabled && isOnline && isHovered && hasTrailer && !prefersReducedMotion);
}

/**
 * Build a privacy-enhanced muted looping YouTube embed URL for inline media card preview.
 */
export function buildCardTrailerEmbedUrl(videoKey: string): string {
  const safeKey = encodeURIComponent(videoKey.trim());
  return `https://www.youtube-nocookie.com/embed/${safeKey}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${safeKey}`;
}

/**
 * Return current calendar date in ISO YYYY-MM-DD format (UTC-normalized).
 */
export function getTodayIsoDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Check whether a release/first-air date string represents a valid date strictly in the future.
 */
export function isUpcomingReleaseDate(
  dateStr?: string | null,
  referenceDateIso: string = getTodayIsoDate()
): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (!match) return false;
  const isoDay = match[1];
  const [yearStr, monthStr, dayStr] = isoDay.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return false;
  }
  return isoDay > referenceDateIso;
}

/**
 * Filter, deduplicate, and chronologically sort upcoming movies and series
 * with release dates strictly after referenceDateIso.
 */
export function getUpcomingMediaItems(
  items: MediaItem[],
  referenceDateIso: string = getTodayIsoDate(),
  limit: number = 24
): MediaItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  const deduped = new Map<string, MediaItem>();

  for (const item of items) {
    const releaseStr = item.releaseDate || item.firstAirDate;
    if (!isUpcomingReleaseDate(releaseStr, referenceDateIso)) continue;
    const key = `${item.mediaType}:${item.id}`;
    const existing = deduped.get(key);
    if (!existing || (!existing.posterPath && item.posterPath)) {
      deduped.set(key, item);
    }
  }

  return Array.from(deduped.values())
    .sort((a, b) => {
      const dateA = (a.releaseDate || a.firstAirDate || '').slice(0, 10);
      const dateB = (b.releaseDate || b.firstAirDate || '').slice(0, 10);
      const dateCmp = dateA.localeCompare(dateB);
      if (dateCmp !== 0) return dateCmp;
      const popA = (a.voteCount || 0) + (a.voteAverage || 0) * 10;
      const popB = (b.voteCount || 0) + (b.voteAverage || 0) * 10;
      if (popB !== popA) return popB - popA;
      return a.title.localeCompare(b.title);
    })
    .slice(0, Math.max(0, limit));
}


