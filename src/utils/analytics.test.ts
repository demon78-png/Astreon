import test from 'node:test';
import assert from 'node:assert/strict';
import {
  trackTitleInteraction,
  trackSearchInteraction,
  trackUserSession,
  computePopularTitles,
  computeTopSearchQueries,
  computeUsageSummary,
  resetUsageTelemetry,
  StorageLike
} from './analytics';
import { SEED_MEDIA, SEED_REVIEWS } from '../data/seedData';

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    }
  };
}

test('trackTitleInteraction increments detail views and trailer plays independently', () => {
  const storage = createMemoryStorage();
  const dune = SEED_MEDIA[0];

  trackTitleInteraction(dune, 'detail_view', storage, '2026-11-13T10:00:00Z');
  trackTitleInteraction(dune, 'detail_view', storage, '2026-11-13T10:05:00Z');
  const updated = trackTitleInteraction(dune, 'trailer_play', storage, '2026-11-13T10:10:00Z');

  assert.equal(updated.titles[String(dune.id)].views, 2);
  assert.equal(updated.titles[String(dune.id)].trailerPlays, 1);
  assert.equal(updated.titles[String(dune.id)].lastViewedAt, '2026-11-13T10:10:00Z');
});

test('trackSearchInteraction normalizes case, aggregates counts, and ignores single-char queries', () => {
  const storage = createMemoryStorage();

  trackSearchInteraction('a', 0, storage);
  trackSearchInteraction('Dune', 4, storage, '2026-11-13T10:00:00Z');
  const afterSecond = trackSearchInteraction('  dune  ', 6, storage, '2026-11-13T10:02:00Z');

  assert.equal(Object.keys(afterSecond.searches).length, 1);
  assert.equal(afterSecond.searches['dune'].count, 2);
  assert.equal(afterSecond.searches['dune'].displayQuery, 'Dune');
  assert.equal(afterSecond.searches['dune'].lastResultCount, 6);
});

test('computePopularTitles ranks viewed/reviewed titles highest and filters by mediaType', () => {
  const storage = createMemoryStorage();
  const targetMovie = SEED_MEDIA.find((m) => m.mediaType === 'movie' && m.id !== SEED_MEDIA[0].id)!;

  for (let i = 0; i < 6; i++) {
    trackTitleInteraction(targetMovie, 'detail_view', storage);
  }
  const telemetry = trackTitleInteraction(targetMovie, 'trailer_play', storage);

  const popularAll = computePopularTitles({
    mediaList: SEED_MEDIA,
    reviews: SEED_REVIEWS,
    telemetry,
    typeFilter: 'all',
    limit: 5
  });

  assert.equal(popularAll.length, 5);
  assert.equal(popularAll[0].mediaId, targetMovie.id);
  assert.equal(popularAll[0].sharePct, 100);

  const popularTv = computePopularTitles({
    mediaList: SEED_MEDIA,
    reviews: SEED_REVIEWS,
    telemetry,
    typeFilter: 'tv',
    limit: 5
  });
  assert.ok(popularTv.every((t) => t.mediaType === 'tv'));
});

test('computeTopSearchQueries merges telemetry and recent searches sorted by frequency', () => {
  const storage = createMemoryStorage();
  trackSearchInteraction('Severance', 3, storage, '2026-11-13T10:00:00Z');
  trackSearchInteraction('Severance', 3, storage, '2026-11-13T10:01:00Z');
  const telemetry = trackSearchInteraction('Oppenheimer', 2, storage, '2026-11-13T10:05:00Z');

  const topQueries = computeTopSearchQueries({
    telemetry,
    recentSearches: ['Severance', 'Andor'],
    limit: 5
  });

  assert.equal(topQueries[0].query, 'Severance');
  assert.equal(topQueries[0].count, 2);
  assert.equal(topQueries[0].sharePct, 100);
  assert.ok(topQueries.some((q) => q.query === 'Andor' && q.count === 1));
});

test('computeUsageSummary and resetUsageTelemetry handle user counts and cleanup cleanly', () => {
  const storage = createMemoryStorage();
  trackUserSession('uid-1', storage);
  trackUserSession('uid-2', storage);
  trackTitleInteraction(SEED_MEDIA[0], 'detail_view', storage);
  const telemetry = trackSearchInteraction('Sci-Fi', 5, storage);

  const summary = computeUsageSummary({
    mediaList: SEED_MEDIA,
    reviews: SEED_REVIEWS,
    telemetry,
    firestoreUserCount: 14,
    userGenreLists: [['Drama', 'Science Fiction'], ['Drama', 'Mystery']]
  });

  assert.equal(summary.userCount, 14);
  assert.equal(summary.totalTitleViews, 1);
  assert.equal(summary.totalSearches, 1);
  assert.equal(summary.topGenres[0].genre, 'Drama');
  assert.equal(summary.topGenres[0].count, 2);

  const cleared = resetUsageTelemetry(storage);
  assert.deepEqual(cleared.titles, {});
  assert.deepEqual(cleared.searches, {});
});
