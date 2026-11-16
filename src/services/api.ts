import {
  MediaItem,
  NewsArticle,
  UserReview,
  FilterState,
  AdminAuditLog,
  TvSeasonDetails,
  PersonDetails
} from '../types/entertainment';
import { SEED_MEDIA, SEED_NEWS, SEED_REVIEWS, SEED_AUDIT_LOGS } from '../data/seedData';
import {
  filterMedia,
  sortMedia,
  generateArticleSlug,
  getUpcomingMediaItems
} from '../utils/entertainment';
import {
  buildStarReviewDocument,
  clampStarRating,
  starRatingToTenScale
} from '../utils/ratings';
import {
  getAuthIdToken,
  fetchFirestoreReviews,
  publishFirestoreReview,
  updateFirestoreReview,
  deleteFirestoreReview,
  moderateFirestoreReview,
  toggleReviewHelpfulInFirestore,
  fetchSiteSettingsFromFirestore,
  updateSiteSettingsInFirestore,
  fetchFirestoreNews,
  publishFirestoreArticle,
  updateFirestoreArticle,
  submitContentReportToFirestore,
  appendAdminAuditLogToFirestore,
  fetchAdminAuditLogsFromFirestore
} from './firebase';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = await getAuthIdToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function getFeaturedMedia(catalog: MediaItem[] = SEED_MEDIA): Promise<MediaItem> {
  try {
    const [settings, res] = await Promise.all([
      fetchSiteSettingsFromFirestore().catch(() => null),
      fetch('/api/tmdb/featured').catch(() => null)
    ]);

    if (settings?.featuredMediaId) {
      const fromCatalog = catalog.find((m) => m.id === settings.featuredMediaId);
      if (fromCatalog) return fromCatalog;
    }

    if (res && res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[ASTREON] API getFeaturedMedia fallback:', e);
  }
  return catalog[0] || SEED_MEDIA[0];
}

export async function setFeaturedMedia(id: number, actor?: string): Promise<boolean> {
  let ok = false;
  try {
    await updateSiteSettingsInFirestore(id);
    await appendAdminAuditLogToFirestore({
      id: `log_${Date.now()}`,
      actor: actor || 'admin@astreon.org',
      action: 'SET_FEATURED_MEDIA',
      targetType: 'hero_feature',
      targetId: String(id),
      timestamp: new Date().toISOString(),
      details: `Updated hero featured media ID to ${id}`
    });
    ok = true;
  } catch (e) {
    console.warn('[ASTREON] Firestore setFeaturedMedia fallback:', e);
  }

  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/tmdb/featured', {
      method: 'POST',
      headers,
      body: JSON.stringify({ id, actor })
    });
    if (res.ok) ok = true;
  } catch (e) {
    console.warn('[ASTREON] API setFeaturedMedia error:', e);
  }
  return ok;
}

export async function getDiscoverMedia(
  filters: Partial<FilterState> = {},
  page: number = 1,
  language: string = 'en-US'
): Promise<{ results: MediaItem[]; total: number; page: number; totalPages: number }> {
  try {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.genre) params.set('genre', filters.genre);
    if (filters.year) params.set('year', filters.year);
    if (filters.minRating) params.set('minRating', filters.minRating.toString());
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.searchQuery) params.set('q', filters.searchQuery);
    params.set('page', String(page));
    if (language && language !== 'en-US') params.set('language', language);

    const res = await fetch(`/api/tmdb/discover?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      return {
        results: data.results || [],
        total: data.total ?? (data.results?.length || 0),
        page: data.page ?? page,
        totalPages: data.totalPages ?? 1
      };
    }
  } catch (e) {
    console.warn('[ASTREON] API getDiscoverMedia fallback:', e);
  }

  let filtered = filterMedia(SEED_MEDIA, filters);
  filtered = sortMedia(filtered, filters.sortBy);
  return {
    results: page === 1 ? filtered : [],
    total: filtered.length,
    page,
    totalPages: 1
  };
}

export async function searchMedia(
  queryText: string,
  type: 'all' | 'movie' | 'tv' = 'all',
  language: string = 'en-US'
): Promise<{ results: MediaItem[]; source: 'tmdb' | 'catalog' }> {
  try {
    const params = new URLSearchParams();
    params.set('q', queryText);
    params.set('type', type);
    if (language && language !== 'en-US') params.set('language', language);
    const res = await fetch(`/api/tmdb/search?${params.toString()}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[ASTREON] API searchMedia fallback:', e);
  }
  const filtered = filterMedia(SEED_MEDIA, { type, searchQuery: queryText });
  return { results: sortMedia(filtered, 'popularity.desc'), source: 'catalog' };
}

export async function fetchTrendingMedia(
  type: 'all' | 'movie' | 'tv' = 'all',
  language: string = 'en-US'
): Promise<MediaItem[]> {
  try {
    const params = new URLSearchParams({ type });
    if (language && language !== 'en-US') params.set('language', language);
    const res = await fetch(`/api/tmdb/trending?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results)) return data.results;
    }
  } catch (e) {
    console.warn('[ASTREON] API fetchTrendingMedia fallback:', e);
  }
  return filterMedia(SEED_MEDIA, { type });
}

export async function getUpcomingMedia(
  language: string = 'en-US',
  type: 'all' | 'movie' | 'tv' = 'all'
): Promise<MediaItem[]> {
  try {
    const params = new URLSearchParams();
    if (type !== 'all') params.set('type', type);
    if (language && language !== 'en-US') params.set('language', language);
    const qs = params.toString();
    const res = await fetch(`/api/tmdb/upcoming${qs ? `?${qs}` : ''}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results)) {
        return data.results;
      }
    }
  } catch (e) {
    console.warn('[ASTREON] API getUpcomingMedia fallback:', e);
  }
  const scoped = type === 'all' ? SEED_MEDIA : SEED_MEDIA.filter((m) => m.mediaType === type);
  return getUpcomingMediaItems(scoped);
}

export async function getMediaDetails(
  mediaType: 'movie' | 'tv',
  id: number,
  language: string = 'en-US',
  region?: string
): Promise<MediaItem | null> {
  try {
    const params = new URLSearchParams();
    if (language && language !== 'en-US') params.set('language', language);
    if (region) params.set('region', region.toUpperCase());
    const qs = params.toString();
    const res = await fetch(`/api/tmdb/details/${mediaType}/${id}${qs ? `?${qs}` : ''}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[ASTREON] API getMediaDetails fallback:', e);
  }
  const match = SEED_MEDIA.find((m) => m.id === id && m.mediaType === mediaType);
  return match || null;
}

export async function getTvSeasonDetails(
  tvId: number,
  seasonNumber: number,
  language: string = 'en-US'
): Promise<TvSeasonDetails | null> {
  try {
    const params = new URLSearchParams();
    if (language && language !== 'en-US') params.set('language', language);
    const qs = params.toString();
    const res = await fetch(`/api/tmdb/tv/${tvId}/season/${seasonNumber}${qs ? `?${qs}` : ''}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[ASTREON] API getTvSeasonDetails fallback:', e);
  }
  return null;
}

export async function getPersonDetails(
  personId: number,
  language: string = 'en-US'
): Promise<PersonDetails | null> {
  try {
    const params = new URLSearchParams();
    if (language && language !== 'en-US') params.set('language', language);
    const qs = params.toString();
    const res = await fetch(`/api/tmdb/person/${personId}${qs ? `?${qs}` : ''}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('[ASTREON] API getPersonDetails fallback:', e);
  }
  return null;
}

export async function getNewsArticles(): Promise<NewsArticle[]> {
  let apiArticles: NewsArticle[] = [];
  let fsArticles: NewsArticle[] = [];

  try {
    const [fsRes, apiRes] = await Promise.all([
      fetchFirestoreNews().catch(() => []),
      fetch('/api/news')
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    ]);
    fsArticles = fsRes || [];
    apiArticles = apiRes?.articles || [];
  } catch (e) {
    console.warn('[ASTREON] API getNewsArticles fallback:', e);
  }

  const byId = new Map<string, NewsArticle>();
  for (const a of [...SEED_NEWS, ...apiArticles, ...fsArticles]) {
    byId.set(a.id, a);
  }
  return Array.from(byId.values()).sort((a, b) =>
    (b.publishedAt || '').localeCompare(a.publishedAt || '')
  );
}

export async function publishNewsArticle(article: Partial<NewsArticle>, actor?: string): Promise<NewsArticle | null> {
  const title = article.title?.trim() || '';
  const body = article.body?.trim() || '';
  if (!title || !body) return null;

  const articleId = `art_${Date.now()}`;
  const slug = generateArticleSlug(title, undefined, articleId);

  const newArticle: NewsArticle = {
    id: articleId,
    slug,
    title,
    excerpt: article.excerpt?.trim() || title,
    body,
    category: article.category || 'Curation',
    image: article.image || 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg',
    imageAlt: article.imageAlt || title,
    author: article.author || 'ASTREON Editorial Board',
    authorRole: 'Contributor',
    readTime: `${Math.max(1, Math.ceil(body.split(' ').length / 200))} min read`,
    publishedAt: new Date().toISOString(),
    status: 'published'
  };

  let persisted = await publishFirestoreArticle(newArticle);
  if (persisted) {
    await appendAdminAuditLogToFirestore({
      id: `log_${Date.now()}`,
      actor: actor || 'admin@astreon.org',
      action: 'PUBLISH_ARTICLE',
      targetType: 'article',
      targetId: newArticle.id,
      timestamp: new Date().toISOString(),
      details: `Published article: "${newArticle.title}"`
    });
  }

  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/news', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...article,
        id: newArticle.id,
        slug: newArticle.slug,
        publishedAt: newArticle.publishedAt,
        actor
      })
    });
    if (res.ok) {
      const apiArticle = await res.json();
      return persisted ? newArticle : apiArticle;
    }
  } catch (e) {
    console.warn('[ASTREON] API publishNewsArticle error:', e);
  }

  return persisted ? newArticle : null;
}

export async function updateNewsArticle(
  existing: NewsArticle,
  updates: Partial<NewsArticle>,
  actor?: string
): Promise<NewsArticle | null> {
  const merged: NewsArticle = {
    ...existing,
    ...updates,
    readTime:
      updates.body && updates.body.trim()
        ? `${Math.max(1, Math.ceil(updates.body.trim().split(/\s+/).length / 200))} min read`
        : existing.readTime
  };

  const fsOk = await updateFirestoreArticle(existing.id, merged);
  if (fsOk) {
    await appendAdminAuditLogToFirestore({
      id: `log_${Date.now()}`,
      actor: actor || 'admin@astreon.org',
      action: updates.status && updates.status !== existing.status ? 'TOGGLE_ARTICLE_STATUS' : 'UPDATE_ARTICLE',
      targetType: 'article',
      targetId: existing.id,
      timestamp: new Date().toISOString(),
      details: `Updated article "${merged.title}" (status: ${merged.status})`
    });
  }

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/news/${encodeURIComponent(existing.id)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      const apiArticle = await res.json();
      return fsOk ? merged : apiArticle;
    }
  } catch (e) {
    console.warn('[ASTREON] API updateNewsArticle error:', e);
  }

  return fsOk ? merged : null;
}

export async function getReviews(
  mediaId?: number,
  mediaType?: 'movie' | 'tv'
): Promise<UserReview[]> {
  let fsReviews: UserReview[] = [];
  let apiReviews: UserReview[] = [];

  try {
    const params = new URLSearchParams();
    if (mediaId) params.set('mediaId', String(mediaId));
    if (mediaType) params.set('mediaType', mediaType);
    const qs = params.toString();
    const url = qs ? `/api/reviews?${qs}` : '/api/reviews';
    const [fsRes, apiRes] = await Promise.all([
      fetchFirestoreReviews(mediaId, mediaType).catch(() => []),
      fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    ]);
    fsReviews = fsRes || [];
    apiReviews = apiRes?.reviews || [];
  } catch (e) {
    console.warn('[ASTREON] API getReviews fallback:', e);
  }

  const seedFiltered = mediaId
    ? SEED_REVIEWS.filter(
        (r) => r.mediaId === mediaId && (!mediaType || !r.mediaType || r.mediaType === mediaType)
      )
    : SEED_REVIEWS;

  const byId = new Map<string, UserReview>();
  for (const r of [...seedFiltered, ...apiReviews, ...fsReviews]) {
    if (mediaType && r.mediaType && r.mediaType !== mediaType) continue;
    byId.set(r.id, { ...r, helpfulCount: r.helpfulCount ?? 0 });
  }
  return Array.from(byId.values()).sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );
}

export async function submitReview(review: {
  userId: string;
  userName: string;
  userAvatar?: string;
  mediaId: number;
  mediaType: 'movie' | 'tv';
  rating?: number;
  starRating?: number;
  reviewText: string;
  existingReview?: UserReview | null;
}): Promise<UserReview | null> {
  const hasStars = typeof review.starRating === 'number' && Number.isFinite(review.starRating);
  const clampedStars = hasStars ? clampStarRating(review.starRating!) : undefined;
  const normalizedTenScale = hasStars
    ? starRatingToTenScale(clampedStars!)
    : Math.min(10, Math.max(1, Number(review.rating ?? 8)));

  if (review.existingReview) {
    return updateReview(review.existingReview, {
      rating: normalizedTenScale,
      ...(clampedStars !== undefined ? { starRating: clampedStars } : {}),
      reviewText: review.reviewText
    });
  }

  const newReview: UserReview =
    clampedStars !== undefined
      ? buildStarReviewDocument({
          userId: review.userId,
          userName: review.userName,
          userAvatar: review.userAvatar,
          mediaId: review.mediaId,
          mediaType: review.mediaType,
          starRating: clampedStars,
          reviewText: review.reviewText,
          status: 'published',
          createdAt: new Date().toISOString(),
          helpfulCount: 0
        })
      : {
          id: `rev_${Date.now()}`,
          userId: review.userId,
          userName: (review.userName || 'ASTREON Member').trim().slice(0, 100) || 'ASTREON Member',
          ...(review.userAvatar ? { userAvatar: review.userAvatar.slice(0, 500) } : {}),
          mediaId: Number(review.mediaId),
          mediaType: review.mediaType,
          rating: normalizedTenScale,
          reviewText: review.reviewText.trim().slice(0, 2000),
          status: 'published',
          createdAt: new Date().toISOString(),
          helpfulCount: 0
        };

  const fsOk = await publishFirestoreReview(newReview);

  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...review,
        id: newReview.id,
        rating: newReview.rating,
        ...(newReview.starRating !== undefined ? { starRating: newReview.starRating } : {}),
        createdAt: newReview.createdAt
      })
    });
    if (res.ok) {
      const data = await res.json();
      return fsOk ? newReview : data.review;
    }
  } catch (e) {
    console.warn('[ASTREON] API submitReview error:', e);
  }
  return fsOk ? newReview : null;
}

export async function updateReview(
  existingReview: UserReview,
  updates: { rating?: number; starRating?: number; reviewText: string }
): Promise<UserReview | null> {
  const hasStars = typeof updates.starRating === 'number' && Number.isFinite(updates.starRating);
  const clampedStars = hasStars ? clampStarRating(updates.starRating!) : undefined;
  const normalizedTenScale = hasStars
    ? starRatingToTenScale(clampedStars!)
    : Math.min(10, Math.max(1, Number(updates.rating ?? existingReview.rating)));

  const updated: UserReview = {
    ...existingReview,
    rating: normalizedTenScale,
    ...(clampedStars !== undefined ? { starRating: clampedStars } : {}),
    reviewText: updates.reviewText.trim().slice(0, 2000),
    updatedAt: new Date().toISOString()
  };

  const fsOk = await updateFirestoreReview(existingReview.id, existingReview, {
    rating: normalizedTenScale,
    ...(clampedStars !== undefined ? { starRating: clampedStars } : {}),
    reviewText: updates.reviewText
  });
  let apiOk = false;

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/reviews/${encodeURIComponent(existingReview.id)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        rating: normalizedTenScale,
        ...(clampedStars !== undefined ? { starRating: clampedStars } : {}),
        reviewText: updates.reviewText
      })
    });
    apiOk = res.ok;
  } catch (e) {
    console.warn('[ASTREON] API updateReview error:', e);
  }

  return fsOk || apiOk ? updated : null;
}

export async function deleteReview(reviewId: string): Promise<boolean> {
  const fsOk = await deleteFirestoreReview(reviewId);
  let apiOk = false;
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
      method: 'DELETE',
      headers
    });
    apiOk = res.ok;
  } catch (e) {
    console.warn('[ASTREON] API deleteReview error:', e);
  }
  return fsOk || apiOk;
}

export async function toggleReviewHelpful(
  reviewId: string,
  userId: string,
  currentlyVoted: boolean
): Promise<{ helpfulCount: number; voted: boolean } | null> {
  const fsResult = await toggleReviewHelpfulInFirestore(reviewId, userId);

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}/helpful`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ delta: currentlyVoted ? -1 : 1 })
    });
    if (fsResult) return fsResult;
    if (res.ok) {
      const data = await res.json();
      return { helpfulCount: data.helpfulCount, voted: !currentlyVoted };
    }
  } catch (e) {
    console.warn('[ASTREON] API toggleReviewHelpful error:', e);
  }

  return fsResult;
}

export async function moderateReview(id: string, status: 'published' | 'flagged', actor?: string): Promise<boolean> {
  let fsOk = await moderateFirestoreReview(id, status);
  if (fsOk) {
    await appendAdminAuditLogToFirestore({
      id: `log_${Date.now()}`,
      actor: actor || 'admin@astreon.org',
      action: 'MODERATE_REVIEW',
      targetType: 'review',
      targetId: id,
      timestamp: new Date().toISOString(),
      details: `Changed review status to ${status}`
    });
  }

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/reviews/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, actor })
    });
    if (res.ok) return true;
  } catch (e) {
    console.warn('[ASTREON] API moderateReview error:', e);
  }
  return fsOk;
}

export async function submitContentReport(report: {
  targetType: 'review' | 'article' | 'user';
  targetId: string | number;
  reason: string;
  reporterId?: string;
}): Promise<boolean> {
  let fsOk = false;
  if (report.reporterId) {
    fsOk = await submitContentReportToFirestore(
      report.reporterId,
      report.targetType,
      String(report.targetId),
      report.reason
    ).catch(() => false);
  }
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers,
      body: JSON.stringify(report)
    });
    return fsOk || res.ok;
  } catch (e) {
    console.warn('[ASTREON] API submitContentReport error:', e);
    return fsOk;
  }
}

export async function getAdminMetrics(): Promise<any> {
  try {
    const headers = await getAuthHeaders();
    if (headers['Authorization']) {
      const res = await fetch('/api/admin/metrics', { headers });
      if (res.ok) {
        return await res.json();
      }
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
  let fsLogs: AdminAuditLog[] = [];
  let apiLogs: AdminAuditLog[] = [];
  try {
    const headers = await getAuthHeaders();
    const [fsRes, apiRes] = await Promise.all([
      fetchAdminAuditLogsFromFirestore().catch(() => []),
      headers['Authorization']
        ? fetch('/api/admin/audit-logs', { headers })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        : Promise.resolve(null)
    ]);
    fsLogs = fsRes || [];
    apiLogs = apiRes?.logs || [];
  } catch (e) {
    console.warn('[ASTREON] API getAdminAuditLogs fallback:', e);
  }

  const byId = new Map<string, AdminAuditLog>();
  for (const log of [...SEED_AUDIT_LOGS, ...apiLogs, ...fsLogs]) {
    byId.set(log.id, log);
  }
  return Array.from(byId.values()).sort((a, b) =>
    (b.timestamp || '').localeCompare(a.timestamp || '')
  );
}

