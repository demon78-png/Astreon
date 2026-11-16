import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };
import { SEED_MEDIA, SEED_NEWS, SEED_REVIEWS, SEED_AUDIT_LOGS, INITIAL_FEATURED_ID } from '../data/seedData.ts';
import type { MediaItem, NewsArticle, UserReview, AdminAuditLog } from '../types/entertainment.ts';
import {
  filterMedia,
  sortMedia,
  generateArticleSlug,
  getTodayIsoDate,
  getUpcomingMediaItems
} from '../utils/entertainment.ts';
import { normalizeNetlifyApiPath } from '../utils/netlify.ts';
import {
  extractTmdbWatchProviders,
  extractTmdbWatchProvidersWithRegion
} from '../utils/providers.ts';
import {
  buildUserReviewDocId,
  clampStarRating,
  starRatingToTenScale
} from '../utils/ratings.ts';

const ADMIN_EMAIL = 'danny2010qwert@gmail.com';
const CACHE_TTL = 60 * 60 * 1000;
const TMDB_RATE_LIMIT = 120;
const TMDB_RATE_WINDOW_MS = 60 * 1000;
const VALID_DOC_ID_REGEX = /^[a-zA-Z0-9_-]{1,128}$/;

interface VerifiedAuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
}

interface AuthenticatedRequest extends Request {
  authUser?: VerifiedAuthUser;
}

const TMDB_GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10765: 'Sci-Fi & Fantasy',
  10768: 'War & Politics'
};

const TMDB_MOVIE_GENRE_PARAM_MAP: Record<string, string> = {
  action: '28',
  adventure: '12',
  animation: '16',
  comedy: '35',
  crime: '80',
  documentary: '99',
  drama: '18',
  family: '10751',
  fantasy: '14',
  history: '36',
  horror: '27',
  music: '10402',
  mystery: '9648',
  romance: '10749',
  'science fiction': '878',
  'tv movie': '10770',
  thriller: '53',
  war: '10752',
  western: '37',
  'action & adventure': '28|12',
  'sci-fi & fantasy': '878|14',
  'war & politics': '10752'
};

const TMDB_TV_GENRE_PARAM_MAP: Record<string, string> = {
  action: '10759',
  adventure: '10759',
  'action & adventure': '10759',
  animation: '16',
  comedy: '35',
  crime: '80',
  documentary: '99',
  drama: '18',
  family: '10751',
  fantasy: '10765',
  kids: '10762',
  mystery: '9648',
  news: '10763',
  reality: '10764',
  'science fiction': '10765',
  'sci-fi & fantasy': '10765',
  soap: '10766',
  talk: '10767',
  war: '10768',
  'war & politics': '10768',
  western: '37'
};

function resolveTmdbGenreParam(genre: string, mType: 'movie' | 'tv'): string | undefined {
  const key = genre.trim().toLowerCase();
  if (!key || key === 'all') return undefined;
  return mType === 'movie' ? TMDB_MOVIE_GENRE_PARAM_MAP[key] : TMDB_TV_GENRE_PARAM_MAP[key];
}

export function resolveFirebaseApiKey(): string {
  if (process.env.FIREBASE_API_KEY) {
    return process.env.FIREBASE_API_KEY;
  }
  if (firebaseConfig && typeof firebaseConfig.apiKey === 'string' && firebaseConfig.apiKey) {
    return firebaseConfig.apiKey;
  }
  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const candidates = [
      path.resolve(process.cwd(), 'firebase-applet-config.json'),
      path.resolve(currentDir, '../../firebase-applet-config.json')
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8'));
        if (parsed?.apiKey) return parsed.apiKey;
      }
    }
  } catch (err) {
    console.warn('[ASTREON Server] Could not read firebase-applet-config.json:', err);
  }
  return '';
}

export function isSyntheticLocalMediaId(id: number): boolean {
  return Number.isFinite(id) && id >= 9900000 && id < 9910000;
}

function mapTmdbSummaryToMediaItem(raw: any, explicitType?: 'movie' | 'tv'): MediaItem | null {
  const mType: 'movie' | 'tv' =
    explicitType || (raw.media_type === 'tv' ? 'tv' : raw.media_type === 'movie' ? 'movie' : raw.first_air_date ? 'tv' : 'movie');
  const title = raw.title || raw.name;
  if (!raw.id || !title) return null;
  const genres: string[] = Array.isArray(raw.genres)
    ? raw.genres.map((g: any) => g.name)
    : Array.isArray(raw.genre_ids)
    ? raw.genre_ids.map((gid: number) => TMDB_GENRE_MAP[gid]).filter(Boolean)
    : [];

  return {
    id: Number(raw.id),
    title,
    originalTitle: raw.original_title || raw.original_name,
    overview: raw.overview || 'Overview unavailable.',
    mediaType: mType,
    releaseDate: raw.release_date,
    firstAirDate: raw.first_air_date,
    posterPath: raw.poster_path ? `https://image.tmdb.org/t/p/w780${raw.poster_path}` : '',
    backdropPath: raw.backdrop_path ? `https://image.tmdb.org/t/p/original${raw.backdrop_path}` : '',
    voteAverage: Math.round((raw.vote_average || 0) * 10) / 10,
    voteCount: raw.vote_count || 0,
    genres: genres.length > 0 ? genres : [mType === 'movie' ? 'Cinema' : 'Series'],
    genreIds: raw.genre_ids
  };
}

export function createApiApp() {
  const app = express();
  const firebaseApiKey = resolveFirebaseApiKey();
  const getTmdbApiKey = () => process.env.TMDB_API_KEY || '';

  const tokenCache = new Map<string, { user: VerifiedAuthUser; expiresAt: number }>();
  const tmdbCache = new Map<string, { data: any; timestamp: number }>();
  const tmdbRateBuckets = new Map<string, { count: number; resetAt: number }>();

  let mediaItems: MediaItem[] = [...SEED_MEDIA];
  let newsArticles: NewsArticle[] = [...SEED_NEWS];
  let reviews: UserReview[] = [...SEED_REVIEWS];
  let auditLogs: AdminAuditLog[] = [...SEED_AUDIT_LOGS];
  let featuredMediaId: number = INITIAL_FEATURED_ID;

  function upsertCatalogItem(item: MediaItem) {
    const idx = mediaItems.findIndex((m) => m.id === item.id && m.mediaType === item.mediaType);
    if (idx === -1) {
      mediaItems.push(item);
    } else {
      mediaItems[idx] = { ...mediaItems[idx], ...item };
    }
  }

  async function verifyFirebaseToken(req: Request): Promise<VerifiedAuthUser | null> {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const idToken = authHeader.slice(7).trim();
    if (!idToken || !firebaseApiKey) return null;

    const cached = tokenCache.get(idToken);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.user;
    }

    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
          signal: AbortSignal.timeout(4000)
        }
      );
      if (!res.ok) return null;
      const data = await res.json();
      const u = data?.users?.[0];
      if (!u || !u.localId) return null;
      const verified: VerifiedAuthUser = {
        uid: u.localId,
        email: u.email || '',
        emailVerified: Boolean(u.emailVerified),
        displayName: u.displayName
      };
      tokenCache.set(idToken, { user: verified, expiresAt: Date.now() + 5 * 60 * 1000 });
      return verified;
    } catch {
      return null;
    }
  }

  async function requireAuth(req: AuthenticatedRequest, res: Response, next: () => void) {
    const user = await verifyFirebaseToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    req.authUser = user;
    next();
  }

  async function requireAdmin(req: AuthenticatedRequest, res: Response, next: () => void) {
    const user = await verifyFirebaseToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }
    if (user.email.toLowerCase() !== ADMIN_EMAIL || !user.emailVerified) {
      return res.status(403).json({ error: 'Verified administrator privileges required' });
    }
    req.authUser = user;
    next();
  }

  async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
    const apiKey = getTmdbApiKey();
    if (!apiKey) return null;
    const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
    url.searchParams.set('api_key', apiKey);
    for (const [key, val] of Object.entries(params)) {
      url.searchParams.set(key, val);
    }

    const cacheKey = url.toString();
    const cached = tmdbCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) {
        if (res.status === 404) {
          // 404 is an expected fallback signal (e.g., synthetic local IDs, missing season/person).
          // Cache the negative lookup briefly without emitting stderr warnings.
          tmdbCache.set(cacheKey, { data: null, timestamp: Date.now() });
          return null;
        }
        console.warn(`TMDB request failed: ${res.status} ${res.statusText}`);
        return null;
      }
      const data = await res.json();
      tmdbCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (err) {
      console.warn('TMDB API fetch error:', err);
      return null;
    }
  }

  function tmdbRateLimiter(req: Request, res: Response, next: () => void) {
    if (req.method !== 'GET') return next();
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
    const now = Date.now();
    const bucket = tmdbRateBuckets.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      tmdbRateBuckets.set(ip, { count: 1, resetAt: now + TMDB_RATE_WINDOW_MS });
    } else {
      bucket.count += 1;
      if (bucket.count > TMDB_RATE_LIMIT) {
        res.setHeader('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
        return res.status(429).json({ error: 'Rate limit exceeded. Please retry shortly.' });
      }
    }
    res.setHeader(
      'Cache-Control',
      'public, max-age=120, s-maxage=300, stale-while-revalidate=600'
    );
    next();
  }

  // Normalize Netlify Function proxy paths (/.netlify/functions/api/* -> /api/*)
  app.use((req, _res, next) => {
    if (req.url.startsWith('/.netlify/functions/api')) {
      req.url = normalizeNetlifyApiPath(req.url);
    }
    next();
  });

  app.use(express.json());
  app.use('/api/tmdb', tmdbRateLimiter);

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      platform: 'ASTREON',
      tmdbConnected: Boolean(getTmdbApiKey()),
      runtime: process.env.NETLIFY ? 'netlify-functions' : 'node-express',
      timestamp: new Date().toISOString()
    });
  });

  // GET /api/tmdb/featured
  app.get('/api/tmdb/featured', (_req: Request, res: Response) => {
    const featured = mediaItems.find((m) => m.id === featuredMediaId) || mediaItems[0];
    res.json(featured);
  });

  // POST /api/tmdb/featured (admin setting)
  app.post('/api/tmdb/featured', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Media ID is required' });
    }
    const found = mediaItems.find((m) => m.id === Number(id));
    if (!found) {
      return res.status(404).json({ error: 'Media title not found in catalog' });
    }
    featuredMediaId = Number(id);

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor: req.authUser?.email || req.body.actor || ADMIN_EMAIL,
      action: 'SET_FEATURED_MEDIA',
      targetType: 'hero_feature',
      targetId: featuredMediaId,
      timestamp: new Date().toISOString(),
      details: `Updated hero featured media to: ${found.title}`
    });

    res.json({ success: true, featured: found });
  });

  // GET /api/tmdb/search (live TMDB search + catalog fallback)
  app.get('/api/tmdb/search', async (req: Request, res: Response) => {
    const queryText = ((req.query.q as string) || '').trim();
    const type = ((req.query.type as string) || 'all') as 'all' | 'movie' | 'tv';
    const language = ((req.query.language as string) || 'en-US').trim();
    const isDefaultLang = language === 'en-US';

    const localResults = filterMedia(mediaItems, {
      type,
      searchQuery: queryText
    });

    if (!queryText || !getTmdbApiKey()) {
      return res.json({ results: sortMedia(localResults, 'popularity.desc'), source: 'catalog' });
    }

    const endpoint =
      type === 'movie' ? '/search/movie' : type === 'tv' ? '/search/tv' : '/search/multi';
    const live = await fetchFromTMDB(endpoint, {
      query: queryText,
      include_adult: 'false',
      page: '1',
      language
    });

    if (!live || !Array.isArray(live.results)) {
      return res.json({ results: sortMedia(localResults, 'popularity.desc'), source: 'catalog' });
    }

    const liveMapped: MediaItem[] = [];
    for (const raw of live.results) {
      if (raw.media_type === 'person') continue;
      const mapped = mapTmdbSummaryToMediaItem(raw, type === 'all' ? undefined : type);
      if (mapped) {
        if (isDefaultLang) upsertCatalogItem(mapped);
        liveMapped.push(mapped);
      }
    }

    const seen = new Set(liveMapped.map((m) => `${m.mediaType}:${m.id}`));
    const merged = [...liveMapped, ...localResults.filter((m) => !seen.has(`${m.mediaType}:${m.id}`))];
    res.json({ results: merged.slice(0, 24), source: 'tmdb' });
  });

  // GET /api/tmdb/trending (live TMDB trending + catalog fallback)
  app.get('/api/tmdb/trending', async (req: Request, res: Response) => {
    const type = ((req.query.type as string) || 'all') as 'all' | 'movie' | 'tv';
    const language = ((req.query.language as string) || 'en-US').trim();
    const isDefaultLang = language === 'en-US';
    if (getTmdbApiKey()) {
      const live = await fetchFromTMDB(`/trending/${type}/week`, { page: '1', language });
      if (live && Array.isArray(live.results)) {
        const mapped: MediaItem[] = [];
        for (const raw of live.results) {
          if (raw.media_type === 'person') continue;
          const item = mapTmdbSummaryToMediaItem(raw, type === 'all' ? undefined : type);
          if (item) {
            if (isDefaultLang) upsertCatalogItem(item);
            mapped.push(item);
          }
        }
        if (mapped.length > 0) {
          return res.json({ results: mapped, source: 'tmdb' });
        }
      }
    }
    const fallback = sortMedia(filterMedia(mediaItems, { type }), 'popularity.desc');
    res.json({ results: fallback, source: 'catalog' });
  });

  // GET /api/tmdb/upcoming (live TMDB future movies & series + catalog fallback)
  app.get('/api/tmdb/upcoming', async (req: Request, res: Response) => {
    const rawType = (req.query.type as string) || 'all';
    const type: 'all' | 'movie' | 'tv' =
      rawType === 'movie' || rawType === 'tv' ? rawType : 'all';
    const language = ((req.query.language as string) || 'en-US').trim();
    const isDefaultLang = language === 'en-US';

    const todayIso = getTodayIsoDate();
    const tomorrowDate = new Date(`${todayIso}T12:00:00Z`);
    tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
    const tomorrowIso = getTodayIsoDate(tomorrowDate);

    if (getTmdbApiKey()) {
      const fetchUpcomingMovies =
        type === 'all' || type === 'movie'
          ? Promise.all([
              fetchFromTMDB('/discover/movie', {
                page: '1',
                include_adult: 'false',
                sort_by: 'popularity.desc',
                'primary_release_date.gte': tomorrowIso,
                language
              }),
              fetchFromTMDB('/movie/upcoming', {
                page: '1',
                language
              })
            ])
          : Promise.resolve([null, null]);

      const fetchUpcomingTv =
        type === 'all' || type === 'tv'
          ? fetchFromTMDB('/discover/tv', {
              page: '1',
              include_adult: 'false',
              sort_by: 'popularity.desc',
              'first_air_date.gte': tomorrowIso,
              language
            })
          : Promise.resolve(null);

      const [[movieDiscover, movieUpcoming], tvPopular] = await Promise.all([
        fetchUpcomingMovies,
        fetchUpcomingTv
      ]);

      const movieItemsRaw: MediaItem[] = [];
      for (const resp of [movieDiscover, movieUpcoming]) {
        if (resp && Array.isArray(resp.results)) {
          for (const raw of resp.results) {
            const mapped = mapTmdbSummaryToMediaItem(raw, 'movie');
            if (mapped && mapped.posterPath) {
              if (isDefaultLang) upsertCatalogItem(mapped);
              movieItemsRaw.push(mapped);
            }
          }
        }
      }

      const tvItemsRaw: MediaItem[] = [];
      if (tvPopular && Array.isArray(tvPopular.results)) {
        for (const raw of tvPopular.results) {
          const mapped = mapTmdbSummaryToMediaItem(raw, 'tv');
          if (mapped && mapped.posterPath) {
            if (isDefaultLang) upsertCatalogItem(mapped);
            tvItemsRaw.push(mapped);
          }
        }
      }

      const upcomingMovies = getUpcomingMediaItems(
        movieItemsRaw,
        todayIso,
        type === 'movie' ? 24 : 12
      );
      const upcomingTv = getUpcomingMediaItems(
        tvItemsRaw,
        todayIso,
        type === 'tv' ? 24 : 12
      );

      const combined = getUpcomingMediaItems([...upcomingMovies, ...upcomingTv], todayIso, 24);
      if (combined.length > 0) {
        return res.json({ results: combined, source: 'tmdb', asOf: todayIso });
      }
    }

    const filteredCatalog =
      type === 'all' ? mediaItems : mediaItems.filter((item) => item.mediaType === type);
    const fallback = getUpcomingMediaItems(filteredCatalog, todayIso, 24);
    res.json({ results: fallback, source: 'catalog', asOf: todayIso });
  });

  // GET /api/tmdb/discover (paginated live TMDB discover + catalog fallback)
  app.get('/api/tmdb/discover', async (req: Request, res: Response) => {
    const type = ((req.query.type as string) || 'all') as 'all' | 'movie' | 'tv';
    const genre = (req.query.genre as string) || '';
    const year = (req.query.year as string) || '';
    const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : 0;
    const sortBy = (req.query.sortBy as any) || 'popularity.desc';
    const queryText = ((req.query.q as string) || '').trim();
    const page = Math.max(1, parseInt((req.query.page as string) || '1', 10) || 1);
    const language = ((req.query.language as string) || 'en-US').trim();
    const isDefaultLang = language === 'en-US';

    if (getTmdbApiKey() && !queryText) {
      const hasGenreFilter = Boolean(genre && genre !== 'All');
      const tmdbSortMovie =
        sortBy === 'title.asc'
          ? 'original_title.asc'
          : sortBy === 'primary_release_date.desc'
          ? 'primary_release_date.desc'
          : sortBy;
      const tmdbSortTv =
        sortBy === 'title.asc'
          ? 'original_name.asc'
          : sortBy === 'primary_release_date.desc'
          ? 'first_air_date.desc'
          : sortBy;

      const buildParams = (mType: 'movie' | 'tv', genreParam?: string) => {
        const p: Record<string, string> = {
          page: String(page),
          include_adult: 'false',
          sort_by: mType === 'movie' ? tmdbSortMovie : tmdbSortTv,
          language
        };
        if (genreParam) p.with_genres = genreParam;
        if (year && year !== 'All' && /^\d{4}$/.test(year)) {
          p[mType === 'movie' ? 'primary_release_year' : 'first_air_date_year'] = year;
        }
        if (minRating > 0) p['vote_average.gte'] = String(minRating);
        if (sortBy === 'vote_average.desc') p['vote_count.gte'] = '200';
        return p;
      };

      const rawTargets: Array<'movie' | 'tv'> = type === 'all' ? ['movie', 'tv'] : [type];
      const resolvedTargets = rawTargets
        .map((mType) => ({
          mType,
          genreParam: hasGenreFilter ? resolveTmdbGenreParam(genre, mType) : undefined
        }))
        .filter((entry) => !hasGenreFilter || Boolean(entry.genreParam));

      const responses = await Promise.all(
        resolvedTargets.map((entry) => fetchFromTMDB(`/discover/${entry.mType}`, buildParams(entry.mType, entry.genreParam)))
      );

      const liveMapped: MediaItem[] = [];
      let maxPages = 1;
      let totalResults = 0;

      responses.forEach((resp, idx) => {
        const mType = resolvedTargets[idx].mType;
        if (resp && Array.isArray(resp.results)) {
          maxPages = Math.max(maxPages, Math.min(resp.total_pages || 1, 50));
          totalResults += resp.total_results || resp.results.length;
          for (const raw of resp.results) {
            const item = mapTmdbSummaryToMediaItem(raw, mType);
            if (item && item.posterPath) {
              if (isDefaultLang) upsertCatalogItem(item);
              liveMapped.push(item);
            }
          }
        }
      });

      if (liveMapped.length > 0) {
        let merged = liveMapped;
        if (page === 1) {
          const localFiltered = filterMedia(SEED_MEDIA, {
            type,
            genre,
            year,
            minRating,
            searchQuery: queryText
          });
          const seen = new Set(liveMapped.map((m) => `${m.mediaType}:${m.id}`));
          merged = [...liveMapped, ...localFiltered.filter((m) => !seen.has(`${m.mediaType}:${m.id}`))];
        }
        const sorted = sortMedia(merged, sortBy);
        return res.json({
          results: sorted,
          total: Math.max(totalResults, sorted.length),
          page,
          totalPages: maxPages,
          source: 'tmdb'
        });
      }
    }

    let filtered = filterMedia(mediaItems, {
      type,
      genre,
      year,
      minRating,
      searchQuery: queryText
    });

    filtered = sortMedia(filtered, sortBy);
    res.json({
      results: page === 1 ? filtered : [],
      total: filtered.length,
      page,
      totalPages: 1,
      source: 'catalog'
    });
  });

  // GET /api/tmdb/details/:type/:id
  app.get('/api/tmdb/details/:type/:id', async (req: Request, res: Response) => {
    const { type, id } = req.params;
    if (type !== 'movie' && type !== 'tv') {
      return res.status(400).json({ error: 'Invalid media type; expected movie or tv' });
    }
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Invalid numeric media ID' });
    }
    const numId = parseInt(id, 10);
    if (!Number.isSafeInteger(numId) || numId <= 0) {
      return res.status(400).json({ error: 'Media ID must be a positive integer' });
    }

    const language = ((req.query.language as string) || 'en-US').trim();
    const rawRegion = ((req.query.region as string) || 'US').trim().toUpperCase();
    const region = /^[A-Z]{2}$/.test(rawRegion) ? rawRegion : 'US';
    const isDefaultLang = language === 'en-US';
    const isDefaultRegion = region === 'US';

    const localMatch = mediaItems.find(
      (m) => m.id === numId && m.mediaType === type
    ) as (MediaItem & { _tmdbEnriched?: boolean }) | undefined;
    if (isSyntheticLocalMediaId(numId)) {
      if (localMatch) {
        return res.json(localMatch);
      }
      return res.status(404).json({ error: 'Title not found' });
    }

    if (
      localMatch &&
      ((localMatch._tmdbEnriched && isDefaultLang && isDefaultRegion) || !getTmdbApiKey())
    ) {
      return res.json(localMatch);
    }

    if (getTmdbApiKey()) {
      const live = await fetchFromTMDB(`/${type}/${numId}`, {
        append_to_response: 'credits,videos,watch/providers,similar',
        language
      });
      if (live) {
        const similarItems: MediaItem[] = [];
        for (const s of (live.similar?.results || []).slice(0, 8)) {
          const mappedSim = mapTmdbSummaryToMediaItem(s, type);
          if (mappedSim) {
            if (
              isDefaultLang &&
              !mediaItems.some((m) => m.id === mappedSim.id && m.mediaType === mappedSim.mediaType)
            ) {
              mediaItems.push(mappedSim);
            }
            similarItems.push(mappedSim);
          }
        }

        const liveCast = (live.credits?.cast || []).slice(0, 12).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : undefined
        }));
        const liveVideos = (live.videos?.results || []).map((v: any) => ({
          id: v.id,
          key: v.key,
          name: v.name,
          site: v.site,
          type: v.type,
          official: v.official
        }));
        const { providers: liveProviders, regionUsed } = extractTmdbWatchProvidersWithRegion(
          live['watch/providers'],
          type as 'movie' | 'tv',
          numId,
          16,
          region
        );

        const preserveLocalBackdrop =
          localMatch?.backdropPath && localMatch.backdropPath.startsWith('/assets/images/')
            ? localMatch.backdropPath
            : undefined;

        const mapped: MediaItem & { _tmdbEnriched?: boolean } = {
          id: live.id,
          title: live.title || live.name,
          originalTitle: live.original_title || live.original_name,
          overview: live.overview || localMatch?.overview || 'Overview unavailable.',
          mediaType: type as any,
          releaseDate: live.release_date,
          firstAirDate: live.first_air_date,
          posterPath: live.poster_path ? `https://image.tmdb.org/t/p/w780${live.poster_path}` : localMatch?.posterPath || '',
          backdropPath: preserveLocalBackdrop || (live.backdrop_path ? `https://image.tmdb.org/t/p/original${live.backdrop_path}` : localMatch?.backdropPath || ''),
          voteAverage: Math.round((live.vote_average || 0) * 10) / 10,
          voteCount: live.vote_count || 0,
          genres: (live.genres || []).map((g: any) => TMDB_GENRE_MAP[g.id] || g.name),
          runtime: live.runtime,
          numberOfSeasons: live.number_of_seasons,
          numberOfEpisodes: live.number_of_episodes,
          status: live.status,
          tagline: live.tagline || localMatch?.tagline,
          featured: localMatch?.featured,
          cast: liveCast.length > 0 ? liveCast : localMatch?.cast,
          crew: (live.credits?.crew || []).slice(0, 6).map((cr: any) => ({
            id: cr.id,
            name: cr.name,
            job: cr.job,
            department: cr.department
          })),
          videos: liveVideos.length > 0 ? liveVideos : localMatch?.videos,
          providers: liveProviders && liveProviders.length > 0 ? liveProviders : localMatch?.providers,
          providerRegion: regionUsed || region,
          similarIds: similarItems.length > 0 ? similarItems.map((s) => s.id) : localMatch?.similarIds,
          _tmdbEnriched: true
        };
        if (isDefaultLang && isDefaultRegion) upsertCatalogItem(mapped);
        return res.json(mapped);
      }
    }

    if (localMatch) {
      return res.json(localMatch);
    }

    res.status(404).json({ error: 'Title not found' });
  });

  // GET /api/tmdb/tv/:id/season/:seasonNumber (Season & episode guide)
  app.get('/api/tmdb/tv/:id/season/:seasonNumber', async (req: Request, res: Response) => {
    const { id, seasonNumber } = req.params;
    if (!/^\d+$/.test(id) || !/^\d+$/.test(seasonNumber)) {
      return res.status(400).json({ error: 'Invalid numeric TV show or season number' });
    }
    const tvId = parseInt(id, 10);
    const seasonNum = parseInt(seasonNumber, 10);
    if (!Number.isSafeInteger(tvId) || tvId <= 0 || seasonNum < 0 || seasonNum > 100) {
      return res.status(400).json({ error: 'TV ID and season number out of range' });
    }

    const language = ((req.query.language as string) || 'en-US').trim();
    if (getTmdbApiKey() && !isSyntheticLocalMediaId(tvId)) {
      const liveSeason = await fetchFromTMDB(`/tv/${tvId}/season/${seasonNum}`, { language });
      if (liveSeason && Array.isArray(liveSeason.episodes)) {
        return res.json({
          id: liveSeason.id || tvId * 100 + seasonNum,
          seasonNumber: liveSeason.season_number ?? seasonNum,
          name: liveSeason.name || `Season ${seasonNum}`,
          overview: liveSeason.overview || '',
          airDate: liveSeason.air_date,
          posterPath: liveSeason.poster_path
            ? `https://image.tmdb.org/t/p/w342${liveSeason.poster_path}`
            : null,
          episodes: liveSeason.episodes.map((ep: any) => ({
            id: ep.id,
            episodeNumber: ep.episode_number,
            seasonNumber: ep.season_number ?? seasonNum,
            name: ep.name || `Episode ${ep.episode_number}`,
            overview: ep.overview || '',
            airDate: ep.air_date,
            runtime: ep.runtime || null,
            stillPath: ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : null,
            voteAverage: ep.vote_average ? Math.round(ep.vote_average * 10) / 10 : undefined
          })),
          source: 'tmdb'
        });
      }
    }

    const localTv = mediaItems.find((m) => m.id === tvId && m.mediaType === 'tv');
    if (localTv) {
      const totalSeasons = localTv.numberOfSeasons || 1;
      const estimatedCount = Math.min(
        Math.max(Math.round((localTv.numberOfEpisodes || 8) / totalSeasons), 4),
        12
      );
      const episodes = Array.from({ length: estimatedCount }, (_, idx) => ({
        id: tvId * 1000 + seasonNum * 100 + idx + 1,
        episodeNumber: idx + 1,
        seasonNumber: seasonNum,
        name: `Season ${seasonNum} · Chapter ${idx + 1}`,
        overview:
          idx === 0
            ? localTv.overview
            : `Episode ${idx + 1} of ${localTv.title} Season ${seasonNum}.`,
        airDate: localTv.firstAirDate,
        runtime: localTv.episodeRunTime?.[0] || 48,
        stillPath: null
      }));
      return res.json({
        id: tvId * 100 + seasonNum,
        seasonNumber: seasonNum,
        name: `Season ${seasonNum}`,
        overview: localTv.overview,
        airDate: localTv.firstAirDate,
        posterPath: localTv.posterPath || null,
        episodes,
        source: 'catalog'
      });
    }

    res.status(404).json({ error: 'Season details unavailable' });
  });

  // GET /api/tmdb/person/:id (Cast/crew biography & filmography credits)
  app.get('/api/tmdb/person/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Invalid numeric person ID' });
    }
    const personId = parseInt(id, 10);
    if (!Number.isSafeInteger(personId) || personId <= 0) {
      return res.status(400).json({ error: 'Person ID must be a positive integer' });
    }

    const language = ((req.query.language as string) || 'en-US').trim();
    if (getTmdbApiKey() && !isSyntheticLocalMediaId(personId)) {
      const livePerson = await fetchFromTMDB(`/person/${personId}`, {
        append_to_response: 'combined_credits',
        language
      });
      if (livePerson && livePerson.id) {
        const rawCredits = [
          ...(Array.isArray(livePerson.combined_credits?.cast) ? livePerson.combined_credits.cast : []),
          ...(Array.isArray(livePerson.combined_credits?.crew) ? livePerson.combined_credits.crew : [])
        ];
        const dedupedCredits = new Map<string, any>();
        for (const cr of rawCredits) {
          const mType = cr.media_type === 'tv' ? 'tv' : 'movie';
          const title = cr.title || cr.name;
          if (!cr.id || !title) continue;
          const key = `${mType}:${cr.id}`;
          if (!dedupedCredits.has(key)) {
            dedupedCredits.set(key, {
              id: cr.id,
              mediaType: mType,
              title,
              posterPath: cr.poster_path ? `https://image.tmdb.org/t/p/w342${cr.poster_path}` : '',
              backdropPath: cr.backdrop_path ? `https://image.tmdb.org/t/p/w780${cr.backdrop_path}` : '',
              character: cr.character || undefined,
              job: cr.job || undefined,
              releaseDate: cr.release_date || cr.first_air_date || undefined,
              voteAverage: Math.round((cr.vote_average || 0) * 10) / 10,
              _pop: cr.popularity || 0
            });
          }
        }
        const credits = Array.from(dedupedCredits.values())
          .sort((a, b) => (b._pop || 0) - (a._pop || 0))
          .slice(0, 24)
          .map(({ _pop, ...rest }) => rest);

        return res.json({
          id: livePerson.id,
          name: livePerson.name,
          biography: livePerson.biography || '',
          birthday: livePerson.birthday || null,
          deathday: livePerson.deathday || null,
          placeOfBirth: livePerson.place_of_birth || null,
          knownForDepartment: livePerson.known_for_department || undefined,
          profilePath: livePerson.profile_path
            ? `https://image.tmdb.org/t/p/w300${livePerson.profile_path}`
            : null,
          credits,
          source: 'tmdb'
        });
      }
    }

    // Fallback: assemble filmography from catalog cast & crew mentions
    let matchedName = '';
    let matchedProfile: string | null = null;
    let knownForDepartment = 'Acting';
    const catalogCredits: any[] = [];

    for (const item of mediaItems) {
      const castHit = item.cast?.find((c) => c.id === personId);
      const crewHit = item.crew?.find((cr) => cr.id === personId);
      if (castHit) {
        matchedName = matchedName || castHit.name;
        matchedProfile = matchedProfile || castHit.profilePath || null;
        catalogCredits.push({
          id: item.id,
          mediaType: item.mediaType,
          title: item.title,
          posterPath: item.posterPath,
          backdropPath: item.backdropPath,
          character: castHit.character,
          releaseDate: item.releaseDate || item.firstAirDate,
          voteAverage: item.voteAverage
        });
      } else if (crewHit) {
        matchedName = matchedName || crewHit.name;
        knownForDepartment = crewHit.department || 'Production';
        catalogCredits.push({
          id: item.id,
          mediaType: item.mediaType,
          title: item.title,
          posterPath: item.posterPath,
          backdropPath: item.backdropPath,
          job: crewHit.job,
          releaseDate: item.releaseDate || item.firstAirDate,
          voteAverage: item.voteAverage
        });
      }
    }

    if (matchedName) {
      return res.json({
        id: personId,
        name: matchedName,
        biography: `${matchedName} is featured across curated selections in the ASTREON catalog.`,
        knownForDepartment,
        profilePath: matchedProfile,
        credits: catalogCredits,
        source: 'catalog'
      });
    }

    res.status(404).json({ error: 'Person profile not found' });
  });

  // GET /api/news
  app.get('/api/news', (_req: Request, res: Response) => {
    res.setHeader(
      'Cache-Control',
      'public, max-age=120, s-maxage=300, stale-while-revalidate=600'
    );
    res.json({ articles: newsArticles });
  });

  // POST /api/news (admin only)
  app.post('/api/news', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id: clientId, slug: clientSlug, publishedAt: clientPublishedAt, title, excerpt, body, category, author, image, imageAlt } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    const articleId =
      typeof clientId === 'string' && VALID_DOC_ID_REGEX.test(clientId)
        ? clientId
        : `art_${Date.now()}`;

    const existingSlugs = newsArticles
      .filter((a) => a.id !== articleId)
      .map((a) => a.slug);
    const candidateSlug =
      typeof clientSlug === 'string' && VALID_DOC_ID_REGEX.test(clientSlug) && !existingSlugs.includes(clientSlug)
        ? clientSlug
        : generateArticleSlug(title, existingSlugs, articleId);

    const newArticle: NewsArticle = {
      id: articleId,
      slug: candidateSlug,
      title,
      excerpt: excerpt || title,
      body,
      category: category || 'Curation',
      image: image || 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg',
      imageAlt: imageAlt || title,
      author: author || 'ASTREON Editorial Board',
      authorRole: 'Contributor',
      readTime: `${Math.max(1, Math.ceil(body.split(' ').length / 200))} min read`,
      publishedAt: typeof clientPublishedAt === 'string' && clientPublishedAt ? clientPublishedAt : new Date().toISOString(),
      status: 'published'
    };

    const existingIdx = newsArticles.findIndex((a) => a.id === newArticle.id);
    if (existingIdx >= 0) {
      newsArticles[existingIdx] = newArticle;
    } else {
      newsArticles.unshift(newArticle);
    }

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor: req.authUser?.email || req.body.actor || ADMIN_EMAIL,
      action: 'PUBLISH_ARTICLE',
      targetType: 'article',
      targetId: newArticle.id,
      timestamp: new Date().toISOString(),
      details: `Published article: "${newArticle.title}"`
    });

    res.status(201).json(newArticle);
  });

  // PUT /api/news/:id (admin edit / publish-draft toggle)
  app.put('/api/news/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const idx = newsArticles.findIndex((a) => a.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const existing = newsArticles[idx];
    const { title, excerpt, body, category, author, image, imageAlt, status } = req.body;

    const updated: NewsArticle = {
      ...existing,
      ...(typeof title === 'string' && title.trim() ? { title: title.trim() } : {}),
      ...(typeof excerpt === 'string' && excerpt.trim() ? { excerpt: excerpt.trim() } : {}),
      ...(typeof body === 'string' && body.trim()
        ? {
            body: body.trim(),
            readTime: `${Math.max(1, Math.ceil(body.trim().split(/\s+/).length / 200))} min read`
          }
        : {}),
      ...(category ? { category } : {}),
      ...(typeof author === 'string' && author.trim() ? { author: author.trim() } : {}),
      ...(typeof image === 'string' && image.trim() ? { image: image.trim() } : {}),
      ...(typeof imageAlt === 'string' && imageAlt.trim() ? { imageAlt: imageAlt.trim() } : {}),
      ...(status === 'published' || status === 'draft' ? { status } : {})
    };

    newsArticles[idx] = updated;

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor: req.authUser?.email || ADMIN_EMAIL,
      action: status && status !== existing.status ? 'TOGGLE_ARTICLE_STATUS' : 'UPDATE_ARTICLE',
      targetType: 'article',
      targetId: updated.id,
      timestamp: new Date().toISOString(),
      details: `Updated article "${updated.title}" (status: ${updated.status})`
    });

    res.json(updated);
  });

  // GET /api/reviews
  app.get('/api/reviews', (req: Request, res: Response) => {
    const mediaId = req.query.mediaId ? parseInt(req.query.mediaId as string, 10) : undefined;
    if (mediaId) {
      const matched = reviews.filter((r) => r.mediaId === mediaId);
      return res.json({ reviews: matched });
    }
    res.json({ reviews });
  });

  // POST /api/reviews (authenticated user)
  app.post('/api/reviews', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const {
      id: clientId,
      createdAt: clientCreatedAt,
      userId,
      userName,
      userAvatar,
      mediaId,
      mediaType,
      rating,
      starRating,
      reviewText
    } = req.body;
    const verifiedUid = req.authUser?.uid;
    if (!verifiedUid || (userId && userId !== verifiedUid)) {
      return res.status(403).json({ error: 'Authenticated identity mismatch' });
    }
    if (!userName || !mediaId || (rating === undefined && starRating === undefined)) {
      return res.status(400).json({ error: 'Missing required review fields' });
    }

    const hasStarRating = starRating !== undefined && starRating !== null;
    let resolvedStars: number | undefined;
    let numRating: number;

    if (hasStarRating) {
      const parsedStars = Number(starRating);
      if (!Number.isFinite(parsedStars) || parsedStars < 1 || parsedStars > 5) {
        return res.status(400).json({ error: 'Star rating must be a number between 1 and 5' });
      }
      resolvedStars = clampStarRating(parsedStars);
      numRating = starRatingToTenScale(resolvedStars);
    } else {
      numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 10) {
        return res.status(400).json({ error: 'Rating must be a number between 1 and 10' });
      }
    }

    const trimmedText = typeof reviewText === 'string' ? reviewText.trim() : '';
    if (!hasStarRating && trimmedText.length < 5) {
      return res.status(400).json({ error: 'Review text must be between 5 and 2000 characters' });
    }
    if (trimmedText.length > 2000) {
      return res.status(400).json({ error: 'Review text must be at most 2000 characters' });
    }

    const resolvedType: 'movie' | 'tv' = mediaType === 'tv' ? 'tv' : 'movie';
    const existing = reviews.find(
      (r) => r.userId === verifiedUid && r.mediaId === Number(mediaId) && r.mediaType === resolvedType
    );
    if (existing) {
      existing.rating = numRating;
      if (resolvedStars !== undefined) {
        existing.starRating = resolvedStars;
      }
      existing.reviewText = trimmedText;
      existing.updatedAt = new Date().toISOString();
      return res.json({ message: 'Review updated successfully', review: existing });
    }

    const reviewId =
      typeof clientId === 'string' && VALID_DOC_ID_REGEX.test(clientId)
        ? clientId
        : buildUserReviewDocId(resolvedType, Number(mediaId), verifiedUid);

    const newReview: UserReview = {
      id: reviewId,
      userId: verifiedUid,
      userName: String(userName).trim().slice(0, 100) || 'ASTREON Member',
      ...(typeof userAvatar === 'string' && userAvatar.trim() ? { userAvatar: userAvatar.trim().slice(0, 500) } : {}),
      mediaId: Number(mediaId),
      mediaType: resolvedType,
      rating: numRating,
      ...(resolvedStars !== undefined ? { starRating: resolvedStars } : {}),
      reviewText: trimmedText,
      status: 'published',
      createdAt: typeof clientCreatedAt === 'string' && clientCreatedAt ? clientCreatedAt : new Date().toISOString(),
      helpfulCount: 0
    };

    reviews.unshift(newReview);
    res.status(201).json({ message: 'Review published', review: newReview });
  });

  // PUT /api/reviews/:id (edit own review)
  app.put('/api/reviews/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { rating, starRating, reviewText } = req.body;
    const review = reviews.find((r) => r.id === id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    if (review.userId !== req.authUser?.uid) {
      return res.status(403).json({ error: 'Only the review author can edit this review' });
    }

    const hasStarRating = starRating !== undefined && starRating !== null;
    let resolvedStars: number | undefined;
    let numRating: number;

    if (hasStarRating) {
      const parsedStars = Number(starRating);
      if (!Number.isFinite(parsedStars) || parsedStars < 1 || parsedStars > 5) {
        return res.status(400).json({ error: 'Star rating must be a number between 1 and 5' });
      }
      resolvedStars = clampStarRating(parsedStars);
      numRating = starRatingToTenScale(resolvedStars);
    } else {
      numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 10) {
        return res.status(400).json({ error: 'Rating must be a number between 1 and 10' });
      }
    }

    const trimmedText = typeof reviewText === 'string' ? reviewText.trim() : '';
    if (!hasStarRating && trimmedText.length < 5) {
      return res.status(400).json({ error: 'Review text must be between 5 and 2000 characters' });
    }
    if (trimmedText.length > 2000) {
      return res.status(400).json({ error: 'Review text must be at most 2000 characters' });
    }

    review.rating = numRating;
    if (resolvedStars !== undefined) {
      review.starRating = resolvedStars;
    }
    review.reviewText = trimmedText;
    review.updatedAt = new Date().toISOString();
    res.json({ success: true, review });
  });

  // DELETE /api/reviews/:id (delete own review or admin)
  app.delete('/api/reviews/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const idx = reviews.findIndex((r) => r.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Review not found' });
    }
    const isAdminUser =
      req.authUser?.email.toLowerCase() === ADMIN_EMAIL && req.authUser.emailVerified;
    if (reviews[idx].userId !== req.authUser?.uid && !isAdminUser) {
      return res.status(403).json({ error: 'Not authorized to delete this review' });
    }
    reviews.splice(idx, 1);
    res.json({ success: true });
  });

  // PATCH /api/reviews/:id/helpful (toggle helpful upvote)
  app.patch('/api/reviews/:id/helpful', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const delta = req.body?.delta === -1 ? -1 : 1;
    const review = reviews.find((r) => r.id === id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    review.helpfulCount = Math.max(0, (review.helpfulCount || 0) + delta);
    res.json({ success: true, helpfulCount: review.helpfulCount });
  });

  // PATCH /api/reviews/:id (admin moderation status change)
  app.patch('/api/reviews/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const review = reviews.find((r) => r.id === id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (status && ['published', 'pending', 'flagged'].includes(status)) {
      review.status = status;
      auditLogs.unshift({
        id: `log-${Date.now()}`,
        actor: req.authUser?.email || ADMIN_EMAIL,
        action: 'MODERATE_REVIEW',
        targetType: 'review',
        targetId: review.id,
        timestamp: new Date().toISOString(),
        details: `Changed review status to ${status}`
      });
    }

    res.json({ success: true, review });
  });

  // POST /api/reports
  app.post('/api/reports', (req: Request, res: Response) => {
    const { targetType, targetId, reason, reporterId } = req.body;
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ error: 'targetType, targetId, and reason are required' });
    }

    auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor: reporterId || 'user',
      action: 'REPORT_SUBMITTED',
      targetType: targetType as any,
      targetId,
      timestamp: new Date().toISOString(),
      details: `Report submitted for ${targetType} #${targetId}: "${reason}"`
    });

    res.json({ success: true, message: 'Report received and queued for review' });
  });

  // GET /api/admin/metrics
  app.get('/api/admin/metrics', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    const totalReviews = reviews.length;
    const flaggedReviews = reviews.filter((r) => r.status === 'flagged').length;
    const publishedArticles = newsArticles.filter((a) => a.status === 'published').length;

    res.json({
      catalogCount: mediaItems.length,
      moviesCount: mediaItems.filter((m) => m.mediaType === 'movie').length,
      tvCount: mediaItems.filter((m) => m.mediaType === 'tv').length,
      totalReviews,
      flaggedReviews,
      publishedArticles,
      featuredTitle: mediaItems.find((m) => m.id === featuredMediaId)?.title || 'None'
    });
  });

  // GET /api/admin/audit-logs
  app.get('/api/admin/audit-logs', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
    res.json({ logs: auditLogs });
  });

  return app;
}
