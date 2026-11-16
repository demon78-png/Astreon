import test from 'node:test';
import assert from 'node:assert/strict';
import type { HandlerContext, HandlerEvent } from '@netlify/functions';
import { normalizeNetlifyApiPath } from './netlify.ts';
import { handler } from '../../netlify/functions/api.ts';

function createMockEvent(overrides: Partial<HandlerEvent> = {}): HandlerEvent {
  return {
    rawUrl: 'https://astreon.netlify.app/api/health',
    rawQuery: '',
    path: '/api/health',
    httpMethod: 'GET',
    headers: { host: 'astreon.netlify.app' },
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body: null,
    isBase64Encoded: false,
    ...overrides
  };
}

const mockContext: HandlerContext = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: 'api',
  functionVersion: '$LATEST',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:000:function:api',
  memoryLimitInMB: '1024',
  awsRequestId: 'test-req-id',
  logGroupName: '/aws/lambda/api',
  logStreamName: 'test-stream',
  getRemainingTimeInMillis: () => 10000,
  done: () => {},
  fail: () => {},
  succeed: () => {}
};

test('normalizeNetlifyApiPath preserves /api routes and strips Netlify function prefix', () => {
  assert.equal(normalizeNetlifyApiPath('/api/health'), '/api/health');
  assert.equal(normalizeNetlifyApiPath('/.netlify/functions/api/health'), '/api/health');
  assert.equal(
    normalizeNetlifyApiPath('/.netlify/functions/api/tmdb/discover?type=movie&page=2'),
    '/api/tmdb/discover?type=movie&page=2'
  );
  assert.equal(normalizeNetlifyApiPath('/tmdb/search?q=dune'), '/api/tmdb/search?q=dune');
  assert.equal(normalizeNetlifyApiPath('/.netlify/functions/api'), '/api');
  assert.equal(normalizeNetlifyApiPath('/'), '/api');
});

test('Netlify function handler serves /api/health via /.netlify/functions/api/health', async () => {
  const res = await handler(
    createMockEvent({ path: '/.netlify/functions/api/health', httpMethod: 'GET' }),
    mockContext
  );
  assert.ok(res);
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body || '{}');
  assert.equal(body.status, 'healthy');
  assert.equal(body.platform, 'ASTREON');
});

test('Netlify function handler serves /api/tmdb/discover with query params', async () => {
  const res = await handler(
    createMockEvent({
      path: '/.netlify/functions/api/tmdb/discover',
      httpMethod: 'GET',
      rawQuery: 'type=movie&page=1',
      queryStringParameters: { type: 'movie', page: '1' }
    }),
    mockContext
  );
  assert.ok(res);
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body || '{}');
  assert.ok(Array.isArray(body.results));
  assert.ok(body.results.length > 0);
  assert.ok(body.results.every((item: any) => item.mediaType === 'movie'));
});

test('Netlify function handler serves /api/news and rejects unauthenticated admin endpoints', async () => {
  const newsRes = await handler(
    createMockEvent({ path: '/api/news', httpMethod: 'GET' }),
    mockContext
  );
  assert.ok(newsRes);
  assert.equal(newsRes.statusCode, 200);
  const newsBody = JSON.parse(newsRes.body || '{}');
  assert.ok(Array.isArray(newsBody.articles));
  assert.ok(newsBody.articles.length > 0);

  const adminRes = await handler(
    createMockEvent({ path: '/.netlify/functions/api/admin/metrics', httpMethod: 'GET' }),
    mockContext
  );
  assert.ok(adminRes);
  assert.equal(adminRes.statusCode, 401);
});

test('Netlify function handler validates media details params', async () => {
  const invalidRes = await handler(
    createMockEvent({ path: '/.netlify/functions/api/tmdb/details/movie/notanumber', httpMethod: 'GET' }),
    mockContext
  );
  assert.ok(invalidRes);
  assert.equal(invalidRes.statusCode, 400);
});

test('Netlify function handler serves /api/tmdb/upcoming with strictly future-dated titles', async () => {
  const res = await handler(
    createMockEvent({ path: '/.netlify/functions/api/tmdb/upcoming', httpMethod: 'GET' }),
    mockContext
  );
  assert.ok(res);
  assert.equal(res.statusCode, 200);
  const body = JSON.parse(res.body || '{}');
  assert.ok(Array.isArray(body.results));
  assert.ok(body.results.length > 0);
  assert.ok(typeof body.asOf === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.asOf));
  for (const item of body.results) {
    const releaseStr = item.releaseDate || item.firstAirDate || '';
    assert.ok(releaseStr > body.asOf, `Expected future date > ${body.asOf}, got ${releaseStr}`);
  }
});

test('Netlify function handler sets edge Cache-Control and serves TV seasons and person profiles', async () => {
  const newsRes = await handler(
    createMockEvent({ path: '/api/news', httpMethod: 'GET' }),
    mockContext
  );
  assert.ok(newsRes);
  const cc = newsRes.headers?.['cache-control'] || newsRes.headers?.['Cache-Control'];
  assert.match(String(cc || ''), /s-maxage=300/);

  // Seed person Denis Villeneuve (137427) / Timothée Chalamet (1190668)
  const personRes = await handler(
    createMockEvent({ path: '/.netlify/functions/api/tmdb/person/1190668', httpMethod: 'GET' }),
    mockContext
  );
  assert.ok(personRes);
  assert.equal(personRes.statusCode, 200);
  const personBody = JSON.parse(personRes.body || '{}');
  assert.equal(personBody.id, 1190668);
  assert.equal(personBody.name, 'Timothée Chalamet');
  assert.ok(Array.isArray(personBody.credits) && personBody.credits.length > 0);

  // Invalid person & invalid season return 400
  const badSeason = await handler(
    createMockEvent({ path: '/.netlify/functions/api/tmdb/tv/95396/season/abc', httpMethod: 'GET' }),
    mockContext
  );
  assert.equal(badSeason?.statusCode, 400);

  // Valid TV season request for Severance (95396) returns structured episodes
  const seasonRes = await handler(
    createMockEvent({ path: '/.netlify/functions/api/tmdb/tv/95396/season/1', httpMethod: 'GET' }),
    mockContext
  );
  assert.equal(seasonRes?.statusCode, 200);
  const seasonBody = JSON.parse(seasonRes?.body || '{}');
  assert.equal(seasonBody.seasonNumber, 1);
  assert.ok(Array.isArray(seasonBody.episodes) && seasonBody.episodes.length > 0);
});

test('TMDB 404 handling skips synthetic local IDs and caches negative lookups without console.warn noise', async () => {
  const prevKey = process.env.TMDB_API_KEY;
  const origFetch = globalThis.fetch;
  const origWarn = console.warn;

  const fetchCalls: string[] = [];
  const warnCalls: string[] = [];

  process.env.TMDB_API_KEY = 'test-tmdb-key-404-regression';
  console.warn = (...args: any[]) => {
    warnCalls.push(args.map(String).join(' '));
  };
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    fetchCalls.push(url);
    return new Response(
      JSON.stringify({ status_code: 34, status_message: 'The resource you requested could not be found.' }),
      { status: 404, statusText: 'Not Found', headers: { 'Content-Type': 'application/json' } }
    );
  }) as typeof fetch;

  try {
    // 1. Synthetic Coming Soon movie (9900001) & TV season (9900002) must NOT hit TMDB
    const synMovieRes = await handler(
      createMockEvent({ path: '/.netlify/functions/api/tmdb/details/movie/9900001', httpMethod: 'GET' }),
      mockContext
    );
    assert.equal(synMovieRes?.statusCode, 200);
    const synMovieBody = JSON.parse(synMovieRes?.body || '{}');
    assert.equal(synMovieBody.title, 'Meridian Drift');

    const synSeasonRes = await handler(
      createMockEvent({ path: '/.netlify/functions/api/tmdb/tv/9900002/season/1', httpMethod: 'GET' }),
      mockContext
    );
    assert.equal(synSeasonRes?.statusCode, 200);
    const synSeasonBody = JSON.parse(synSeasonRes?.body || '{}');
    assert.ok(Array.isArray(synSeasonBody.episodes) && synSeasonBody.episodes.length > 0);
    assert.equal(fetchCalls.length, 0, 'Synthetic local IDs >= 9900000 must not call TMDB');

    // 2. Non-synthetic 404 on TMDB should NOT emit console.warn and should be cached on repeat call
    const person404Res1 = await handler(
      createMockEvent({ path: '/.netlify/functions/api/tmdb/person/2987654', httpMethod: 'GET' }),
      mockContext
    );
    assert.equal(person404Res1?.statusCode, 404);
    assert.equal(fetchCalls.length, 1);

    const person404Res2 = await handler(
      createMockEvent({ path: '/.netlify/functions/api/tmdb/person/2987654', httpMethod: 'GET' }),
      mockContext
    );
    assert.equal(person404Res2?.statusCode, 404);
    assert.equal(fetchCalls.length, 1, 'Expected 404 negative lookup to be served from cache');

    const tmdbWarn = warnCalls.find((msg) => msg.includes('TMDB request failed'));
    assert.equal(tmdbWarn, undefined, `Unexpected stderr warning: ${tmdbWarn}`);
  } finally {
    globalThis.fetch = origFetch;
    console.warn = origWarn;
    if (prevKey === undefined) {
      delete process.env.TMDB_API_KEY;
    } else {
      process.env.TMDB_API_KEY = prevKey;
    }
  }
});

test('/api/reviews supports 1-5 star ratings with optional text, validation bounds, and updates', async () => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('identitytoolkit.googleapis.com/v1/accounts:lookup')) {
      return new Response(
        JSON.stringify({
          users: [
            {
              localId: 'test-uid-star-1',
              email: 'critic@astreon.example',
              emailVerified: true,
              displayName: 'Test Critic'
            }
          ]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(JSON.stringify({ error: 'unexpected fetch' }), { status: 500 });
  }) as typeof fetch;

  try {
    // 1. Rejects unauthenticated submission
    const unauthRes = await handler(
      createMockEvent({
        path: '/api/reviews',
        httpMethod: 'POST',
        headers: { host: 'astreon.netlify.app', 'content-type': 'application/json' },
        body: JSON.stringify({
          userName: 'Test Critic',
          mediaId: 693134,
          mediaType: 'movie',
          starRating: 5,
          reviewText: ''
        })
      }),
      mockContext
    );
    assert.equal(unauthRes?.statusCode, 401);

    // 2. Rejects out-of-range starRating (e.g. 6)
    const invalidRes = await handler(
      createMockEvent({
        path: '/api/reviews',
        httpMethod: 'POST',
        headers: {
          host: 'astreon.netlify.app',
          authorization: 'Bearer mock-star-token-1',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          userName: 'Test Critic',
          mediaId: 693134,
          mediaType: 'movie',
          starRating: 6,
          reviewText: ''
        })
      }),
      mockContext
    );
    assert.equal(invalidRes?.statusCode, 400);

    // 3. Accepts 1-5 star rating with empty reviewText and scales rating * 2
    const createRes = await handler(
      createMockEvent({
        path: '/api/reviews',
        httpMethod: 'POST',
        headers: {
          host: 'astreon.netlify.app',
          authorization: 'Bearer mock-star-token-1',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          userName: 'Test Critic',
          mediaId: 693134,
          mediaType: 'movie',
          starRating: 5,
          reviewText: ''
        })
      }),
      mockContext
    );
    assert.equal(createRes?.statusCode, 201);
    const createdBody = JSON.parse(createRes?.body || '{}');
    assert.equal(createdBody.review?.id, 'rev_movie_693134_test-uid-star-1');
    assert.equal(createdBody.review?.starRating, 5);
    assert.equal(createdBody.review?.rating, 10);
    assert.equal(createdBody.review?.reviewText, '');

    // 4. Updates existing star rating via PUT
    const updateRes = await handler(
      createMockEvent({
        path: '/api/reviews/rev_movie_693134_test-uid-star-1',
        httpMethod: 'PUT',
        headers: {
          host: 'astreon.netlify.app',
          authorization: 'Bearer mock-star-token-1',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          starRating: 4,
          reviewText: 'Stunning sound design.'
        })
      }),
      mockContext
    );
    assert.equal(updateRes?.statusCode, 200);
    const updatedBody = JSON.parse(updateRes?.body || '{}');
    assert.equal(updatedBody.review?.starRating, 4);
    assert.equal(updatedBody.review?.rating, 8);
    assert.equal(updatedBody.review?.reviewText, 'Stunning sound design.');

    // 5. GET /api/reviews reflects the updated review
    const listRes = await handler(
      createMockEvent({
        path: '/api/reviews',
        httpMethod: 'GET',
        rawQuery: 'mediaId=693134',
        queryStringParameters: { mediaId: '693134' }
      }),
      mockContext
    );
    assert.equal(listRes?.statusCode, 200);
    const listBody = JSON.parse(listRes?.body || '{}');
    const found = (listBody.reviews || []).find(
      (r: any) => r.id === 'rev_movie_693134_test-uid-star-1'
    );
    assert.ok(found);
    assert.equal(found.starRating, 4);

    // 6. GET /api/reviews supports ?mediaType= filtering to isolate movie vs tv collisions
    const tvFilterRes = await handler(
      createMockEvent({
        path: '/api/reviews',
        httpMethod: 'GET',
        rawQuery: 'mediaId=693134&mediaType=tv',
        queryStringParameters: { mediaId: '693134', mediaType: 'tv' }
      }),
      mockContext
    );
    assert.equal(tvFilterRes?.statusCode, 200);
    const tvFilterBody = JSON.parse(tvFilterRes?.body || '{}');
    assert.equal(
      (tvFilterBody.reviews || []).some((r: any) => r.id === 'rev_movie_693134_test-uid-star-1'),
      false
    );
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('/api/reports requires authentication, validates inputs, and persists valid moderation reports', async () => {
  const origFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('identitytoolkit.googleapis.com/v1/accounts:lookup')) {
      return new Response(
        JSON.stringify({
          users: [
            {
              localId: 'reporter-uid-1',
              email: 'reporter@astreon.example',
              emailVerified: true,
              displayName: 'Reporter'
            }
          ]
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(JSON.stringify({ error: 'unexpected fetch' }), { status: 500 });
  }) as typeof fetch;

  try {
    const unauth = await handler(
      createMockEvent({
        path: '/api/reports',
        httpMethod: 'POST',
        headers: { host: 'astreon.netlify.app', 'content-type': 'application/json' },
        body: JSON.stringify({ targetType: 'review', targetId: 'rev-1', reason: 'Spam' })
      }),
      mockContext
    );
    assert.equal(unauth?.statusCode, 401);

    const badPayload = await handler(
      createMockEvent({
        path: '/api/reports',
        httpMethod: 'POST',
        headers: {
          host: 'astreon.netlify.app',
          authorization: 'Bearer mock-reporter-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({ targetType: 'invalid_type', targetId: 'rev-1', reason: 'Spam' })
      }),
      mockContext
    );
    assert.equal(badPayload?.statusCode, 400);

    const okRes = await handler(
      createMockEvent({
        path: '/api/reports',
        httpMethod: 'POST',
        headers: {
          host: 'astreon.netlify.app',
          authorization: 'Bearer mock-reporter-token',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          targetType: 'review',
          targetId: 'rev-1',
          reason: 'Abusive language'
        })
      }),
      mockContext
    );
    assert.equal(okRes?.statusCode, 200);
    const body = JSON.parse(okRes?.body || '{}');
    assert.equal(body.success, true);
    assert.match(String(body.message || ''), /queued for review/i);
  } finally {
    globalThis.fetch = origFetch;
  }
});

