import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LOCALE_CONFIGS,
  I18N_DICTIONARY,
  translateUi,
  mapGenreLabel,
  resolveInitialLocale,
  getLanguageSwitcherLocales,
  getNextLanguageLocale,
  UiTranslationKey
} from './i18n';

test('all supported locales define complete UI dictionary keys matching English baseline', () => {
  const englishKeys = Object.keys(I18N_DICTIONARY.en) as UiTranslationKey[];
  for (const cfg of LOCALE_CONFIGS) {
    const dict = I18N_DICTIONARY[cfg.code];
    assert.ok(dict, `Missing dictionary for ${cfg.code}`);
    for (const key of englishKeys) {
      assert.equal(
        typeof dict[key],
        'string',
        `Missing translation key "${key}" for locale "${cfg.code}"`
      );
      assert.ok(
        dict[key].trim().length > 0,
        `Empty translation key "${key}" for locale "${cfg.code}"`
      );
    }
  }
});

test('translateUi interpolates variables cleanly across locales', () => {
  assert.equal(translateUi('en', 'catalog.showingCount', { count: 24 }), 'Showing 24 titles');
  assert.equal(translateUi('es', 'catalog.showingCount', { count: 24 }), 'Mostrando 24 títulos');
  assert.equal(translateUi('fr', 'catalog.showingCount', { count: 24 }), '24 titres affichés');
  assert.equal(
    translateUi('ja', 'editorial.byAuthor', { author: 'Elena Vance' }),
    '執筆: Elena Vance'
  );
});

test('mapGenreLabel translates canonical genre labels without altering English baseline', () => {
  assert.equal(mapGenreLabel('Science Fiction', 'en'), 'Science Fiction');
  assert.equal(mapGenreLabel('Science Fiction', 'es'), 'Ciencia Ficción');
  assert.equal(mapGenreLabel('Science Fiction', 'fr'), 'Science-Fiction');
  assert.equal(mapGenreLabel('Science Fiction', 'ja'), 'SF');
  assert.equal(mapGenreLabel('Science Fiction', 'pt'), 'Ficção Científica');
  assert.equal(mapGenreLabel('Unknown Custom Genre', 'es'), 'Unknown Custom Genre');
});

test('resolveInitialLocale respects valid persisted locales and defaults safely to en', () => {
  assert.equal(resolveInitialLocale('es'), 'es');
  assert.equal(resolveInitialLocale('ja'), 'ja');
  assert.equal(resolveInitialLocale('invalid-code'), 'en');
  assert.equal(resolveInitialLocale(null), 'en');
});

test('getLanguageSwitcherLocales returns English, Spanish, French, and Japanese in order', () => {
  const options = getLanguageSwitcherLocales();
  assert.deepEqual(
    options.map((o) => o.code),
    ['en', 'es', 'fr', 'ja']
  );
  assert.deepEqual(
    options.map((o) => o.englishName),
    ['English', 'Spanish', 'French', 'Japanese']
  );
  assert.deepEqual(
    options.map((o) => o.tmdbLanguage),
    ['en-US', 'es-ES', 'fr-FR', 'ja-JP']
  );
});

test('getNextLanguageLocale cycles cleanly across English, Spanish, French, and Japanese', () => {
  assert.equal(getNextLanguageLocale('en'), 'es');
  assert.equal(getNextLanguageLocale('es'), 'fr');
  assert.equal(getNextLanguageLocale('fr'), 'ja');
  assert.equal(getNextLanguageLocale('ja'), 'en');
  assert.equal(getNextLanguageLocale('de'), 'en');
});
