import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTmdbImageSrcSet } from './images.ts';

test('buildTmdbImageSrcSet generates responsive poster/backdrop/still/profile sets for TMDB URLs', () => {
  assert.equal(
    buildTmdbImageSrcSet('https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg', 'poster'),
    'https://image.tmdb.org/t/p/w342/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg 342w, https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg 500w, https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg 780w'
  );
  assert.equal(
    buildTmdbImageSrcSet('https://image.tmdb.org/t/p/original/abc.jpg', 'backdrop'),
    'https://image.tmdb.org/t/p/w780/abc.jpg 780w, https://image.tmdb.org/t/p/w1280/abc.jpg 1280w'
  );
  assert.equal(
    buildTmdbImageSrcSet('https://image.tmdb.org/t/p/w185/cast.jpg', 'profile'),
    'https://image.tmdb.org/t/p/w185/cast.jpg 185w, https://image.tmdb.org/t/p/w300/cast.jpg 300w'
  );
});

test('buildTmdbImageSrcSet leaves local assets and non-TMDB URLs untouched by returning undefined', () => {
  assert.equal(buildTmdbImageSrcSet('/assets/images/hero_dune.jpg', 'backdrop'), undefined);
  assert.equal(buildTmdbImageSrcSet('https://images.unsplash.com/photo-123.jpg', 'poster'), undefined);
  assert.equal(buildTmdbImageSrcSet('', 'poster'), undefined);
  assert.equal(buildTmdbImageSrcSet(null, 'poster'), undefined);
});
