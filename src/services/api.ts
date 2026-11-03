import { MediaItem, NewsArticle, UserReview, FilterState, AdminAuditLog } from '../types/entertainment';
import { SEED_MEDIA, SEED_NEWS, SEED_REVIEWS, SEED_AUDIT_LOGS } from '../data/seedData';
import { filterMedia, sortMedia } from '../utils/entertainment';

export async function getFeaturedMedia(): Promise<MediaItem> {
  try {
    const res = await fetch('/api/tmdb/featured');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[ASTREON] API getFeaturedMedia fallback:', e);
  }
  return SEED_MEDIA[0];
}

export async function setFeaturedMedia(id: number, actor?: string): Promise<boolean> {
  try {
    const res = await fetch('/api/tmdb/featured', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, actor })
    });
    return res.ok;
  } catch (e) {
    console.warn('[ASTREON] API setFeaturedMedia error:', e);
    return false;
  }
}

export async function getDiscoverMedia(filters: Partial<FilterState> = {}): Promise<{ results: MediaItem[]; total: number }> {
  try {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.genre) params.set('genre', filters.genre);
    if (filters.year) params.set('year', filters.year);
    if (filters.minRating) params.set('minRating', filters.minRating.toString());
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.searchQuery) params.set('q', filters.searchQuery);

    const res = await fetch(`/api/tmdb/discover?${params.toString()}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[ASTREON] API getDiscoverMedia fallback:', e);
  }

  // Resilient client fallback
  let filtered = filterMedia(SEED_MEDIA, filters);
  filtered = sortMedia(filtered, filters.sortBy);
  return { results: filtered, total: filtered.length };
}

export async function getMediaDetails(mediaType: 'movie' | 'tv', id: number): Promise<MediaItem | null> {
  try {
    const res = await fetch(`/api/tmdb/details/${mediaType}/${id}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[ASTREON] API getMediaDetails fallback:', e);
  }
  const match = SEED_MEDIA.find((m) => m.id === id);
  return match || null;
}

export async function getNewsArticles(): Promise<NewsArticle[]> {
  try {
    const res = await fetch('/api/news');
    if (res.ok) {
      const data = await res.json();
      return data.articles;
    }
  } catch (e) {
    console.warn('[ASTREON] API getNewsArticles fallback:', e);
  }
  return SEED_NEWS;
}

export async function publishNewsArticle(article: Partial<NewsArticle>, actor?: string): Promise<NewsArticle | null> {
  try {
    const res = await fetch('/api/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...article, actor })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[ASTREON] API publishNewsArticle error:', e);
  }
  return null;
}

export async function getReviews(mediaId?: number): Promise<UserReview[]> {
  try {
    const url = mediaId ? `/api/reviews?mediaId=${mediaId}` : '/api/reviews';
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      return data.reviews;
    }
  } catch (e) {
    console.warn('[ASTREON] API getReviews fallback:', e);
  }
  if (mediaId) {
    return SEED_REVIEWS.filter((r) => r.mediaId === mediaId);
  }
  return SEED_REVIEWS;
}

export async function submitReview(review: {
  userId: string;
  userName: string;
  mediaId: number;
  mediaType: 'movie' | 'tv';
  rating: number;
  reviewText: string;
}): Promise<UserReview | null> {
  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    if (res.ok) {
      const data = await res.json();
      return data.review;
    }
  } catch (e) {
    console.warn('[ASTREON] API submitReview error:', e);
  }
  return null;
}

export async function moderateReview(id: string, status: 'published' | 'flagged', actor?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, actor })
    });
    return res.ok;
  } catch (e) {
    console.warn('[ASTREON] API moderateReview error:', e);
    return false;
  }
}

export async function submitContentReport(report: {
  targetType: string;
  targetId: string | number;
  reason: string;
  reporterId?: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    });
    return res.ok;
  } catch (e) {
    console.warn('[ASTREON] API submitContentReport error:', e);
    return false;
  }
}

export async function getAdminMetrics(): Promise<any> {
  try {
    const res = await fetch('/api/admin/metrics');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[ASTREON] API getAdminMetrics fallback:', e);
  }
  return {
    catalogCount: SEED_MEDIA.length,
    moviesCount: SEED_MEDIA.filter((m) => m.mediaType === 'movie').length,
    tvCount: SEED_MEDIA.filter((m) => m.mediaType === 'tv').length,
    totalReviews: SEED_REVIEWS.length,
    flaggedReviews: 0,
    publishedArticles: SEED_NEWS.length,
    featuredTitle: SEED_MEDIA[0].title
  };
}

export async function getAdminAuditLogs(): Promise<AdminAuditLog[]> {
  try {
    const res = await fetch('/api/admin/audit-logs');
    if (res.ok) {
      const data = await res.json();
      return data.logs;
    }
  } catch (e) {
    console.warn('[ASTREON] API getAdminAuditLogs fallback:', e);
  }
  return SEED_AUDIT_LOGS;
}
