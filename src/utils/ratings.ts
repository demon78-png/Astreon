import type { MediaType, UserReview } from '../types/entertainment.ts';

export interface MediaStarStats {
  average: number;
  count: number;
  formatted: string;
}

export function clampStarRating(stars: number): number {
  if (!Number.isFinite(stars)) return 1;
  return Math.min(5, Math.max(1, Math.round(stars)));
}

export function starRatingToTenScale(stars: number): number {
  return clampStarRating(stars) * 2;
}

export function getReviewStarValue(review: Pick<UserReview, 'rating' | 'starRating'>): number {
  if (
    typeof review.starRating === 'number' &&
    Number.isFinite(review.starRating) &&
    review.starRating >= 1 &&
    review.starRating <= 5
  ) {
    return Math.round(review.starRating * 10) / 10;
  }
  const tenScale = Number.isFinite(review.rating)
    ? Math.min(10, Math.max(1, Number(review.rating)))
    : 2;
  return Math.round((tenScale / 2) * 10) / 10;
}

export function buildUserReviewDocId(
  mediaType: MediaType,
  mediaId: number,
  userId: string
): string {
  const safeType: MediaType = mediaType === 'tv' ? 'tv' : 'movie';
  const safeMediaId = Math.max(1, Math.floor(Number(mediaId) || 1));
  const safeUid = (userId || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `rev_${safeType}_${safeMediaId}_${safeUid}`.slice(0, 128);
}

export function buildStarReviewDocument(params: {
  id?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  mediaId: number;
  mediaType: MediaType;
  starRating: number;
  reviewText?: string;
  createdAt?: string;
  updatedAt?: string;
  helpfulCount?: number;
  status?: UserReview['status'];
}): UserReview {
  const stars = clampStarRating(params.starRating);
  const safeId = (
    params.id || buildUserReviewDocId(params.mediaType, params.mediaId, params.userId)
  )
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 128);

  return {
    id: safeId,
    userId: params.userId,
    userName: (params.userName || 'ASTREON Member').trim().slice(0, 100) || 'ASTREON Member',
    ...(params.userAvatar ? { userAvatar: params.userAvatar.slice(0, 500) } : {}),
    mediaId: Number(params.mediaId),
    mediaType: params.mediaType === 'tv' ? 'tv' : 'movie',
    rating: starRatingToTenScale(stars),
    starRating: stars,
    reviewText: (params.reviewText || '').trim().slice(0, 2000),
    status: params.status || 'published',
    createdAt: (params.createdAt || new Date().toISOString()).slice(0, 64),
    ...(params.updatedAt ? { updatedAt: params.updatedAt.slice(0, 64) } : {}),
    helpfulCount: Math.max(0, Number(params.helpfulCount || 0))
  };
}

export function calculateMediaStarStats(
  reviews: UserReview[],
  mediaId: number,
  mediaType?: MediaType
): MediaStarStats {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return { average: 0, count: 0, formatted: 'NR' };
  }

  const matching = reviews.filter(
    (r) =>
      r.status === 'published' &&
      r.mediaId === mediaId &&
      (!mediaType || !r.mediaType || r.mediaType === mediaType)
  );

  if (matching.length === 0) {
    return { average: 0, count: 0, formatted: 'NR' };
  }

  const sum = matching.reduce((acc, r) => acc + getReviewStarValue(r), 0);
  const average = Math.round((sum / matching.length) * 10) / 10;

  return {
    average,
    count: matching.length,
    formatted: average.toFixed(1)
  };
}

export function aggregateStarRatingsByMedia(
  reviews: UserReview[]
): Record<string, MediaStarStats> {
  if (!Array.isArray(reviews) || reviews.length === 0) return {};

  const buckets = new Map<string, { sum: number; count: number }>();
  for (const r of reviews) {
    if (r.status !== 'published') continue;
    const mType: MediaType = r.mediaType === 'tv' ? 'tv' : 'movie';
    const key = `${mType}:${r.mediaId}`;
    const existing = buckets.get(key) || { sum: 0, count: 0 };
    existing.sum += getReviewStarValue(r);
    existing.count += 1;
    buckets.set(key, existing);
  }

  const result: Record<string, MediaStarStats> = {};
  for (const [key, bucket] of buckets.entries()) {
    const average = Math.round((bucket.sum / bucket.count) * 10) / 10;
    result[key] = {
      average,
      count: bucket.count,
      formatted: average.toFixed(1)
    };
  }
  return result;
}
