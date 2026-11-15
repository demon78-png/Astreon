import type {
  MediaType,
  WatchAvailabilityGroupKey,
  WatchProvider,
  WatchProviderGroup
} from '../types/entertainment.ts';

export interface ProviderRegionOption {
  code: string;
  label: string;
}

export const SUPPORTED_PROVIDER_REGIONS: ProviderRegionOption[] = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'ES', label: 'Spain' },
  { code: 'JP', label: 'Japan' },
  { code: 'BR', label: 'Brazil' },
  { code: 'MX', label: 'Mexico' },
  { code: 'IN', label: 'India' },
  { code: 'KR', label: 'South Korea' }
];

const VALID_REGION_CODES = new Set(SUPPORTED_PROVIDER_REGIONS.map((r) => r.code));

const KNOWN_PROVIDER_URLS: Array<[RegExp, string]> = [
  [/amazon\s*channel|prime\s*video|amazon\s*video/i, 'https://www.primevideo.com'],
  [/apple\s*tv/i, 'https://tv.apple.com'],
  [/youtube\s*tv/i, 'https://tv.youtube.com'],
  [/youtube/i, 'https://www.youtube.com/movies'],
  [/google\s*play/i, 'https://play.google.com/store/movies'],
  [/hbo\s*max|\bmax\b/i, 'https://www.max.com'],
  [/netflix/i, 'https://www.netflix.com'],
  [/disney/i, 'https://www.disneyplus.com'],
  [/hulu/i, 'https://www.hulu.com'],
  [/peacock/i, 'https://www.peacocktv.com'],
  [/paramount/i, 'https://www.paramountplus.com'],
  [/crunchyroll/i, 'https://www.crunchyroll.com'],
  [/mubi/i, 'https://mubi.com'],
  [/criterion/i, 'https://www.criterionchannel.com'],
  [/tubi/i, 'https://tubitv.com'],
  [/pluto/i, 'https://pluto.tv'],
  [/fandango|vudu/i, 'https://athome.fandango.com'],
  [/starz/i, 'https://www.starz.com'],
  [/mgm\+|mgm\s*plus/i, 'https://www.mgmplus.com'],
  [/amc\+|amc\s*plus|\bamc\b/i, 'https://www.amc.com'],
  [/shudder/i, 'https://www.shudder.com'],
  [/fubo/i, 'https://www.fubo.tv'],
  [/freevee/i, 'https://www.amazon.com/freevee'],
  [/britbox/i, 'https://www.britbox.com'],
  [/acorn/i, 'https://www.acorn.tv'],
  [/showtime/i, 'https://www.paramountplus.com'],
  [/kanopy/i, 'https://www.kanopy.com'],
  [/hoopla/i, 'https://www.hoopladigital.com'],
  [/plex/i, 'https://watch.plex.tv'],
  [/roku/i, 'https://therokuchannel.roku.com'],
  [/bbc\s*iplayer/i, 'https://www.bbc.co.uk/iplayer'],
  [/itvx/i, 'https://www.itv.com'],
  [/rakuten/i, 'https://www.rakuten.tv'],
  [/curzon/i, 'https://homecinema.curzon.com'],
  [/bfi/i, 'https://player.bfi.org.uk'],
  [/sky\s*go|sky\s*store|\bnow\b/i, 'https://www.nowtv.com'],
  [/crave/i, 'https://www.crave.ca']
];

const PROVIDER_TITLE_SEARCH_BUILDERS: Array<[RegExp, (encodedTitle: string) => string]> = [
  [/amazon\s*channel|prime\s*video|amazon\s*video/i, (q) => `https://www.amazon.com/s?k=${q}&i=instant-video`],
  [/apple\s*tv/i, (q) => `https://tv.apple.com/search?term=${q}`],
  [/youtube\s*tv/i, (q) => `https://tv.youtube.com/search/${q}`],
  [/youtube/i, (q) => `https://www.youtube.com/results?search_query=${q}`],
  [/google\s*play/i, (q) => `https://play.google.com/store/search?q=${q}&c=movies`],
  [/hbo\s*max|\bmax\b/i, (q) => `https://play.max.com/search?q=${q}`],
  [/netflix/i, (q) => `https://www.netflix.com/search?q=${q}`],
  [/disney/i, (q) => `https://www.disneyplus.com/search?q=${q}`],
  [/hulu/i, (q) => `https://www.hulu.com/search?q=${q}`],
  [/peacock/i, (q) => `https://www.peacocktv.com/watch/search?q=${q}`],
  [/paramount/i, (q) => `https://www.paramountplus.com/search/?q=${q}`],
  [/crunchyroll/i, (q) => `https://www.crunchyroll.com/search?q=${q}`],
  [/mubi/i, (q) => `https://mubi.com/en/search/films?query=${q}`],
  [/tubi/i, (q) => `https://tubitv.com/search/${q}`],
  [/plex/i, (q) => `https://watch.plex.tv/search?q=${q}`],
  [/kanopy/i, (q) => `https://www.kanopy.com/en/search?query=${q}`],
  [/fandango|vudu/i, (q) => `https://athome.fandango.com/content/browse/search?searchString=${q}`],
  [/bbc\s*iplayer/i, (q) => `https://www.bbc.co.uk/iplayer/search?q=${q}`],
  [/rakuten/i, (q) => `https://www.rakuten.tv/uk/search?q=${q}`],
  [/roku/i, (q) => `https://therokuchannel.roku.com/search?q=${q}`],
  [/shudder/i, (q) => `https://www.shudder.com/search?q=${q}`]
];

const SAFE_HTTP_URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

export function isSafeHttpUrl(url?: string | null): url is string {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return SAFE_HTTP_URL_REGEX.test(trimmed);
}

export function normalizeProviderRegion(region?: string | null): string {
  const upper = (region || '').trim().toUpperCase();
  return VALID_REGION_CODES.has(upper) ? upper : 'US';
}

export function detectDefaultRegion(localeHint?: string | null): string {
  const candidates: string[] = [];
  if (localeHint) candidates.push(localeHint);
  if (typeof navigator !== 'undefined' && navigator.language) {
    candidates.push(navigator.language);
  }
  for (const tag of candidates) {
    const match = tag.match(/[-_]([A-Za-z]{2})\b/);
    if (match) {
      const code = match[1].toUpperCase();
      if (VALID_REGION_CODES.has(code)) return code;
    }
  }
  return 'US';
}

export function buildTmdbWatchPageUrl(
  mediaType: MediaType,
  mediaId: number,
  region?: string
): string {
  const safeType: MediaType = mediaType === 'tv' ? 'tv' : 'movie';
  const base = `https://www.themoviedb.org/${safeType}/${mediaId}/watch`;
  if (region && VALID_REGION_CODES.has(region.toUpperCase())) {
    return `${base}?locale=${region.toUpperCase()}`;
  }
  return base;
}

export function findKnownProviderUrl(providerName: string): string | undefined {
  const normalized = (providerName || '').trim();
  if (!normalized) return undefined;
  for (const [pattern, url] of KNOWN_PROVIDER_URLS) {
    if (pattern.test(normalized)) {
      return url;
    }
  }
  return undefined;
}

function isDeepProviderLink(url?: string | null): boolean {
  if (!isSafeHttpUrl(url)) return false;
  try {
    const parsed = new URL(url);
    const hasMeaningfulPath =
      parsed.pathname &&
      parsed.pathname !== '/' &&
      parsed.pathname !== '/movies';
    return Boolean(hasMeaningfulPath || parsed.search);
  } catch {
    return false;
  }
}

/**
 * Resolve a title-specific streaming/search URL when mediaTitle is available,
 * while preserving explicit deep links and falling back safely to TMDB watch pages.
 */
export function buildProviderSearchOrWatchUrl(
  provider: Pick<WatchProvider, 'providerName' | 'link'>,
  mediaTitle: string,
  mediaType: MediaType,
  mediaId: number,
  regionWatchLink?: string,
  region?: string
): string {
  if (provider.link && isDeepProviderLink(provider.link)) {
    return provider.link.trim();
  }

  const cleanTitle = (mediaTitle || '').trim();
  const normalizedName = (provider.providerName || '').trim();
  if (cleanTitle && normalizedName) {
    const encoded = encodeURIComponent(cleanTitle);
    for (const [pattern, builder] of PROVIDER_TITLE_SEARCH_BUILDERS) {
      if (pattern.test(normalizedName)) {
        return builder(encoded);
      }
    }
  }

  if (isSafeHttpUrl(provider.link)) {
    return provider.link.trim();
  }
  const directPlatformUrl = findKnownProviderUrl(normalizedName);
  if (directPlatformUrl) {
    return directPlatformUrl;
  }
  if (isSafeHttpUrl(regionWatchLink)) {
    return regionWatchLink.trim();
  }
  return buildTmdbWatchPageUrl(mediaType, mediaId, region);
}

export function resolveWatchProviderUrl(
  provider: Pick<WatchProvider, 'providerName' | 'link'>,
  mediaType: MediaType,
  mediaId: number,
  regionWatchLink?: string
): string {
  if (isSafeHttpUrl(provider.link)) {
    return provider.link.trim();
  }
  const directPlatformUrl = findKnownProviderUrl(provider.providerName);
  if (directPlatformUrl) {
    return directPlatformUrl;
  }
  if (isSafeHttpUrl(regionWatchLink)) {
    return regionWatchLink.trim();
  }
  return buildTmdbWatchPageUrl(mediaType, mediaId);
}

export function groupProvidersByAvailability(providers: WatchProvider[]): WatchProviderGroup[] {
  if (!Array.isArray(providers) || providers.length === 0) return [];
  const buckets: Record<WatchAvailabilityGroupKey, WatchProvider[]> = {
    stream: [],
    free: [],
    rent: [],
    buy: []
  };

  for (const p of providers) {
    if (p.type === 'flatrate') buckets.stream.push(p);
    else if (p.type === 'free' || p.type === 'ads') buckets.free.push(p);
    else if (p.type === 'rent') buckets.rent.push(p);
    else if (p.type === 'buy') buckets.buy.push(p);
  }

  const order: WatchAvailabilityGroupKey[] = ['stream', 'free', 'rent', 'buy'];
  return order
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({ key, providers: buckets[key] }));
}

interface TmdbRawProvider {
  provider_id: number;
  provider_name: string;
  logo_path?: string | null;
}

interface TmdbCountryProviders {
  link?: string;
  flatrate?: TmdbRawProvider[];
  free?: TmdbRawProvider[];
  ads?: TmdbRawProvider[];
  rent?: TmdbRawProvider[];
  buy?: TmdbRawProvider[];
}

const PREFERRED_REGIONS = ['US', 'GB', 'CA', 'AU'] as const;
const AVAILABILITY_BUCKETS: Array<WatchProvider['type']> = [
  'flatrate',
  'free',
  'ads',
  'rent',
  'buy'
];

function hasAnyProviderEntries(country?: TmdbCountryProviders): boolean {
  if (!country) return false;
  return AVAILABILITY_BUCKETS.some(
    (bucket) => Array.isArray(country[bucket]) && country[bucket]!.length > 0
  );
}

export function extractTmdbWatchProvidersWithRegion(
  watchProvidersPayload: { results?: Record<string, TmdbCountryProviders> } | undefined,
  mediaType: MediaType,
  mediaId: number,
  maxProviders: number = 12,
  preferredRegion?: string
): { providers: WatchProvider[]; regionUsed: string | null } {
  const results = watchProvidersPayload?.results;
  if (!results || typeof results !== 'object') {
    return { providers: [], regionUsed: null };
  }

  let chosenCountry: TmdbCountryProviders | undefined;
  let chosenCode: string | null = null;

  const requested = preferredRegion ? preferredRegion.trim().toUpperCase() : '';
  const searchOrder = requested
    ? [requested, ...PREFERRED_REGIONS.filter((r) => r !== requested)]
    : [...PREFERRED_REGIONS];

  for (const region of searchOrder) {
    if (hasAnyProviderEntries(results[region])) {
      chosenCountry = results[region];
      chosenCode = region;
      break;
    }
  }

  if (!chosenCountry) {
    for (const [code, country] of Object.entries(results)) {
      if (hasAnyProviderEntries(country)) {
        chosenCountry = country;
        chosenCode = code;
        break;
      }
    }
  }

  if (!chosenCountry) {
    return { providers: [], regionUsed: null };
  }

  const regionLink = isSafeHttpUrl(chosenCountry.link) ? chosenCountry.link.trim() : undefined;
  const collected: WatchProvider[] = [];
  const seenKeys = new Set<string>();

  for (const bucket of AVAILABILITY_BUCKETS) {
    const list = chosenCountry[bucket];
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      if (!raw || !raw.provider_id || !raw.provider_name) continue;
      const dedupeKey = String(raw.provider_id);
      if (seenKeys.has(dedupeKey)) continue;
      seenKeys.add(dedupeKey);

      collected.push({
        providerId: raw.provider_id,
        providerName: raw.provider_name,
        logoPath: raw.logo_path ? `https://image.tmdb.org/t/p/w92${raw.logo_path}` : undefined,
        type: bucket,
        link: resolveWatchProviderUrl(
          { providerName: raw.provider_name },
          mediaType,
          mediaId,
          regionLink
        )
      });

      if (collected.length >= maxProviders) {
        return { providers: collected, regionUsed: chosenCode };
      }
    }
  }

  return { providers: collected, regionUsed: chosenCode };
}

export function extractTmdbWatchProviders(
  watchProvidersPayload: { results?: Record<string, TmdbCountryProviders> } | undefined,
  mediaType: MediaType,
  mediaId: number,
  maxProviders: number = 8,
  preferredRegion?: string
): WatchProvider[] {
  return extractTmdbWatchProvidersWithRegion(
    watchProvidersPayload,
    mediaType,
    mediaId,
    maxProviders,
    preferredRegion
  ).providers;
}
