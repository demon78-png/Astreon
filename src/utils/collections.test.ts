import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCustomCollection,
  toggleItemInCollection,
  isItemInCollection,
  buildCollectionShareUrl,
  sanitizeCustomCollection
} from './collections.ts';
import type { MediaItem } from '../types/entertainment.ts';

const SAMPLE_MOVIE: MediaItem = {
  id: 693134,
  title: 'Dune: Part Two',
  overview: 'Sci-fi epic.',
  mediaType: 'movie',
  releaseDate: '2024-03-01',
  posterPath: 'https://image.tmdb.org/t/p/w780/poster.jpg',
  backdropPath: 'https://image.tmdb.org/t/p/original/backdrop.jpg',
  voteAverage: 8.2,
  voteCount: 5400,
  genres: ['Science Fiction', 'Adventure']
};

test('createCustomCollection initializes bounded metadata and optional initial item', () => {
  const col = createCustomCollection({
    ownerId: 'user-1',
    ownerName: 'Elena Vance',
    name: 'Weekend Sci-Fi Marathon',
    description: 'Essential cerebral science fiction.',
    initialItem: SAMPLE_MOVIE,
    nowIso: '2026-11-15T10:00:00Z'
  });

  assert.match(col.id, /^col_/);
  assert.equal(col.ownerId, 'user-1');
  assert.equal(col.name, 'Weekend Sci-Fi Marathon');
  assert.equal(col.isPublic, true);
  assert.equal(col.items.length, 1);
  assert.equal(col.items[0].mediaId, 693134);
});

test('toggleItemInCollection adds and removes items cleanly without mutation', () => {
  const empty = createCustomCollection({
    ownerId: 'u1',
    ownerName: 'Elena',
    name: 'Festival Gems'
  });

  const added = toggleItemInCollection(empty, SAMPLE_MOVIE, '2026-11-15T11:00:00Z');
  assert.equal(empty.items.length, 0);
  assert.equal(added.items.length, 1);
  assert.equal(isItemInCollection(added, 693134, 'movie'), true);
  assert.equal(isItemInCollection(added, 693134, 'tv'), false);

  const removed = toggleItemInCollection(added, SAMPLE_MOVIE, '2026-11-15T12:00:00Z');
  assert.equal(removed.items.length, 0);
});

test('sanitizeCustomCollection truncates oversized strings and enforces valid list IDs', () => {
  const dirty = sanitizeCustomCollection({
    id: 'bad/id with spaces',
    ownerId: 'u1',
    ownerName: 'A'.repeat(150),
    name: 'N'.repeat(120),
    description: 'D'.repeat(600),
    isPublic: false,
    items: [],
    createdAt: '2026-11-15T00:00:00Z',
    updatedAt: '2026-11-15T00:00:00Z'
  });

  assert.match(dirty.id, /^[a-zA-Z0-9_-]+$/);
  assert.equal(dirty.ownerName.length, 100);
  assert.equal(dirty.name.length, 80);
  assert.equal(dirty.description.length, 400);
  assert.equal(dirty.isPublic, false);
});

test('buildCollectionShareUrl constructs clean shareable collection URLs', () => {
  assert.equal(
    buildCollectionShareUrl('https://astreon.example', 'col_123'),
    'https://astreon.example/list?id=col_123'
  );
  assert.equal(buildCollectionShareUrl('', 'col_123'), '/list?id=col_123');
});
