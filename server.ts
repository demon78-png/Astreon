import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { SEED_MEDIA, SEED_NEWS, SEED_REVIEWS, SEED_AUDIT_LOGS, INITIAL_FEATURED_ID } from './src/data/seedData';
import { MediaItem, NewsArticle, UserReview, AdminAuditLog } from './src/types/entertainment';
import { filterMedia, sortMedia } from './src/utils/entertainment';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';

app.use(express.json());

// In-memory persistent state (seeded with high-fidelity items)
let mediaItems: MediaItem[] = [...SEED_MEDIA];
let newsArticles: NewsArticle[] = [...SEED_NEWS];
let reviews: UserReview[] = [...SEED_REVIEWS];
let auditLogs: AdminAuditLog[] = [...SEED_AUDIT_LOGS];
let featuredMediaId: number = INITIAL_FEATURED_ID;

// Cache for external TMDB API calls (1 hour TTL)
const tmdbCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000;

async function fetchFromTMDB(endpoint: string, params: Record<string, string> = {}) {
  if (!TMDB_API_KEY) return null;
  const url = new URL(`https://api.themoviedb.org/3${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
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

// ======================== API ROUTES ========================

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    platform: 'ASTREON',
    tmdbConnected: Boolean(TMDB_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// GET /api/tmdb/featured
app.get('/api/tmdb/featured', (_req: Request, res: Response) => {
  const featured = mediaItems.find((m) => m.id === featuredMediaId) || mediaItems[0];
  res.json(featured);
});

// POST /api/tmdb/featured (admin setting)
app.post('/api/tmdb/featured', (req: Request, res: Response) => {
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
    actor: req.body.actor || 'admin@astreon.org',
    action: 'SET_FEATURED_MEDIA',
    targetType: 'hero_feature',
    targetId: featuredMediaId,
    timestamp: new Date().toISOString(),
    details: `Updated hero featured media to: ${found.title}`
  });

  res.json({ success: true, featured: found });
});

// GET /api/tmdb/discover
app.get('/api/tmdb/discover', (req: Request, res: Response) => {
  const type = (req.query.type as string) || 'all';
  const genre = (req.query.genre as string) || '';
  const year = (req.query.year as string) || '';
  const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : 0;
  const sortBy = (req.query.sortBy as any) || 'popularity.desc';
  const query = (req.query.q as string) || '';

  let filtered = filterMedia(mediaItems, {
    type: type as any,
    genre,
    year,
    minRating,
    searchQuery: query
  });

  filtered = sortMedia(filtered, sortBy);
  res.json({ results: filtered, total: filtered.length });
});

// GET /api/tmdb/details/:type/:id
app.get('/api/tmdb/details/:type/:id', async (req: Request, res: Response) => {
  const { type, id } = req.params;
  const numId = parseInt(id, 10);

  // First check local catalog
  const localMatch = mediaItems.find((m) => m.id === numId);
  if (localMatch) {
    return res.json(localMatch);
  }

  // If TMDB key available, attempt to fetch live
  if (TMDB_API_KEY) {
    const live = await fetchFromTMDB(`/${type}/${id}`, {
      append_to_response: 'credits,videos,watch/providers,similar'
    });
    if (live) {
      const mapped: MediaItem = {
        id: live.id,
        title: live.title || live.name,
        originalTitle: live.original_title || live.original_name,
        overview: live.overview,
        mediaType: type as any,
        releaseDate: live.release_date,
        firstAirDate: live.first_air_date,
        posterPath: live.poster_path ? `https://image.tmdb.org/t/p/w780${live.poster_path}` : '',
        backdropPath: live.backdrop_path ? `https://image.tmdb.org/t/p/original${live.backdrop_path}` : '',
        voteAverage: Math.round((live.vote_average || 0) * 10) / 10,
        voteCount: live.vote_count || 0,
        genres: (live.genres || []).map((g: any) => g.name),
        runtime: live.runtime,
        numberOfSeasons: live.number_of_seasons,
        numberOfEpisodes: live.number_of_episodes,
        status: live.status,
        tagline: live.tagline,
        cast: (live.credits?.cast || []).slice(0, 10).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : undefined
        })),
        crew: (live.credits?.crew || []).slice(0, 5).map((cr: any) => ({
          id: cr.id,
          name: cr.name,
          job: cr.job,
          department: cr.department
        })),
        videos: (live.videos?.results || []).map((v: any) => ({
          id: v.id,
          key: v.key,
          name: v.name,
          site: v.site,
          type: v.type,
          official: v.official
        })),
        providers: live['watch/providers']?.results?.US?.flatrate?.map((p: any) => ({
          providerId: p.provider_id,
          providerName: p.provider_name,
          logoPath: `https://image.tmdb.org/t/p/w92${p.logo_path}`,
          type: 'flatrate'
        }))
      };
      mediaItems.push(mapped);
      return res.json(mapped);
    }
  }

  res.status(404).json({ error: 'Title not found' });
});

// GET /api/news
app.get('/api/news', (_req: Request, res: Response) => {
  res.json({ articles: newsArticles });
});

// POST /api/news
app.post('/api/news', (req: Request, res: Response) => {
  const { title, excerpt, body, category, author, image, imageAlt } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');

  const newArticle: NewsArticle = {
    id: `art-${Date.now()}`,
    slug,
    title,
    excerpt: excerpt || title,
    body,
    category: category || 'Curation',
    image: image || 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg',
    imageAlt: imageAlt || title,
    author: author || 'ASTREON Editorial Board',
    authorRole: 'Contributor',
    readTime: `${Math.max(1, Math.ceil(body.split(' ').length / 200))} min read`,
    publishedAt: new Date().toISOString(),
    status: 'published'
  };

  newsArticles.unshift(newArticle);

  auditLogs.unshift({
    id: `log-${Date.now()}`,
    actor: req.body.actor || 'editor@astreon.org',
    action: 'PUBLISH_ARTICLE',
    targetType: 'article',
    targetId: newArticle.id,
    timestamp: new Date().toISOString(),
    details: `Published article: "${newArticle.title}"`
  });

  res.status(201).json(newArticle);
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

// POST /api/reviews
app.post('/api/reviews', (req: Request, res: Response) => {
  const { userId, userName, mediaId, mediaType, rating, reviewText } = req.body;
  if (!userId || !userName || !mediaId || rating === undefined || !reviewText) {
    return res.status(400).json({ error: 'Missing required review fields' });
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 10) {
    return res.status(400).json({ error: 'Rating must be a number between 1 and 10' });
  }

  if (reviewText.trim().length < 5 || reviewText.length > 2000) {
    return res.status(400).json({ error: 'Review text must be between 5 and 2000 characters' });
  }

  // Check for duplicate review by same user for same media
  const existing = reviews.find((r) => r.userId === userId && r.mediaId === Number(mediaId));
  if (existing) {
    // Update existing review
    existing.rating = numRating;
    existing.reviewText = reviewText.trim();
    existing.updatedAt = new Date().toISOString();
    return res.json({ message: 'Review updated successfully', review: existing });
  }

  const newReview: UserReview = {
    id: `rev-${Date.now()}`,
    userId,
    userName,
    mediaId: Number(mediaId),
    mediaType: mediaType || 'movie',
    rating: numRating,
    reviewText: reviewText.trim(),
    status: 'published',
    createdAt: new Date().toISOString(),
    helpfulCount: 0
  };

  reviews.unshift(newReview);
  res.status(201).json({ message: 'Review published', review: newReview });
});

// PATCH /api/reviews/:id (for moderation or status change)
app.patch('/api/reviews/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, actor } = req.body;
  const review = reviews.find((r) => r.id === id);
  if (!review) {
    return res.status(404).json({ error: 'Review not found' });
  }

  if (status && ['published', 'pending', 'flagged'].includes(status)) {
    review.status = status;
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      actor: actor || 'moderator@astreon.org',
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
app.get('/api/admin/metrics', (_req: Request, res: Response) => {
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
app.get('/api/admin/audit-logs', (_req: Request, res: Response) => {
  res.json({ logs: auditLogs });
});

// ======================== FRONTEND VITE MOUNT ========================

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ASTREON] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
