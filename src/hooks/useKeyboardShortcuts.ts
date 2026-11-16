import { useEffect, useRef } from 'react';
import {
  matchGlobalShortcut,
  ShortcutDefinition,
  ShortcutNavTarget
} from '../utils/shortcuts';

export interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  searchOpen: boolean;
  shortcutsOpen: boolean;
  hasBlockingModalOpen: boolean;
  onToggleSearch: () => void;
  onToggleHelp: () => void;
  onNavigate: (view: ShortcutNavTarget) => void;
}

/**
 * Centralized global keyboard shortcut manager.
 * Attaches a single stable keydown listener on `window` and routes verified
 * non-input shortcuts (`/` search toggle, `1-6` section navigation, `?` shortcuts help).
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
  const latestRef = useRef(options);
  latestRef.current = options;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const current = latestRef.current;
      if (current.enabled === false) return;

      const matched: ShortcutDefinition | null = matchGlobalShortcut(
        {
          key: event.key,
          metaKey: event.metaKey,
          ctrlKey: event.ctrlKey,
          altKey: event.altKey,
          shiftKey: event.shiftKey,
          repeat: event.repeat,
          isComposing: event.isComposing,
          target: event.target
        },
        {
          searchOpen: current.searchOpen,
          shortcutsOpen: current.shortcutsOpen,
          hasBlockingModalOpen: current.hasBlockingModalOpen
        }
      );

      if (!matched) return;

      event.preventDefault();

      if (matched.id === 'toggle_search') {
        current.onToggleSearch();
      } else if (matched.id === 'toggle_help') {
        current.onToggleHelp();
      } else if (matched.navTarget) {
        current.onNavigate(matched.navTarget);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
