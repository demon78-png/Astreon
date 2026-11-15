import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTitleDeepLink,
  buildTitleSharePayload,
  shareTitleWithFallback
} from './share';
import { parseRoute } from './routing';

test('buildTitleDeepLink builds absolute deep-link URL that round-trips via parseRoute', () => {
  const url = buildTitleDeepLink('https://astreon.app/', {
    id: 693134,
    mediaType: 'movie'
  });

  assert.equal(url, 'https://astreon.app/?title=693134&type=movie');

  const parsedUrl = new URL(url);
  const route = parseRoute(parsedUrl.pathname, parsedUrl.search);
  assert.deepEqual(route, {
    view: 'discover',
    titleId: 693134,
    mediaType: 'movie',
    articleSlug: undefined,
    genre: undefined,
    year: undefined,
    minRating: undefined,
    sort: undefined,
    q: undefined
  });
});

test('buildTitleSharePayload formats title, year, tagline, and TV deep-link cleanly', () => {
  const payload = buildTitleSharePayload('https://astreon.app', {
    id: 95396,
    mediaType: 'tv',
    title: 'Severance',
    tagline: 'We are different people at work.',
    firstAirDate: '2022-02-18'
  });

  assert.equal(payload.title, 'Severance (2022) — ASTREON');
  assert.equal(payload.text, 'Severance — "We are different people at work."');
  assert.equal(payload.url, 'https://astreon.app/?title=95396&type=tv');
});

test('shareTitleWithFallback invokes native navigator.share when supported', async () => {
  let received: ShareData | null = null;
  let clipboardCalled = false;

  const outcome = await shareTitleWithFallback(
    {
      title: 'Dune: Part Two (2024) — ASTREON',
      text: 'Long live the fighters.',
      url: 'https://astreon.app/?title=693134&type=movie'
    },
    {
      canShareFn: () => true,
      shareFn: async (data) => {
        received = data;
      },
      writeClipboardFn: async () => {
        clipboardCalled = true;
      }
    }
  );

  assert.equal(outcome.status, 'shared');
  assert.equal(outcome.url, 'https://astreon.app/?title=693134&type=movie');
  assert.deepEqual(received, {
    title: 'Dune: Part Two (2024) — ASTREON',
    text: 'Long live the fighters.',
    url: 'https://astreon.app/?title=693134&type=movie'
  });
  assert.equal(clipboardCalled, false);
});

test('shareTitleWithFallback respects AbortError cancellation without copying to clipboard', async () => {
  let clipboardCalled = false;

  const outcome = await shareTitleWithFallback(
    {
      title: 'Oppenheimer — ASTREON',
      text: 'Discover Oppenheimer on ASTREON.',
      url: 'https://astreon.app/?title=872585&type=movie'
    },
    {
      shareFn: async () => {
        const err = new Error('Share canceled');
        err.name = 'AbortError';
        throw err;
      },
      writeClipboardFn: async () => {
        clipboardCalled = true;
      }
    }
  );

  assert.equal(outcome.status, 'cancelled');
  assert.equal(clipboardCalled, false);
});

test('shareTitleWithFallback falls back to clipboard when Web Share is unsupported or blocked, and to inline fallback when clipboard is unavailable', async () => {
  let copiedText = '';

  const copiedOutcome = await shareTitleWithFallback(
    {
      title: 'Interstellar — ASTREON',
      text: 'Discover Interstellar on ASTREON.',
      url: 'https://astreon.app/?title=157336&type=movie'
    },
    {
      shareFn: async () => {
        const err = new Error('Not allowed');
        err.name = 'NotAllowedError';
        throw err;
      },
      writeClipboardFn: async (text) => {
        copiedText = text;
      }
    }
  );

  assert.equal(copiedOutcome.status, 'copied');
  assert.equal(copiedText, 'https://astreon.app/?title=157336&type=movie');

  const inlineOutcome = await shareTitleWithFallback(
    {
      title: 'Interstellar — ASTREON',
      text: 'Discover Interstellar on ASTREON.',
      url: 'https://astreon.app/?title=157336&type=movie'
    },
    {}
  );

  assert.equal(inlineOutcome.status, 'fallback');
  assert.equal(inlineOutcome.url, 'https://astreon.app/?title=157336&type=movie');
});
