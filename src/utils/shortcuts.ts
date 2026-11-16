export type ShortcutActionId =
  | 'toggle_search'
  | 'toggle_help'
  | 'nav_discover'
  | 'nav_movies'
  | 'nav_tv'
  | 'nav_news'
  | 'nav_watchlist'
  | 'nav_account';

export type ShortcutCategory = 'navigation' | 'actions';

export type ShortcutNavTarget =
  | 'discover'
  | 'movies'
  | 'tv'
  | 'news'
  | 'watchlist'
  | 'profile';

export interface ShortcutDefinition {
  id: ShortcutActionId;
  key: string;
  displayKey: string;
  category: ShortcutCategory;
  labelKey:
    | 'shortcuts.toggleSearch'
    | 'shortcuts.toggleHelp'
    | 'shortcuts.navHome'
    | 'shortcuts.navMovies'
    | 'shortcuts.navTv'
    | 'shortcuts.navEditorial'
    | 'shortcuts.navWatchlist'
    | 'shortcuts.navAccount';
  navTarget?: ShortcutNavTarget;
}

export const GLOBAL_SHORTCUTS: readonly ShortcutDefinition[] = [
  {
    id: 'nav_discover',
    key: '1',
    displayKey: '1',
    category: 'navigation',
    labelKey: 'shortcuts.navHome',
    navTarget: 'discover'
  },
  {
    id: 'nav_movies',
    key: '2',
    displayKey: '2',
    category: 'navigation',
    labelKey: 'shortcuts.navMovies',
    navTarget: 'movies'
  },
  {
    id: 'nav_tv',
    key: '3',
    displayKey: '3',
    category: 'navigation',
    labelKey: 'shortcuts.navTv',
    navTarget: 'tv'
  },
  {
    id: 'nav_news',
    key: '4',
    displayKey: '4',
    category: 'navigation',
    labelKey: 'shortcuts.navEditorial',
    navTarget: 'news'
  },
  {
    id: 'nav_watchlist',
    key: '5',
    displayKey: '5',
    category: 'navigation',
    labelKey: 'shortcuts.navWatchlist',
    navTarget: 'watchlist'
  },
  {
    id: 'nav_account',
    key: '6',
    displayKey: '6',
    category: 'navigation',
    labelKey: 'shortcuts.navAccount',
    navTarget: 'profile'
  },
  {
    id: 'toggle_search',
    key: '/',
    displayKey: '/',
    category: 'actions',
    labelKey: 'shortcuts.toggleSearch'
  },
  {
    id: 'toggle_help',
    key: '?',
    displayKey: '?',
    category: 'actions',
    labelKey: 'shortcuts.toggleHelp'
  }
];

export interface EditableTargetLike {
  tagName?: string;
  isContentEditable?: boolean;
  getAttribute?: (name: string) => string | null;
  closest?: (selector: string) => unknown;
}

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
const EDITABLE_ROLES = new Set(['textbox', 'searchbox', 'combobox']);

/**
 * Returns true when an event originates inside an editable field, input, or ARIA text widget
 * so global single-key shortcuts never hijack user typing.
 */
export function isEditableEventTarget(target: EventTarget | EditableTargetLike | null | undefined): boolean {
  if (!target || typeof target !== 'object') return false;
  const el = target as EditableTargetLike;

  const tag = typeof el.tagName === 'string' ? el.tagName.toUpperCase() : '';
  if (EDITABLE_TAGS.has(tag)) {
    return true;
  }

  if (el.isContentEditable) {
    return true;
  }

  if (typeof el.getAttribute === 'function') {
    const role = (el.getAttribute('role') || '').toLowerCase();
    if (EDITABLE_ROLES.has(role)) {
      return true;
    }
    const contentEditable = el.getAttribute('contenteditable');
    if (contentEditable === '' || contentEditable === 'true' || contentEditable === 'plaintext-only') {
      return true;
    }
  }

  if (typeof el.closest === 'function') {
    if (el.closest('[contenteditable="true"], [contenteditable=""], [role="textbox"]')) {
      return true;
    }
  }

  return false;
}

export interface ShortcutMatchInput {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  repeat?: boolean;
  isComposing?: boolean;
  target?: EventTarget | EditableTargetLike | null;
}

export interface ShortcutMatchState {
  searchOpen: boolean;
  shortcutsOpen: boolean;
  hasBlockingModalOpen: boolean;
}

/**
 * Resolves a keyboard event against ASTREON's global shortcut table, respecting:
 * - Modifier/IME/repeat safety guards
 * - Editable element focus guards
 * - Modal stack state (e.g. Search modal open allows '/' to toggle off when focus is outside input;
 *   Shortcuts help modal allows '?' to toggle off; blocking overlays suppress shortcuts cleanly)
 */
export function matchGlobalShortcut(
  event: ShortcutMatchInput,
  state: ShortcutMatchState
): ShortcutDefinition | null {
  if (!event || !event.key) return null;
  if (event.repeat || event.isComposing) return null;
  if (event.metaKey || event.ctrlKey || event.altKey) return null;
  if (isEditableEventTarget(event.target)) return null;
  if (state.hasBlockingModalOpen) return null;

  if (state.shortcutsOpen) {
    if (event.key === '?') {
      return GLOBAL_SHORTCUTS.find((s) => s.id === 'toggle_help') || null;
    }
    return null;
  }

  if (state.searchOpen) {
    if (event.key === '/' && !event.shiftKey) {
      return GLOBAL_SHORTCUTS.find((s) => s.id === 'toggle_search') || null;
    }
    return null;
  }

  if (event.key === '?') {
    return GLOBAL_SHORTCUTS.find((s) => s.id === 'toggle_help') || null;
  }

  if (event.shiftKey) {
    return null;
  }

  return GLOBAL_SHORTCUTS.find((s) => s.key === event.key) || null;
}
