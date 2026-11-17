import test from 'node:test';
import assert from 'node:assert/strict';
import type { StorageLike } from './analytics.ts';
import {
  RECENT_SEARCHES_STORAGE_KEY,
  MAX_RECENT_SEARCHES,
  getRecentSearchesStorageKey,
  loadRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches
} from './recentSearches.ts';

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
    removeItem(key: string) {
      map.delete(key);
    }
  };
}

test('loadRecentSearches returns empty array on missing or corrupted localStorage', () => {
  const emptyStorage = createMemoryStorage();
  assert.deepEqual(loadRecentSearches(emptyStorage), []);

  const brokenStorage = createMemoryStorage({ [RECENT_SEARCHES_STORAGE_KEY]: '{invalid json' });
  assert.deepEqual(loadRecentSearches(brokenStorage), []);

  const nonArrayStorage = createMemoryStorage({ [RECENT_SEARCHES_STORAGE_KEY]: '"hello"' });
  assert.deepEqual(loadRecentSearches(nonArrayStorage), []);
});

test('addRecentSearch persists up to 5 deduplicated queries in most-recent-first order', () => {
  const storage = createMemoryStorage();
  let list: string[] = [];

  for (const term of ['Dune', 'Oppenheimer', 'Severance', 'Arrival', 'Andor', 'Interstellar']) {
    list = addRecentSearch(list, term, storage);
  }

  assert.equal(list.length, MAX_RECENT_SEARCHES);
  assert.deepEqual(list, ['Interstellar', 'Andor', 'Arrival', 'Severance', 'Oppenheimer']);
  assert.deepEqual(loadRecentSearches(storage), list);

  // Re-searching an older term moves it to index 0 case-insensitively without duplicating
  list = addRecentSearch(list, '  arrival  ', storage);
  assert.deepEqual(list, ['arrival', 'Interstellar', 'Andor', 'Severance', 'Oppenheimer']);
  assert.deepEqual(loadRecentSearches(storage), list);
});

test('addRecentSearch ignores whitespace-only queries', () => {
  const storage = createMemoryStorage();
  const initial = addRecentSearch([], 'Blade Runner', storage);
  const afterBlank = addRecentSearch(initial, '   ', storage);
  assert.deepEqual(afterBlank, ['Blade Runner']);
});

test('removeRecentSearch and clearRecentSearches update storage cleanly', () => {
  const storage = createMemoryStorage();
  let list = addRecentSearch([], 'Dune', storage);
  list = addRecentSearch(list, 'Heat', storage);
  list = addRecentSearch(list, 'Alien', storage);

  list = removeRecentSearch(list, 'heat', storage);
  assert.deepEqual(list, ['Alien', 'Dune']);
  assert.deepEqual(loadRecentSearches(storage), ['Alien', 'Dune']);

  const cleared = clearRecentSearches(storage);
  assert.deepEqual(cleared, []);
  assert.equal(storage.getItem(RECENT_SEARCHES_STORAGE_KEY), null);
});

test('getRecentSearchesStorageKey isolates recent queries by userId without affecting guest key', () => {
  const storage = createMemoryStorage();
  const guestKey = getRecentSearchesStorageKey();
  const userKey = getRecentSearchesStorageKey('uid_42');

  assert.equal(guestKey, RECENT_SEARCHES_STORAGE_KEY);
  assert.equal(userKey, `${RECENT_SEARCHES_STORAGE_KEY}_uid_42`);

  addRecentSearch([], 'Dune', storage, MAX_RECENT_SEARCHES, guestKey);
  addRecentSearch([], 'Severance', storage, MAX_RECENT_SEARCHES, userKey);

  assert.deepEqual(loadRecentSearches(storage, MAX_RECENT_SEARCHES, guestKey), ['Dune']);
  assert.deepEqual(loadRecentSearches(storage, MAX_RECENT_SEARCHES, userKey), ['Severance']);

  clearRecentSearches(storage, userKey);
  assert.deepEqual(loadRecentSearches(storage, MAX_RECENT_SEARCHES, guestKey), ['Dune']);
  assert.deepEqual(loadRecentSearches(storage, MAX_RECENT_SEARCHES, userKey), []);
});
