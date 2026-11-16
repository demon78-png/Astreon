import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, buildRouteUrl } from './routing.ts';

test('parseRoute resolves canonical views and trailing slashes', () => {
  assert.deepEqual(parseRoute('/', ''), {
    view: 'discover',
    titleId: undefined,
    mediaType: undefined,
    articleSlug: undefined,
    genre: undefined,
    year: undefined,
    minRating: undefined,
    sort: undefined,
    q: undefined
  });
  assert.equal(parseRoute('/movies/', '').view, 'movies');
  assert.equal(parseRoute('/tv', '').view, 'tv');
  assert.equal(parseRoute('/series', '').view, 'tv');
  assert.equal(parseRoute('/shows/', '').view, 'tv');
  assert.equal(parseRoute('/news', '').view, 'news');
  assert.equal(parseRoute('/editorial', '').view, 'news');
  assert.equal(parseRoute('/account', '').view, 'account');
  assert.equal(parseRoute('/unknown-path', '').view, 'discover');
});

test('parseRoute extracts numeric title deep-link and article slug safely', () => {
  const titleRoute = parseRoute('/movies', '?title=693134&type=movie');
  assert.equal(titleRoute.view, 'movies');
  assert.equal(titleRoute.titleId, 693134);
  assert.equal(titleRoute.mediaType, 'movie');

  const invalidTitleRoute = parseRoute('/', '?title=abc&type=invalid');
  assert.equal(invalidTitleRoute.titleId, undefined);
  assert.equal(invalidTitleRoute.mediaType, undefined);

  const newsRoute = parseRoute('/news', '?article=dune-acoustic-architecture');
  assert.equal(newsRoute.view, 'news');
  assert.equal(newsRoute.articleSlug, 'dune-acoustic-architecture');
});

test('parseRoute and buildRouteUrl handle catalog filters cleanly', () => {
  const parsed = parseRoute('/movies', '?genre=Drama&year=2025&minRating=8&sort=vote_average.desc&q=dune');
  assert.equal(parsed.genre, 'Drama');
  assert.equal(parsed.year, '2025');
  assert.equal(parsed.minRating, 8);
  assert.equal(parsed.sort, 'vote_average.desc');
  assert.equal(parsed.q, 'dune');

  assert.equal(
    buildRouteUrl(parsed),
    '/movies?genre=Drama&year=2025&minRating=8&sort=vote_average.desc&q=dune'
  );
  // Default filter values are omitted for clean URLs
  assert.equal(
    buildRouteUrl({ view: 'tv', genre: 'All', year: 'All', sort: 'popularity.desc' }),
    '/tv'
  );
});

test('buildRouteUrl serializes views, title deep-links, and article slugs cleanly', () => {
  assert.equal(buildRouteUrl({ view: 'discover' }), '/');
  assert.equal(buildRouteUrl({ view: 'movies' }), '/movies');
  assert.equal(
    buildRouteUrl({ view: 'discover', titleId: 115959, mediaType: 'tv' }),
    '/?title=115959&type=tv'
  );
  assert.equal(
    buildRouteUrl({ view: 'news', articleSlug: 'prestige-tv-2025' }),
    '/news?article=prestige-tv-2025'
  );
});

test('parseRoute and buildRouteUrl handle account subtabs (/watchlist, /favorites, profile)', () => {
  const fav = parseRoute('/favorites', '');
  assert.equal(fav.view, 'account');
  assert.equal(fav.accountTab, 'favorites');
  assert.equal(buildRouteUrl(fav), '/favorites');

  const wl = parseRoute('/watchlist', '');
  assert.equal(wl.view, 'account');
  assert.equal(wl.accountTab, 'watchlist');
  assert.equal(buildRouteUrl(wl), '/watchlist');

  const hist = parseRoute('/history', '');
  assert.equal(hist.view, 'account');
  assert.equal(hist.accountTab, 'history');
  assert.equal(buildRouteUrl(hist), '/history');

  const histQuery = parseRoute('/account', '?tab=history');
  assert.equal(histQuery.view, 'account');
  assert.equal(histQuery.accountTab, 'history');

  const prof = parseRoute('/account', '?tab=profile');
  assert.equal(prof.view, 'account');
  assert.equal(prof.accountTab, 'profile');
  assert.equal(buildRouteUrl(prof), '/account?tab=profile');

  const cols = parseRoute('/collections', '');
  assert.equal(cols.view, 'account');
  assert.equal(cols.accountTab, 'collections');
  assert.equal(buildRouteUrl(cols), '/collections');

  const sharedList = parseRoute('/list', '?id=col_weekend_99');
  assert.equal(sharedList.view, 'list');
  assert.equal(sharedList.collectionId, 'col_weekend_99');
  assert.equal(buildRouteUrl(sharedList), '/list?id=col_weekend_99');
});

