import type { MediaType, FilterState } from '../types/entertainment.ts';

export type AppView = 'discover' | 'movies' | 'tv' | 'news' | 'account' | 'admin' | 'list';
export type AccountSubTab = 'watchlist' | 'favorites' | 'history' | 'collections' | 'profile';

export interface CatalogFilterParams {
  genre?: string;
  year?: string;
  minRating?: number;
  sort?: FilterState['sortBy'];
  q?: string;
}

export interface ParsedRoute extends CatalogFilterParams {
  view: AppView;
  accountTab?: AccountSubTab;
  collectionId?: string;
  titleId?: number;
  mediaType?: MediaType;
  articleSlug?: string;
}

const VALID_SORTS = new Set<FilterState['sortBy']>([
  'popularity.desc',
  'vote_average.desc',
  'primary_release_date.desc',
  'title.asc'
]);

const VIEW_TO_PATH: Record<AppView, string> = {
  discover: '/',
  movies: '/movies',
  tv: '/tv',
  news: '/news',
  account: '/account',
  admin: '/admin',
  list: '/list'
};

const PATH_TO_VIEW: Record<string, AppView> = {
  '/': 'discover',
  '/discover': 'discover',
  '/movies': 'movies',
  '/tv': 'tv',
  '/news': 'news',
  '/editorial': 'news',
  '/account': 'account',
  '/watchlist': 'account',
  '/favorites': 'account',
  '/history': 'account',
  '/collections': 'account',
  '/admin': 'admin',
  '/list': 'list'
};

/**
 * Parse a browser pathname and query search string into structured ASTREON route state
 */
export function parseRoute(pathname: string, search: string = ''): ParsedRoute {
  const normalizedPath = ((pathname || '/').replace(/\/+$/, '') || '/').toLowerCase();
  const view: AppView = PATH_TO_VIEW[normalizedPath] || 'discover';

  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const rawTitle = params.get('title');
  const rawType = params.get('type');
  const rawArticle = params.get('article');
  const rawGenre = params.get('genre');
  const rawYear = params.get('year');
  const rawMinRating = params.get('minRating');
  const rawSort = params.get('sort') as FilterState['sortBy'] | null;
  const rawQ = params.get('q');
  const rawTab = params.get('tab');
  const rawCollectionId = params.get('id');

  let accountTab: AccountSubTab | undefined;
  if (normalizedPath === '/watchlist') {
    accountTab = 'watchlist';
  } else if (normalizedPath === '/favorites') {
    accountTab = 'favorites';
  } else if (normalizedPath === '/history') {
    accountTab = 'history';
  } else if (normalizedPath === '/collections') {
    accountTab = 'collections';
  } else if (
    view === 'account' &&
    (rawTab === 'watchlist' ||
      rawTab === 'favorites' ||
      rawTab === 'history' ||
      rawTab === 'collections' ||
      rawTab === 'profile')
  ) {
    accountTab = rawTab;
  }

  const collectionId =
    view === 'list' && rawCollectionId && /^[a-zA-Z0-9_-]{1,128}$/.test(rawCollectionId.trim())
      ? rawCollectionId.trim()
      : undefined;

  let titleId: number | undefined;
  if (rawTitle && /^\d+$/.test(rawTitle)) {
    const parsed = parseInt(rawTitle, 10);
    if (parsed > 0) titleId = parsed;
  }

  const mediaType: MediaType | undefined =
    rawType === 'movie' || rawType === 'tv' ? rawType : undefined;

  const articleSlug = rawArticle && rawArticle.trim().length > 0 ? rawArticle.trim() : undefined;

  let minRating: number | undefined;
  if (rawMinRating) {
    const parsedRating = parseFloat(rawMinRating);
    if (!isNaN(parsedRating) && parsedRating > 0 && parsedRating <= 10) {
      minRating = parsedRating;
    }
  }

  return {
    view,
    ...(accountTab ? { accountTab } : {}),
    ...(collectionId ? { collectionId } : {}),
    titleId,
    mediaType,
    articleSlug,
    genre: rawGenre && rawGenre !== 'All' ? rawGenre.trim() : undefined,
    year: rawYear && /^\d{4}$/.test(rawYear) ? rawYear : undefined,
    minRating,
    sort: rawSort && VALID_SORTS.has(rawSort) ? rawSort : undefined,
    q: rawQ && rawQ.trim().length > 0 ? rawQ.trim() : undefined
  };
}

/**
 * Serialize ASTREON route state back into a clean relative URL path + query string
 */
export function buildRouteUrl(route: ParsedRoute): string {
  let basePath = VIEW_TO_PATH[route.view] || '/';
  if (route.view === 'account') {
    if (route.accountTab === 'watchlist') basePath = '/watchlist';
    else if (route.accountTab === 'favorites') basePath = '/favorites';
    else if (route.accountTab === 'history') basePath = '/history';
    else if (route.accountTab === 'collections') basePath = '/collections';
  }
  const params = new URLSearchParams();

  if (route.view === 'account' && route.accountTab === 'profile') {
    params.set('tab', 'profile');
  }

  if (route.view === 'list' && route.collectionId) {
    params.set('id', route.collectionId);
  }

  if (route.titleId && route.titleId > 0) {
    params.set('title', String(route.titleId));
    if (route.mediaType) {
      params.set('type', route.mediaType);
    }
  }

  if (route.view === 'news' && route.articleSlug) {
    params.set('article', route.articleSlug);
  }

  if (route.view === 'movies' || route.view === 'tv') {
    if (route.genre && route.genre !== 'All') params.set('genre', route.genre);
    if (route.year && route.year !== 'All') params.set('year', route.year);
    if (route.minRating && route.minRating > 0) params.set('minRating', String(route.minRating));
    if (route.sort && route.sort !== 'popularity.desc') params.set('sort', route.sort);
    if (route.q && route.q.trim()) params.set('q', route.q.trim());
  }

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
