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
  logoPath: string;
  type: 'flatrate' | 'rent' | 'buy';
  link?: string;
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
  rating: number; // 1 to 10
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
  notificationPreferences: {
    emailAlerts: boolean;
    newReleases: boolean;
    curatedWeekly: boolean;
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
