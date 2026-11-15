/**
 * ASTREON Entertainment Platform Types
 * Compliant with TMDB API schema specifications and Firestore document models.
 */

export type MediaType = 'movie' | 'tv';

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath?: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface VideoTrailer {
  id: string;
  key: string; // YouTube video key
  name: string;
  site: 'YouTube' | string;
  type: 'Trailer' | 'Teaser' | 'Clip' | 'Featurette';
  official: boolean;
  publishedAt?: string;
}

export interface WatchProvider {
  providerId: number;
  providerName: string;
  logoPath?: string;
  type: 'flatrate' | 'rent' | 'buy' | 'free' | 'ads';
  link?: string;
}

export type WatchAvailabilityGroupKey = 'stream' | 'free' | 'rent' | 'buy';

export interface WatchProviderGroup {
  key: WatchAvailabilityGroupKey;
  providers: WatchProvider[];
}

export interface TvEpisode {
  id: number;
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  overview: string;
  airDate?: string;
  runtime?: number | null;
  stillPath?: string | null;
  voteAverage?: number;
}

export interface TvSeasonDetails {
  id: number;
  seasonNumber: number;
  name: string;
  overview: string;
  airDate?: string;
  posterPath?: string | null;
  episodes: TvEpisode[];
  source?: 'tmdb' | 'catalog';
}

export interface PersonCredit {
  id: number;
  mediaType: MediaType;
  title: string;
  posterPath?: string;
  backdropPath?: string;
  character?: string;
  job?: string;
  releaseDate?: string;
  voteAverage: number;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday?: string | null;
  deathday?: string | null;
  placeOfBirth?: string | null;
  knownForDepartment?: string;
  profilePath?: string | null;
  credits: PersonCredit[];
  source?: 'tmdb' | 'catalog';
}

export interface MediaItem {
  id: number;
  title: string;
  originalTitle?: string;
  overview: string;
  mediaType: MediaType;
  releaseDate?: string; // Movies: YYYY-MM-DD
  firstAirDate?: string; // TV shows: YYYY-MM-DD
  lastAirDate?: string;
  posterPath: string;
  backdropPath: string;
  voteAverage: number; // TMDB rating 0 - 10
  voteCount: number;
  genres: string[];
  genreIds?: number[];
  runtime?: number; // In minutes (for movies)
  episodeRunTime?: number[];
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  status?: string;
  tagline?: string;
  cast?: CastMember[];
  crew?: CrewMember[];
  videos?: VideoTrailer[];
  providers?: WatchProvider[];
  providerRegion?: string;
  similarIds?: number[];
  featured?: boolean;
}

export interface UserReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  mediaId: number;
  mediaType: MediaType;
  rating: number; // 1 to 10 normalized score
  starRating?: number; // 1 to 5 stars
  reviewText: string;
  status: 'published' | 'pending' | 'flagged';
  createdAt: string;
  updatedAt?: string;
  helpfulCount: number;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: 'Curation' | 'Industry' | 'Festival' | 'Spotlight' | 'Deep Dive';
  image: string;
  imageAlt: string;
  author: string;
  authorRole: string;
  readTime: string;
  publishedAt: string;
  status: 'published' | 'draft';
  featured?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  avatar?: string;
  preferredGenres: string[];
  watchRegion?: string;
  notificationPreferences: {
    emailAlerts: boolean;
    newReleases: boolean;
    curatedWeekly: boolean;
  };
  playbackPreferences?: {
    autoplayTrailers: boolean;
  };
  createdAt: string;
  isAdmin?: boolean;
}

export interface WatchlistItem {
  id: string;
  mediaId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string;
  backdropPath?: string;
  voteAverage: number;
  releaseDate?: string;
  genres: string[];
  addedAt: string;
}

export interface FavoriteItem {
  id: string;
  mediaId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string;
  backdropPath?: string;
  voteAverage: number;
  releaseDate?: string;
  genres: string[];
  addedAt: string;
}

export interface WatchHistoryItem {
  id: string;
  mediaId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string;
  backdropPath?: string;
  voteAverage: number;
  releaseDate?: string;
  genres: string[];
  viewedAt: string;
}

export interface CollectionMediaEntry {
  mediaId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string;
  backdropPath?: string;
  voteAverage: number;
  releaseDate?: string;
  genres: string[];
  addedAt: string;
}

export interface CustomCollection {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  description: string;
  isPublic: boolean;
  items: CollectionMediaEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLog {
  id: string;
  actor: string;
  action: string;
  targetType: 'article' | 'review' | 'hero_feature' | 'user' | 'system';
  targetId: string | number;
  timestamp: string;
  details: string;
}

export interface FilterState {
  type: 'all' | 'movie' | 'tv';
  genre: string;
  year: string;
  minRating: number;
  sortBy: 'popularity.desc' | 'vote_average.desc' | 'primary_release_date.desc' | 'title.asc';
  searchQuery: string;
}

