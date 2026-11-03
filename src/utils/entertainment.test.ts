import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRating,
  formatRuntime,
  formatReleaseYear,
  filterMedia,
  sortMedia,
  calculateRecommendationScore,
  calculateCommunityRating
} from './entertainment';
import { MediaItem, UserReview } from '../types/entertainment';

const mockItems: MediaItem[] = [
  {
    id: 1,
    title: 'Dune: Part Two',
    overview: 'Paul Atreides unites with Chani and Fremen',
    mediaType: 'movie',
    releaseDate: '2024-03-01',
    posterPath: '/path1.jpg',
    backdropPath: '/back1.jpg',
    voteAverage: 8.2,
    voteCount: 5000,
    genres: ['Science Fiction', 'Adventure'],
    runtime: 166
  },
  {
    id: 2,
    title: 'Severance',
    overview: 'Office workers memories are surgically divided',
    mediaType: 'tv',
    firstAirDate: '2022-02-18',
    posterPath: '/path2.jpg',
    backdropPath: '/back2.jpg',
    voteAverage: 8.4,
    voteCount: 1400,
    genres: ['Drama', 'Mystery', 'Science Fiction'],
    numberOfSeasons: 2
  },
  {
    id: 3,
    title: 'Oppenheimer',
    overview: 'The story of J. Robert Oppenheimer and the Manhattan project',
    mediaType: 'movie',
    releaseDate: '2023-07-21',
    posterPath: '/path3.jpg',
    backdropPath: '/back3.jpg',
    voteAverage: 8.1,
    voteCount: 8000,
    genres: ['Drama', 'History'],
    runtime: 180
  }
];

test('formatRating handles valid, zero, and missing ratings', () => {
  assert.equal(formatRating(8.24), '8.2');
  assert.equal(formatRating(9), '9.0');
  assert.equal(formatRating(0), 'NR');
  assert.equal(formatRating(undefined), 'NR');
  assert.equal(formatRating(null), 'NR');
});

test('formatRuntime handles hours and minutes accurately', () => {
  assert.equal(formatRuntime(166), '2h 46m');
  assert.equal(formatRuntime(120), '2h');
  assert.equal(formatRuntime(45), '45m');
  assert.equal(formatRuntime(0), 'Runtime unavailable');
  assert.equal(formatRuntime(null), 'Runtime unavailable');
});

test('formatReleaseYear extracts 4-digit year from ISO date strings', () => {
  assert.equal(formatReleaseYear('2024-03-01'), '2024');
  assert.equal(formatReleaseYear('2022-02-18'), '2022');
  assert.equal(formatReleaseYear(null), 'TBA');
  assert.equal(formatReleaseYear(''), 'TBA');
});

test('filterMedia filters by mediaType accurately', () => {
  const movies = filterMedia(mockItems, { type: 'movie' });
  assert.equal(movies.length, 2);
  assert.ok(movies.every((m) => m.mediaType === 'movie'));

  const tv = filterMedia(mockItems, { type: 'tv' });
  assert.equal(tv.length, 1);
  assert.equal(tv[0].title, 'Severance');
});

test('filterMedia filters by genre', () => {
  const scifi = filterMedia(mockItems, { genre: 'Science Fiction' });
  assert.equal(scifi.length, 2);

  const history = filterMedia(mockItems, { genre: 'History' });
  assert.equal(history.length, 1);
  assert.equal(history[0].title, 'Oppenheimer');
});

test('filterMedia filters by year and minimum rating', () => {
  const filtered = filterMedia(mockItems, { year: '2024', minRating: 8.0 });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].title, 'Dune: Part Two');
});

test('filterMedia performs case-insensitive text search across fields', () => {
  const result1 = filterMedia(mockItems, { searchQuery: 'oppenheimer' });
  assert.equal(result1.length, 1);
  assert.equal(result1[0].title, 'Oppenheimer');

  const result2 = filterMedia(mockItems, { searchQuery: 'fremen' });
  assert.equal(result2.length, 1);
  assert.equal(result2[0].title, 'Dune: Part Two');
});

test('sortMedia sorts correctly by rating and release date', () => {
  const byRating = sortMedia(mockItems, 'vote_average.desc');
  assert.equal(byRating[0].title, 'Severance'); // 8.4
  assert.equal(byRating[1].title, 'Dune: Part Two'); // 8.2
  assert.equal(byRating[2].title, 'Oppenheimer'); // 8.1

  const byDate = sortMedia(mockItems, 'primary_release_date.desc');
  assert.equal(byDate[0].title, 'Dune: Part Two'); // 2024
  assert.equal(byDate[1].title, 'Oppenheimer'); // 2023
  assert.equal(byDate[2].title, 'Severance'); // 2022
});

test('calculateRecommendationScore ranks titles by user genre preferences', () => {
  const item = mockItems[0]; // Dune (Sci-Fi, Adventure)
  const baseScore = calculateRecommendationScore(item, [], {});
  assert.equal(baseScore, 82); // 8.2 * 10

  const preferredScore = calculateRecommendationScore(item, ['Science Fiction'], { Adventure: 2 });
  // Base 82 + 25 (preferred SciFi) + 20 (Adventure x 2) = 127
  assert.equal(preferredScore, 127);
});

test('calculateCommunityRating computes community averages and handles empty list', () => {
  const empty = calculateCommunityRating([]);
  assert.equal(empty.count, 0);
  assert.equal(empty.formatted, 'No reviews yet');

  const mockReviews: UserReview[] = [
    {
      id: 'r1',
      userId: 'u1',
      userName: 'Alice',
      mediaId: 1,
      mediaType: 'movie',
      rating: 10,
      reviewText: 'Masterpiece',
      status: 'published',
      createdAt: '2024-01-01',
      helpfulCount: 5
    },
    {
      id: 'r2',
      userId: 'u2',
      userName: 'Bob',
      mediaId: 1,
      mediaType: 'movie',
      rating: 8,
      reviewText: 'Great film',
      status: 'published',
      createdAt: '2024-01-02',
      helpfulCount: 2
    },
    {
      id: 'r3',
      userId: 'u3',
      userName: 'Charlie',
      mediaId: 1,
      mediaType: 'movie',
      rating: 4,
      reviewText: 'Flagged review',
      status: 'flagged',
      createdAt: '2024-01-03',
      helpfulCount: 0
    }
  ];

  const commRating = calculateCommunityRating(mockReviews);
  assert.equal(commRating.count, 2); // Excludes flagged
  assert.equal(commRating.average, 9.0); // (10 + 8) / 2
  assert.equal(commRating.formatted, '9.0/10');
});
