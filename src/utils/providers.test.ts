import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveWatchProviderUrl,
  extractTmdbWatchProviders,
  extractTmdbWatchProvidersWithRegion,
  buildProviderSearchOrWatchUrl,
  groupProvidersByAvailability,
  detectDefaultRegion,
  isSafeHttpUrl
} from './providers.ts';

test('isSafeHttpUrl accepts http/https URLs and rejects fragments or unsafe schemes', () => {
  assert.equal(isSafeHttpUrl('https://www.max.com'), true);
  assert.equal(isSafeHttpUrl('http://example.com/watch'), true);
  assert.equal(isSafeHttpUrl('#'), false);
  assert.equal(isSafeHttpUrl(''), false);
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false);
  assert.equal(isSafeHttpUrl(undefined), false);
});

test('resolveWatchProviderUrl preserves explicit links, resolves known platforms, and falls back safely', () => {
  assert.equal(
    resolveWatchProviderUrl(
      { providerName: 'Max', link: 'https://play.max.com/title/123' },
      'movie',
      693134
    ),
    'https://play.max.com/title/123'
  );

  // Repairs missing or '#' links using canonical platform URL
  assert.equal(
    resolveWatchProviderUrl({ providerName: 'HBO Max', link: '#' }, 'movie', 693134),
    'https://www.max.com'
  );
  assert.equal(
    resolveWatchProviderUrl({ providerName: 'HBO Max Amazon Channel' }, 'movie', 693134),
    'https://www.primevideo.com'
  );
  assert.equal(
    resolveWatchProviderUrl({ providerName: 'YouTube TV' }, 'movie', 693134),
    'https://tv.youtube.com'
  );

  // Unknown provider falls back to TMDB region link if present, else canonical TMDB watch URL
  assert.equal(
    resolveWatchProviderUrl(
      { providerName: 'Regional Cinema Vault' },
      'movie',
      27205,
      'https://www.themoviedb.org/movie/27205-inception/watch?locale=US'
    ),
    'https://www.themoviedb.org/movie/27205-inception/watch?locale=US'
  );
  assert.equal(
    resolveWatchProviderUrl({ providerName: 'Regional Cinema Vault' }, 'tv', 95396),
    'https://www.themoviedb.org/tv/95396/watch'
  );
});

test('buildProviderSearchOrWatchUrl generates title-specific platform search URLs and preserves deep links', () => {
  assert.equal(
    buildProviderSearchOrWatchUrl(
      { providerName: 'Apple TV', link: 'https://tv.apple.com' },
      'Dune: Part Two',
      'movie',
      693134
    ),
    'https://tv.apple.com/search?term=Dune%3A%20Part%20Two'
  );
  assert.equal(
    buildProviderSearchOrWatchUrl(
      { providerName: 'Max', link: 'https://www.max.com' },
      'Dune: Part Two',
      'movie',
      693134
    ),
    'https://play.max.com/search?q=Dune%3A%20Part%20Two'
  );
  assert.equal(
    buildProviderSearchOrWatchUrl(
      { providerName: 'Netflix', link: 'https://www.netflix.com/title/80057281' },
      'Stranger Things',
      'tv',
      66732
    ),
    'https://www.netflix.com/title/80057281'
  );
  assert.equal(
    buildProviderSearchOrWatchUrl(
      { providerName: 'Unknown Local Stream' },
      'Severance',
      'tv',
      95396,
      undefined,
      'GB'
    ),
    'https://www.themoviedb.org/tv/95396/watch?locale=GB'
  );
});

test('groupProvidersByAvailability organizes providers into stream, free, rent, and buy tiers', () => {
  const groups = groupProvidersByAvailability([
    { providerId: 2, providerName: 'Apple TV', type: 'rent' },
    { providerId: 8, providerName: 'Netflix', type: 'flatrate' },
    { providerId: 73, providerName: 'Tubi', type: 'ads' },
    { providerId: 3, providerName: 'Amazon Video', type: 'buy' },
    { providerId: 38, providerName: 'BBC iPlayer', type: 'free' }
  ]);

  assert.deepEqual(
    groups.map((g) => g.key),
    ['stream', 'free', 'rent', 'buy']
  );
  assert.equal(groups[1].providers.length, 2); // free + ads grouped under free
});

test('extractTmdbWatchProviders pulls flatrate + rent/buy deduplicated providers with valid links', () => {
  const payload = {
    results: {
      US: {
        link: 'https://www.themoviedb.org/movie/27205-inception/watch?locale=US',
        flatrate: [
          { provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.jpg' }
        ],
        rent: [
          { provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.jpg' },
          { provider_id: 2, provider_name: 'Apple TV', logo_path: '/apple.jpg' },
          { provider_id: 99999, provider_name: 'Indie Boutique Stream', logo_path: null }
        ]
      }
    }
  };

  const providers = extractTmdbWatchProviders(payload, 'movie', 27205);
  assert.equal(providers.length, 3);
  assert.equal(providers[0].providerName, 'Netflix');
  assert.equal(providers[0].type, 'flatrate');
  assert.equal(providers[0].link, 'https://www.netflix.com');
  assert.equal(providers[1].providerName, 'Apple TV');
  assert.equal(providers[1].type, 'rent');
  assert.equal(providers[1].link, 'https://tv.apple.com');
  assert.equal(providers[2].providerName, 'Indie Boutique Stream');
  assert.equal(
    providers[2].link,
    'https://www.themoviedb.org/movie/27205-inception/watch?locale=US'
  );
});

test('extractTmdbWatchProvidersWithRegion respects requested region and falls back gracefully', () => {
  const payload = {
    results: {
      US: {
        link: 'https://www.themoviedb.org/tv/999/watch?locale=US',
        flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/nf.png' }]
      },
      GB: {
        link: 'https://www.themoviedb.org/tv/999/watch?locale=GB',
        free: [{ provider_id: 38, provider_name: 'BBC iPlayer', logo_path: '/bbc.png' }]
      }
    }
  };

  const gb = extractTmdbWatchProvidersWithRegion(payload, 'tv', 999, 8, 'GB');
  assert.equal(gb.regionUsed, 'GB');
  assert.equal(gb.providers[0].providerName, 'BBC iPlayer');

  assert.equal(detectDefaultRegion('en-GB'), 'GB');
  assert.equal(detectDefaultRegion('ja-JP'), 'JP');
  assert.equal(detectDefaultRegion('en'), 'US');
});

