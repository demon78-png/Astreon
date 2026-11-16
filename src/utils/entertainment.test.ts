import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterMedia,
  sortMedia,
  sortReviews,
  findSimilarMedia,
  getScopedStorageKey,
  calculateCommunityRating,
  extractCatalogFacets,
  getPersonalizedRecommendations,
  generateArticleSlug,
  resolveAutoplayTrailersPreference,
  shouldAutoplayCardTrailer,
  buildCardTrailerEmbedUrl,
  getTodayIsoDate,
  isUpcomingReleaseDate,
  getUpcomingMediaItems,
  getMediaKey,
  buildSavedEntryDocId,
  hasMediaEntry
} from './entertainment.ts';
import type { MediaItem, UserReview, WatchlistItem } from '../types/entertainment.ts';

const SAMPLE_MEDIA: MediaItem[] = [
  {
    id: 1,
    title: 'Solaris Echo',
    overview: 'A deep space psychological drama.',
    mediaType: 'movie',
    releaseDate: '2024-04-12',
    posterPath: '/p1.jpg',
    backdropPath: '/b1.jpg',
    voteAverage: 8.6,
    voteCount: 4200,
    genres: ['Science Fiction', 'Drama'],
    cast: [{ id: 10, name: 'Rebecca Ferguson', character: 'Dr. Vance' }],
    similarIds: [3]
  },
  {
    id: 2,
    title: 'Midnight Signal',
    overview: 'Broadcast mystery in a snowy town.',
    mediaType: 'tv',
    firstAirDate: '2023-11-02',
    posterPath: '/p2.jpg',
    backdropPath: '/b2.jpg',
    voteAverage: 7.9,
    voteCount: 1800,
    genres: ['Mystery', 'Thriller']
  },
  {
    id: 3,
    title: 'Orbital Horizon',
    overview: 'Orbital station engineers face solar flare.',
    mediaType: 'movie',
    releaseDate: '2022-08-20',
    posterPath: '/p3.jpg',
    backdropPath: '/b3.jpg',
    voteAverage: 8.1,
    voteCount: 3100,
    genres: ['Science Fiction', 'Adventure']
  },
  {
    id: 4,
    title: 'Alps Chronicle',
    overview: 'Historical mountaineering journey.',
    mediaType: 'movie',
    releaseDate: '2024-01-15',
    posterPath: '/p4.jpg',
    backdropPath: '/b4.jpg',
    voteAverage: 7.2,
    voteCount: 900,
    genres: ['History', 'Drama']
  }
];

const SAMPLE_REVIEWS: UserReview[] = [
  {
    id: 'r1',
    userId: 'u1',
    userName: 'Elena',
    mediaId: 1,
    mediaType: 'movie',
    rating: 7,
    reviewText: 'Measured pacing and stark visuals.',
    status: 'published',
    createdAt: '2025-01-10T10:00:00.000Z',
    helpfulCount: 12
  },
  {
    id: 'r2',
    userId: 'u2',
    userName: 'Marcus',
    mediaId: 1,
    mediaType: 'movie',
    rating: 10,
    reviewText: 'Masterful sound design throughout.',
    status: 'published',
    createdAt: '2025-03-15T10:00:00.000Z',
    helpfulCount: 3
  },
  {
    id: 'r3',
    userId: 'u3',
    userName: 'Nadia',
    mediaId: 1,
    mediaType: 'movie',
    rating: 8,
    reviewText: 'Compelling lead performance.',
    status: 'published',
    createdAt: '2025-02-01T10:00:00.000Z',
    helpfulCount: 25
  }
];

test('filterMedia filters by type, genre, year, minRating, and searchQuery including cast', () => {
  assert.equal(filterMedia(SAMPLE_MEDIA, { type: 'tv' }).length, 1);
  assert.equal(filterMedia(SAMPLE_MEDIA, { genre: 'Science Fiction' }).length, 2);
  assert.equal(filterMedia(SAMPLE_MEDIA, { year: '2024' }).length, 2);
  assert.equal(filterMedia(SAMPLE_MEDIA, { minRating: 8.0 }).length, 2);
  assert.deepEqual(
    filterMedia(SAMPLE_MEDIA, { searchQuery: 'Ferguson' }).map((m) => m.id),
    [1]
  );
});

test('sortMedia orders items deterministically across sort options', () => {
  assert.deepEqual(
    sortMedia(SAMPLE_MEDIA, 'vote_average.desc').map((m) => m.id),
    [1, 3, 2, 4]
  );
  assert.deepEqual(
    sortMedia(SAMPLE_MEDIA, 'title.asc').map((m) => m.id),
    [4, 2, 3, 1]
  );
  assert.deepEqual(
    sortMedia(SAMPLE_MEDIA, 'primary_release_date.desc').map((m) => m.id),
    [1, 4, 2, 3]
  );
});

test('sortReviews sorts by newest, most helpful, and highest rated without mutating input', () => {
  const originalOrder = SAMPLE_REVIEWS.map((r) => r.id);
  assert.deepEqual(
    sortReviews(SAMPLE_REVIEWS, 'newest').map((r) => r.id),
    ['r2', 'r3', 'r1']
  );
  assert.deepEqual(
    sortReviews(SAMPLE_REVIEWS, 'helpful').map((r) => r.id),
    ['r3', 'r1', 'r2']
  );
  assert.deepEqual(
    sortReviews(SAMPLE_REVIEWS, 'rating_desc').map((r) => r.id),
    ['r2', 'r3', 'r1']
  );
  assert.deepEqual(
    SAMPLE_REVIEWS.map((r) => r.id),
    originalOrder
  );
});

test('findSimilarMedia ranks explicit similarIds and shared genres while excluding target', () => {
  const similar = findSimilarMedia(SAMPLE_MEDIA[0], SAMPLE_MEDIA, 2);
  assert.equal(similar.length, 2);
  assert.equal(similar[0].id, 3); // explicit similarId + Science Fiction + movie
  assert.equal(similar.some((m) => m.id === 1), false);
});

test('calculateCommunityRating ignores flagged reviews', () => {
  const stats = calculateCommunityRating([
    ...SAMPLE_REVIEWS,
    {
      ...SAMPLE_REVIEWS[0],
      id: 'flagged-1',
      rating: 1,
      status: 'flagged'
    }
  ]);
  assert.equal(stats.count, 3);
  assert.equal(stats.formatted, '8.3/10');
});

test('getScopedStorageKey isolates signed-in users from guest cache', () => {
  assert.equal(getScopedStorageKey('astreon_watchlist', 'uid-123'), 'astreon_watchlist_uid-123');
  assert.equal(getScopedStorageKey('astreon_watchlist', null), 'astreon_watchlist_guest');
  assert.equal(getScopedStorageKey('astreon_watchlist', undefined), 'astreon_watchlist_guest');
});

test('extractCatalogFacets derives unique sorted genres and descending years', () => {
  const facets = extractCatalogFacets(SAMPLE_MEDIA);
  assert.deepEqual(facets.years, ['2024', '2023', '2022']);
  assert.deepEqual(facets.genres, [
    'Adventure',
    'Drama',
    'History',
    'Mystery',
    'Science Fiction',
    'Thriller'
  ]);
});

test('getPersonalizedRecommendations prioritizes preferred genres and watchlist affinity', () => {
  const mockWatchlist: WatchlistItem[] = [
    {
      id: 'w1',
      mediaId: 99,
      mediaType: 'tv',
      title: 'Mystery Show',
      posterPath: '/w.jpg',
      voteAverage: 8.0,
      genres: ['Mystery', 'Thriller'],
      addedAt: '2025-01-01T00:00:00Z'
    }
  ];
  const ranked = getPersonalizedRecommendations(SAMPLE_MEDIA, ['Mystery', 'Thriller'], mockWatchlist);
  assert.equal(ranked[0].id, 2);
});

test('findSimilarMedia allows a TV show with the same numeric ID as target movie', () => {
  const tvCollision: MediaItem = {
    id: 1,
    title: 'Solaris Series',
    overview: 'Series adaptation.',
    mediaType: 'tv',
    firstAirDate: '2025-01-01',
    posterPath: '/tv.jpg',
    backdropPath: '/tvb.jpg',
    voteAverage: 8.4,
    voteCount: 1500,
    genres: ['Science Fiction', 'Drama']
  };
  const similar = findSimilarMedia(SAMPLE_MEDIA[0], [...SAMPLE_MEDIA, tvCollision], 4);
  assert.equal(similar.some((m) => m.id === 1 && m.mediaType === 'tv'), true);
  assert.equal(similar.some((m) => m.id === 1 && m.mediaType === 'movie'), false);
});

test('generateArticleSlug handles punctuation, diacritics, non-Latin titles, and duplicates', () => {
  assert.equal(generateArticleSlug('Cinéma & Lumière: 2025!'), 'cinema-lumiere-2025');
  assert.equal(generateArticleSlug('???', undefined, 'art-99'), 'art-99');
  assert.equal(
    generateArticleSlug('Dune Review', ['dune-review', 'dune-review-2']),
    'dune-review-3'
  );
});

test('filterMedia maps compound TV and movie genre aliases bidirectionally', () => {
  const mixed: MediaItem[] = [
    ...SAMPLE_MEDIA,
    {
      id: 100,
      title: 'Starbound',
      overview: 'TV sci-fi epic.',
      mediaType: 'tv',
      firstAirDate: '2025-02-01',
      posterPath: '/tv100.jpg',
      backdropPath: '/tv100b.jpg',
      voteAverage: 8.5,
      voteCount: 900,
      genres: ['Sci-Fi & Fantasy', 'Action & Adventure']
    }
  ];

  // Selecting Science Fiction or Action includes TV items tagged Sci-Fi & Fantasy / Action & Adventure
  assert.equal(filterMedia(mixed, { type: 'tv', genre: 'Science Fiction' }).length, 1);
  assert.equal(filterMedia(mixed, { type: 'tv', genre: 'Action' }).length, 1);
  assert.equal(filterMedia(mixed, { type: 'tv', genre: 'Adventure' }).length, 1);
  // Selecting Sci-Fi & Fantasy includes Movie items tagged Science Fiction
  assert.equal(filterMedia(mixed, { type: 'movie', genre: 'Sci-Fi & Fantasy' }).length, 2);
});

test('resolveAutoplayTrailersPreference respects explicit user preference, local fallback, and defaults to true', () => {
  assert.equal(resolveAutoplayTrailersPreference(null, null), true);
  assert.equal(resolveAutoplayTrailersPreference(undefined, 'false'), false);
  assert.equal(resolveAutoplayTrailersPreference(undefined, 'true'), true);
  assert.equal(
    resolveAutoplayTrailersPreference({ playbackPreferences: { autoplayTrailers: false } }, 'true'),
    false
  );
  assert.equal(
    resolveAutoplayTrailersPreference({ playbackPreferences: { autoplayTrailers: true } }, 'false'),
    true
  );
});

test('shouldAutoplayCardTrailer blocks auto-play when data-saving setting is off, offline, unhovered, missing trailer, or reduced motion', () => {
  assert.equal(
    shouldAutoplayCardTrailer({
      autoplayEnabled: true,
      isOnline: true,
      isHovered: true,
      hasTrailer: true,
      prefersReducedMotion: false
    }),
    true
  );
  assert.equal(
    shouldAutoplayCardTrailer({
      autoplayEnabled: false,
      isOnline: true,
      isHovered: true,
      hasTrailer: true
    }),
    false
  );
  assert.equal(
    shouldAutoplayCardTrailer({
      autoplayEnabled: true,
      isOnline: false,
      isHovered: true,
      hasTrailer: true
    }),
    false
  );
  assert.equal(
    shouldAutoplayCardTrailer({
      autoplayEnabled: true,
      isOnline: true,
      isHovered: false,
      hasTrailer: true
    }),
    false
  );
  assert.equal(
    shouldAutoplayCardTrailer({
      autoplayEnabled: true,
      isOnline: true,
      isHovered: true,
      hasTrailer: false
    }),
    false
  );
  assert.equal(
    shouldAutoplayCardTrailer({
      autoplayEnabled: true,
      isOnline: true,
      isHovered: true,
      hasTrailer: true,
      prefersReducedMotion: true
    }),
    false
  );
});

test('buildCardTrailerEmbedUrl formats muted privacy-enhanced embed parameters safely', () => {
  const url = buildCardTrailerEmbedUrl(' Way9NxDvP_k ');
  assert.equal(
    url,
    'https://www.youtube-nocookie.com/embed/Way9NxDvP_k?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=Way9NxDvP_k'
  );
});

test('isUpcomingReleaseDate validates strictly future YYYY-MM-DD dates and rejects invalid or past dates', () => {
  const ref = '2026-11-15';
  assert.equal(isUpcomingReleaseDate('2026-11-16', ref), true);
  assert.equal(isUpcomingReleaseDate('2027-02-01', ref), true);
  assert.equal(isUpcomingReleaseDate('2026-11-15', ref), false);
  assert.equal(isUpcomingReleaseDate('2026-11-14', ref), false);
  assert.equal(isUpcomingReleaseDate('2026-02-30', ref), false);
  assert.equal(isUpcomingReleaseDate('2027', ref), false);
  assert.equal(isUpcomingReleaseDate('', ref), false);
  assert.equal(isUpcomingReleaseDate(null, ref), false);
  assert.match(getTodayIsoDate(new Date('2026-11-15T23:59:59Z')), /^\d{4}-\d{2}-\d{2}$/);
});

test('getUpcomingMediaItems filters future movies and series, deduplicates, and sorts chronologically ascending', () => {
  const ref = '2026-11-15';
  const catalog: MediaItem[] = [
    ...SAMPLE_MEDIA,
    {
      id: 501,
      title: 'Later Series',
      overview: 'Upcoming sci-fi series',
      mediaType: 'tv',
      firstAirDate: '2027-03-10',
      posterPath: '/tv501.jpg',
      backdropPath: '',
      voteAverage: 0,
      voteCount: 0,
      genres: ['Drama']
    },
    {
      id: 502,
      title: 'Sooner Movie',
      overview: 'Upcoming December premiere',
      mediaType: 'movie',
      releaseDate: '2026-12-20',
      posterPath: '/m502.jpg',
      backdropPath: '',
      voteAverage: 0,
      voteCount: 0,
      genres: ['Adventure']
    },
    {
      id: 502,
      title: 'Sooner Movie',
      overview: 'Duplicate entry without poster',
      mediaType: 'movie',
      releaseDate: '2026-12-20',
      posterPath: '',
      backdropPath: '',
      voteAverage: 0,
      voteCount: 0,
      genres: ['Adventure']
    },
    {
      id: 503,
      title: 'Today Release',
      overview: 'Already releasing today',
      mediaType: 'movie',
      releaseDate: '2026-11-15',
      posterPath: '/m503.jpg',
      backdropPath: '',
      voteAverage: 7.5,
      voteCount: 100,
      genres: ['Drama']
    },
    {
      id: 504,
      title: 'January Series',
      overview: 'Winter premiere series',
      mediaType: 'tv',
      firstAirDate: '2027-01-08',
      posterPath: '/tv504.jpg',
      backdropPath: '',
      voteAverage: 0,
      voteCount: 0,
      genres: ['Mystery']
    }
  ];

  const upcoming = getUpcomingMediaItems(catalog, ref);
  assert.deepEqual(
    upcoming.map((m) => `${m.mediaType}:${m.id}`),
    ['movie:502', 'tv:504', 'tv:501']
  );
  assert.equal(upcoming[0].posterPath, '/m502.jpg');
});

test('getPersonalizedRecommendations incorporates watchHistory genre affinity and converts history entries', async () => {
  const { watchHistoryToMediaItems } = await import('./entertainment.ts');
  const history = [
    {
      id: 'movie-999',
      mediaId: 999,
      mediaType: 'movie' as const,
      title: 'Past History Pick',
      posterPath: '/hist.jpg',
      voteAverage: 8.0,
      genres: ['History', 'Drama'],
      viewedAt: '2026-11-14T00:00:00Z'
    },
    {
      id: 'movie-998',
      mediaId: 998,
      mediaType: 'movie' as const,
      title: 'Past History Pick 2',
      posterPath: '/hist2.jpg',
      voteAverage: 7.8,
      genres: ['History', 'Drama'],
      viewedAt: '2026-11-13T00:00:00Z'
    },
    {
      id: 'movie-997',
      mediaId: 997,
      mediaType: 'movie' as const,
      title: 'Past History Pick 3',
      posterPath: '/hist3.jpg',
      voteAverage: 7.7,
      genres: ['History', 'Drama'],
      viewedAt: '2026-11-12T00:00:00Z'
    }
  ];

  // History + Drama affinity boosts History/Drama film above lower-history items when preferredGenres is neutral
  const ranked = getPersonalizedRecommendations(SAMPLE_MEDIA, [], [], history);
  assert.equal(ranked[0].id, 4);

  const converted = watchHistoryToMediaItems(history, SAMPLE_MEDIA);
  assert.equal(converted.length, 3);
  assert.equal(converted[0].mediaType, 'movie');
  assert.equal(converted[0].title, 'Past History Pick');
});

test('getMediaKey, buildSavedEntryDocId, and hasMediaEntry isolate movie vs tv numeric ID collisions', () => {
  assert.equal(getMediaKey(550, 'movie'), 'movie:550');
  assert.equal(getMediaKey(550, 'tv'), 'tv:550');
  assert.equal(buildSavedEntryDocId('wl', 550, 'movie'), 'wl_movie_550');
  assert.equal(buildSavedEntryDocId('fav', 550, 'tv'), 'fav_tv_550');

  const entries = [{ mediaId: 550, mediaType: 'movie' as const }];
  assert.equal(hasMediaEntry(entries, 550, 'movie'), true);
  assert.equal(hasMediaEntry(entries, 550, 'tv'), false);
});

test('calculateCommunityRating filters by optional mediaType when movie and tv share a numeric ID', () => {
  const mixedReviews: UserReview[] = [
    ...SAMPLE_REVIEWS,
    {
      id: 'r-tv-1',
      userId: 'u4',
      userName: 'Sora',
      mediaId: 1,
      mediaType: 'tv',
      rating: 4,
      reviewText: 'Rough pilot.',
      status: 'published',
      createdAt: '2025-04-01T10:00:00.000Z',
      helpfulCount: 1
    }
  ];
  const movieOnly = calculateCommunityRating(mixedReviews, 'movie');
  const tvOnly = calculateCommunityRating(mixedReviews, 'tv');
  assert.equal(movieOnly.count, 3);
  assert.equal(movieOnly.formatted, '8.3/10');
  assert.equal(tvOnly.count, 1);
  assert.equal(tvOnly.formatted, '4.0/10');
});
