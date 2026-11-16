import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GLOBAL_SHORTCUTS,
  isEditableEventTarget,
  matchGlobalShortcut
} from './shortcuts.ts';

const IDLE_STATE = {
  searchOpen: false,
  shortcutsOpen: false,
  hasBlockingModalOpen: false
};

test('GLOBAL_SHORTCUTS defines distinct keys for / search toggle, 1-6 navigation, and ? help', () => {
  const keys = GLOBAL_SHORTCUTS.map((s) => s.key);
  assert.equal(new Set(keys).size, GLOBAL_SHORTCUTS.length);
  assert.ok(keys.includes('/'));
  assert.ok(keys.includes('?'));
  for (const num of ['1', '2', '3', '4', '5', '6']) {
    assert.ok(keys.includes(num), `Expected shortcut key ${num}`);
  }
});

test('matchGlobalShortcut toggles search on / both when closed and when open outside inputs', () => {
  const openMatch = matchGlobalShortcut({ key: '/' }, IDLE_STATE);
  assert.equal(openMatch?.id, 'toggle_search');

  const closeMatch = matchGlobalShortcut(
    { key: '/' },
    { ...IDLE_STATE, searchOpen: true }
  );
  assert.equal(closeMatch?.id, 'toggle_search');
});

test('matchGlobalShortcut maps numeric keys 1-6 to Home, Movies, TV, Editorial, Watchlist, Account', () => {
  const expected: Array<[string, string]> = [
    ['1', 'discover'],
    ['2', 'movies'],
    ['3', 'tv'],
    ['4', 'news'],
    ['5', 'watchlist'],
    ['6', 'profile']
  ];

  for (const [key, navTarget] of expected) {
    const match = matchGlobalShortcut({ key }, IDLE_STATE);
    assert.equal(match?.navTarget, navTarget, `Key ${key} should navigate to ${navTarget}`);
  }
});

test('matchGlobalShortcut toggles help modal with ? and suppresses other shortcuts while open', () => {
  const openHelp = matchGlobalShortcut({ key: '?', shiftKey: true }, IDLE_STATE);
  assert.equal(openHelp?.id, 'toggle_help');

  const closeHelp = matchGlobalShortcut(
    { key: '?', shiftKey: true },
    { ...IDLE_STATE, shortcutsOpen: true }
  );
  assert.equal(closeHelp?.id, 'toggle_help');

  const blockedNav = matchGlobalShortcut(
    { key: '1' },
    { ...IDLE_STATE, shortcutsOpen: true }
  );
  assert.equal(blockedNav, null);
});

test('matchGlobalShortcut blocks navigation while Search modal or any blocking overlay is open', () => {
  assert.equal(matchGlobalShortcut({ key: '2' }, { ...IDLE_STATE, searchOpen: true }), null);
  assert.equal(matchGlobalShortcut({ key: '?' }, { ...IDLE_STATE, searchOpen: true }), null);

  for (const key of ['/', '1', '2', '3', '4', '5', '6', '?']) {
    assert.equal(
      matchGlobalShortcut({ key }, { ...IDLE_STATE, hasBlockingModalOpen: true }),
      null
    );
  }
});

test('matchGlobalShortcut ignores modifiers, Shift+digit, repeat events, and IME composition', () => {
  assert.equal(matchGlobalShortcut({ key: '/', metaKey: true }, IDLE_STATE), null);
  assert.equal(matchGlobalShortcut({ key: '1', ctrlKey: true }, IDLE_STATE), null);
  assert.equal(matchGlobalShortcut({ key: '2', altKey: true }, IDLE_STATE), null);
  assert.equal(matchGlobalShortcut({ key: '1', shiftKey: true }, IDLE_STATE), null);
  assert.equal(matchGlobalShortcut({ key: '/', repeat: true }, IDLE_STATE), null);
  assert.equal(matchGlobalShortcut({ key: '/', isComposing: true }, IDLE_STATE), null);
});

test('isEditableEventTarget & matchGlobalShortcut guard INPUT, TEXTAREA, SELECT, contentEditable, and ARIA textbox/combobox', () => {
  const inputTarget = { tagName: 'INPUT' };
  const textareaTarget = { tagName: 'TEXTAREA' };
  const selectTarget = { tagName: 'select' };
  const contentEditableTarget = { tagName: 'DIV', isContentEditable: true };
  const comboboxTarget = {
    tagName: 'DIV',
    getAttribute: (name: string) => (name === 'role' ? 'combobox' : null)
  };
  const buttonTarget = { tagName: 'BUTTON', getAttribute: () => null };

  assert.equal(isEditableEventTarget(inputTarget), true);
  assert.equal(isEditableEventTarget(textareaTarget), true);
  assert.equal(isEditableEventTarget(selectTarget), true);
  assert.equal(isEditableEventTarget(contentEditableTarget), true);
  assert.equal(isEditableEventTarget(comboboxTarget), true);
  assert.equal(isEditableEventTarget(buttonTarget), false);

  assert.equal(matchGlobalShortcut({ key: '/', target: inputTarget }, IDLE_STATE), null);
  assert.equal(matchGlobalShortcut({ key: '1', target: textareaTarget }, IDLE_STATE), null);
  assert.equal(matchGlobalShortcut({ key: '/', target: comboboxTarget }, { ...IDLE_STATE, searchOpen: true }), null);
  assert.equal(matchGlobalShortcut({ key: '1', target: buttonTarget }, IDLE_STATE)?.navTarget, 'discover');
});
