import test from 'node:test';
import assert from 'node:assert/strict';
import {
  translateTextWithBrowser,
  detectBrowserTranslatorAvailability,
  localizeMediaItem,
  localizeNewsArticle,
  clearTranslationMemoryCache
} from './translator';
import { SEED_MEDIA, SEED_NEWS } from '../data/seedData';

test('detectBrowserTranslatorAvailability detects Web Platform Translator API when present', async () => {
  const mockHost = {
    Translator: {
      availability: async () => 'available',
      create: async () => ({ translate: async (s: string) => s })
    }
  };
  assert.equal(await detectBrowserTranslatorAvailability('es', mockHost), 'native-browser-api');
  assert.equal(await detectBrowserTranslatorAvailability('es', {}), 'localized-pack');
});

test('translateTextWithBrowser invokes native Translator API and caches repeated requests', async () => {
  clearTranslationMemoryCache();
  let translateCalls = 0;
  const mockHost = {
    Translator: {
      availability: async () => 'available',
      create: async () => ({
        translate: async (text: string) => {
          translateCalls += 1;
          return `[ES] ${text}`;
        }
      })
    }
  };

  const first = await translateTextWithBrowser('A sweeping desert epic', 'es', mockHost);
  const second = await translateTextWithBrowser('A sweeping desert epic', 'es', mockHost);

  assert.equal(first, '[ES] A sweeping desert epic');
  assert.equal(second, '[ES] A sweeping desert epic');
  assert.equal(translateCalls, 1);

  const passthrough = await translateTextWithBrowser('English stays untouched', 'en', mockHost);
  assert.equal(passthrough, 'English stays untouched');
});

test('localizeMediaItem applies curated seed translation and preserves canonical genres', async () => {
  clearTranslationMemoryCache();
  const dune = SEED_MEDIA[0];
  const localizedEs = await localizeMediaItem(dune, 'es', {});
  assert.equal(localizedEs.title, 'Dune: Parte Dos');
  assert.equal(localizedEs.tagline, 'Larga vida a los combatientes.');
  assert.deepEqual(localizedEs.genres, dune.genres);

  const restoredEn = await localizeMediaItem(dune, 'en', {});
  assert.equal(restoredEn.title, dune.title);
});

test('localizeMediaItem translates unseeded live TMDB items when browser Translator API is present', async () => {
  clearTranslationMemoryCache();
  const liveItem = {
    id: 9999999,
    title: 'Orbital Horizon',
    overview: 'Astronauts search for life beyond Jupiter.',
    mediaType: 'movie' as const,
    voteAverage: 7.9,
    voteCount: 300,
    genres: ['Science Fiction'],
    posterPath: '',
    backdropPath: ''
  };
  const mockHost = {
    Translator: {
      availability: async () => 'available',
      create: async () => ({
        translate: async (text: string) => `TR_FR(${text})`
      })
    }
  };

  const localized = await localizeMediaItem(liveItem, 'fr', mockHost);
  assert.equal(localized.overview, 'TR_FR(Astronauts search for life beyond Jupiter.)');
});

test('localizeNewsArticle returns localized editorial article metadata and content', async () => {
  clearTranslationMemoryCache();
  const firstArticle = SEED_NEWS[0];
  const localizedFr = await localizeNewsArticle(firstArticle, 'fr', {});
  assert.ok(localizedFr.title.includes('Arrakis'));
  assert.notEqual(localizedFr.title, firstArticle.title);
  assert.equal(localizedFr.category, 'Analyse');
});
