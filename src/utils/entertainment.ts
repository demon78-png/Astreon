import { MediaItem, FilterState, UserReview } from '../types/entertainment';

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

/**
 * Filter an array of MediaItems based on FilterState criteria
 */
export function filterMedia(items: MediaItem[], filter: Partial<FilterState>): MediaItem[] {
  return items.filter((item) => {
    // Media type filter
    if (filter.type && filter.type !== 'all' && item.mediaType !== filter.type) {
      return false;
    }

    // Genre filter
    if (filter.genre && filter.genre !== 'All' && filter.genre !== '') {
      if (!item.genres || !item.genres.some((g) => g.toLowerCase() === filter.genre?.toLowerCase())) {
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
  watchlistGenreCounts: Record<string, number> = {}
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

  // Watchlist affinity (+10 points per genre occurrence in watchlist)
  if (item.genres) {
    for (const g of item.genres) {
      if (watchlistGenreCounts[g]) {
        score += Math.min(watchlistGenreCounts[g] * 10, 30);
      }
    }
  }

  return Math.round(score);
}

/**
 * Calculate ASTREON community aggregate ratings
 */
export function calculateCommunityRating(reviews: UserReview[]): {
  average: number;
  count: number;
  formatted: string;
} {
  const published = reviews.filter((r) => r.status === 'published');
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
