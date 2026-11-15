import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWatchHistoryDocId,
  createWatchHistoryEntry,
  recordWatchHistoryEntry,
  removeWatchHistoryEntry,
  mergeWatchHistoryEntries
} from './watchHistory.ts';
import type { MediaItem, WatchHistoryItem } from '../types/entertainment.ts';

const SAMPLE_MOVIE: MediaItem = {
  id: 693134,
  title: 'Dune: Part Two',
  overview: 'Sci-fi epic.',
  mediaType: 'movie',
  releaseDate: '2024-03-01',
  posterPath: 'https://image.tmdb.org/t/p/w780/dune.jpg',
  backdropPath: 'https://image.tmdb.org/t/p/original/dunebg.jpg',
  voteAverage: 8.24,
  voteCount: 5400,
  genres: ['Science Fiction', 'Adventure']
};

const SAMPLE_SERIES: MediaItem = {
  id: 693134, // Same numeric ID as movie to test mediaType separation
  title: 'The Shadow Archive',
  overview: 'Prestige thriller series.',
  mediaType: 'tv',
  firstAirDate: '2025-05-10',
  posterPath: 'https://image.tmdb.org/t/p/w780/tv.jpg',
  backdropPath: '',
  voteAverage: 8.7,
  voteCount: 900,
  genres: ['Mystery', 'Drama']
};

test('buildWatchHistoryDocId generates schema-safe deterministic IDs distinguishing movie vs tv', () => {
  assert.equal(buildWatchHistoryDocId('movie', 693134), 'movie_693134');
  assert.equal(buildWatchHistoryDocId('tv', 693134), 'tv_693134');
});

test('createWatchHistoryEntry enforces Firestore rule field boundaries and clamps ratings/genres', () => {
  const longTitle = 'A'.repeat(260);
  const entry = createWatchHistoryEntry(
    {
      ...SAMPLE_MOVIE,
      title: longTitle,
      voteAverage: 14.5,
      genres: Array.from({ length: 15 }, (_, i) => `Genre-${i}`)
    },
    '2026-11-15T10:00:00.000Z'
  );
  assert.equal(entry.id, 'movie_693134');
  assert.equal(entry.title.length, 200);
  assert.equal(entry.voteAverage, 10);
  assert.equal(entry.genres.length, 10);
  assert.equal(entry.viewedAt, '2026-11-15T10:00:00.000Z');
});

test('recordWatchHistoryEntry deduplicates same mediaType+id, moves re-opened title to top, and separates movie vs tv with matching IDs', () => {
  let history: WatchHistoryItem[] = [];
  history = recordWatchHistoryEntry(history, SAMPLE_MOVIE, '2026-11-15T09:00:00.000Z');
  history = recordWatchHistoryEntry(history, SAMPLE_SERIES, '2026-11-15T09:30:00.000Z');
  assert.equal(history.length, 2);
  assert.equal(history[0].id, 'tv_693134');
  assert.equal(history[1].id, 'movie_693134');

  // Re-open SAMPLE_MOVIE later; should bump to top without duplicating
  history = recordWatchHistoryEntry(history, SAMPLE_MOVIE, '2026-11-15T10:15:00.000Z');
  assert.equal(history.length, 2);
  assert.equal(history[0].id, 'movie_693134');
  assert.equal(history[0].viewedAt, '2026-11-15T10:15:00.000Z');
});

test('recordWatchHistoryEntry enforces maxItems cap and removeWatchHistoryEntry removes target entry cleanly', () => {
  let history: WatchHistoryItem[] = [];
  for (let i = 1; i <= 5; i += 1) {
    history = recordWatchHistoryEntry(
      history,
      { ...SAMPLE_MOVIE, id: i, title: `Title ${i}` },
      `2026-11-15T0${i}:00:00.000Z`,
      3
    );
  }
  assert.deepEqual(
    history.map((h) => h.mediaId),
    [5, 4, 3]
  );

  const afterRemove = removeWatchHistoryEntry(history, 'movie_4');
  assert.deepEqual(
    afterRemove.map((h) => h.mediaId),
    [5, 3]
  );
});

test('mergeWatchHistoryEntries combines local and Firestore entries keeping latest viewedAt per title', () => {
  const remote: WatchHistoryItem[] = [
    createWatchHistoryEntry(SAMPLE_MOVIE, '2026-11-15T08:00:00.000Z'),
    createWatchHistoryEntry(SAMPLE_SERIES, '2026-11-15T11:00:00.000Z')
  ];
  const local: WatchHistoryItem[] = [
    createWatchHistoryEntry(SAMPLE_MOVIE, '2026-11-15T12:00:00.000Z')
  ];

  const merged = mergeWatchHistoryEntries(remote, local);
  assert.equal(merged.length, 2);
  assert.equal(merged[0].id, 'movie_693134');
  assert.equal(merged[0].viewedAt, '2026-11-15T12:00:00.000Z');
  assert.equal(merged[1].id, 'tv_693134');
});
