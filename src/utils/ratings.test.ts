import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampStarRating,
  starRatingToTenScale,
  getReviewStarValue,
  buildUserReviewDocId,
  buildStarReviewDocument,
  calculateMediaStarStats,
  aggregateStarRatingsByMedia
} from './ratings.ts';
import type { UserReview } from '../types/entertainment.ts';

test('clampStarRating and starRatingToTenScale enforce 1-5 star boundaries', () => {
  assert.equal(clampStarRating(0), 1);
  assert.equal(clampStarRating(-3), 1);
  assert.equal(clampStarRating(6.4), 5);
  assert.equal(clampStarRating(3.6), 4);
  assert.equal(clampStarRating(Number.NaN), 1);

  assert.equal(starRatingToTenScale(1), 2);
  assert.equal(starRatingToTenScale(3), 6);
  assert.equal(starRatingToTenScale(5), 10);
});

test('getReviewStarValue prioritizes explicit starRating and normalizes legacy 10-point scores', () => {
  assert.equal(getReviewStarValue({ rating: 8, starRating: 4 }), 4);
  assert.equal(getReviewStarValue({ rating: 10 }), 5);
  assert.equal(getReviewStarValue({ rating: 9 }), 4.5);
  assert.equal(getReviewStarValue({ rating: 7 }), 3.5);
});

test('buildUserReviewDocId and buildStarReviewDocument produce Firestore-safe payloads', () => {
  const docId = buildUserReviewDocId('tv', 95396, 'uid.abc@123');
  assert.equal(docId, 'rev_tv_95396_uid_abc_123');
  assert.match(docId, /^[a-zA-Z0-9_-]{1,128}$/);

  const doc = buildStarReviewDocument({
    userId: 'user123',
    userName: 'Elena Vance',
    mediaId: 693134,
    mediaType: 'movie',
    starRating: 5,
    reviewText: ''
  });
  assert.equal(doc.id, 'rev_movie_693134_user123');
  assert.equal(doc.starRating, 5);
  assert.equal(doc.rating, 10);
  assert.equal(doc.reviewText, '');
  assert.equal(doc.status, 'published');
});

test('calculateMediaStarStats and aggregateStarRatingsByMedia compute accurate averages and isolate movie vs tv collisions', () => {
  const sampleReviews: UserReview[] = [
    {
      id: 'r1',
      userId: 'u1',
      userName: 'A',
      mediaId: 100,
      mediaType: 'movie',
      rating: 10,
      starRating: 5,
      reviewText: 'Masterpiece',
      status: 'published',
      createdAt: '2026-01-01T00:00:00Z',
      helpfulCount: 2
    },
    {
      id: 'r2',
      userId: 'u2',
      userName: 'B',
      mediaId: 100,
      mediaType: 'movie',
      rating: 8,
      starRating: 4,
      reviewText: '',
      status: 'published',
      createdAt: '2026-01-02T00:00:00Z',
      helpfulCount: 0
    },
    {
      id: 'r3',
      userId: 'u3',
      userName: 'C',
      mediaId: 100,
      mediaType: 'movie',
      rating: 2,
      starRating: 1,
      reviewText: 'Flagged spam',
      status: 'flagged',
      createdAt: '2026-01-03T00:00:00Z',
      helpfulCount: 0
    },
    {
      id: 'r4',
      userId: 'u4',
      userName: 'D',
      mediaId: 100,
      mediaType: 'tv',
      rating: 6,
      starRating: 3,
      reviewText: 'Solid season',
      status: 'published',
      createdAt: '2026-01-04T00:00:00Z',
      helpfulCount: 1
    }
  ];

  const movieStats = calculateMediaStarStats(sampleReviews, 100, 'movie');
  assert.equal(movieStats.count, 2);
  assert.equal(movieStats.average, 4.5);
  assert.equal(movieStats.formatted, '4.5');

  const tvStats = calculateMediaStarStats(sampleReviews, 100, 'tv');
  assert.equal(tvStats.count, 1);
  assert.equal(tvStats.average, 3);
  assert.equal(tvStats.formatted, '3.0');

  const emptyStats = calculateMediaStarStats(sampleReviews, 999, 'movie');
  assert.equal(emptyStats.count, 0);
  assert.equal(emptyStats.formatted, 'NR');

  const map = aggregateStarRatingsByMedia(sampleReviews);
  assert.deepEqual(map['movie:100'], { average: 4.5, count: 2, formatted: '4.5' });
  assert.deepEqual(map['tv:100'], { average: 3, count: 1, formatted: '3.0' });
});
