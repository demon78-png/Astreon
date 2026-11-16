import React, { useRef } from 'react';
import { X, Keyboard, Compass, SlidersHorizontal } from 'lucide-react';
import { GLOBAL_SHORTCUTS, ShortcutNavTarget } from '../utils/shortcuts';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useI18n } from '../contexts/I18nContext';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ShortcutNavTarget) => void;
  onOpenSearch: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenSearch
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  useFocusTrap(modalRef, isOpen, onClose);

  if (!isOpen) return null;

  const navShortcuts = GLOBAL_SHORTCUTS.filter((s) => s.category === 'navigation');
  const actionShortcuts = GLOBAL_SHORTCUTS.filter((s) => s.category === 'actions');

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-heading"
      data-testid="shortcuts-modal"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-2xl rounded-t-2xl sm:rounded-2xl bg-[#111421] border border-[#272B3A] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[88vh] flex flex-col focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#272B3A] bg-[#080A12]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6]/35 flex items-center justify-center shrink-0">
              <Keyboard className="w-4 h-4 text-[#38BDF8]" />
            </div>
            <div className="min-w-0">
              <h2
                id="shortcuts-modal-heading"
                className="text-base sm:text-lg font-display font-bold text-[#F8FAFC] truncate"
              >
                {t('shortcuts.title')}
              </h2>
              <p className="text-xs text-[#858B9B] truncate">{t('shortcuts.subtitle')}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('shortcuts.closeModal')}
            data-testid="shortcuts-modal-close"
            className="w-9 h-9 rounded-lg bg-[#191D2B] hover:bg-[#272B3A] border border-[#272B3A] text-[#A1A1AA] hover:text-[#F8FAFC] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcut Groups */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Navigation Shortcuts */}
          <section aria-labelledby="shortcuts-nav-group">
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-3.5 h-3.5 text-[#38BDF8]" />
              <h3
                id="shortcuts-nav-group"
                className="text-[11px] font-mono uppercase tracking-widest text-[#858B9B]"
              >
                {t('shortcuts.navigationGroup')}
              </h3>
            </div>
            <div className="space-y-1.5">
              {navShortcuts.map((shortcut) => (
                <button
                  key={shortcut.id}
                  type="button"
                  data-testid={`shortcut-row-${shortcut.id}`}
                  onClick={() => {
                    onClose();
                    if (shortcut.navTarget) {
                      onNavigate(shortcut.navTarget);
                    }
                  }}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-[#080A12]/70 hover:bg-[#191D2B] border border-[#272B3A]/70 hover:border-[#8B5CF6]/50 text-left transition-colors cursor-pointer group"
                >
                  <span className="text-xs sm:text-sm text-[#A1A1AA] group-hover:text-[#F8FAFC] transition-colors">
                    {t(shortcut.labelKey)}
                  </span>
                  <kbd className="min-w-[26px] h-6 px-2 inline-flex items-center justify-center rounded-md bg-[#191D2B] border border-[#272B3A] text-xs font-mono font-semibold text-[#38BDF8] shadow-inner shrink-0">
                    {shortcut.displayKey}
                  </kbd>
                </button>
              ))}
            </div>
          </section>

          {/* Search & Dialog Controls */}
          <section aria-labelledby="shortcuts-actions-group">
            <div className="flex items-center gap-2 mb-3">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <h3
                id="shortcuts-actions-group"
                className="text-[11px] font-mono uppercase tracking-widest text-[#858B9B]"
              >
                {t('shortcuts.actionsGroup')}
              </h3>
            </div>
            <div className="space-y-1.5">
              {actionShortcuts.map((shortcut) => (
                <button
                  key={shortcut.id}
                  type="button"
                  data-testid={`shortcut-row-${shortcut.id}`}
                  onClick={() => {
                    onClose();
                    if (shortcut.id === 'toggle_search') {
                      onOpenSearch();
                    }
                  }}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-[#080A12]/70 hover:bg-[#191D2B] border border-[#272B3A]/70 hover:border-[#8B5CF6]/50 text-left transition-colors cursor-pointer group"
                >
                  <span className="text-xs sm:text-sm text-[#A1A1AA] group-hover:text-[#F8FAFC] transition-colors">
                    {t(shortcut.labelKey)}
                  </span>
                  <kbd className="min-w-[26px] h-6 px-2 inline-flex items-center justify-center rounded-md bg-[#191D2B] border border-[#272B3A] text-xs font-mono font-semibold text-[#8B5CF6] shadow-inner shrink-0">
                    {shortcut.displayKey}
                  </kbd>
                </button>
              ))}

              <div
                data-testid="shortcut-row-close_modal"
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-[#080A12]/40 border border-[#272B3A]/50"
              >
                <span className="text-xs sm:text-sm text-[#A1A1AA]">
                  {t('shortcuts.closeModal')}
                </span>
                <kbd className="px-2 h-6 inline-flex items-center justify-center rounded-md bg-[#191D2B] border border-[#272B3A] text-[11px] font-mono font-semibold text-[#A1A1AA] shrink-0">
                  ESC
                </kbd>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#272B3A] bg-[#080A12] flex items-center justify-between gap-3 text-[11px] font-mono text-[#858B9B]">
          <span>{t('shortcuts.pressHint')}</span>
          <span className="hidden sm:inline text-[#A1A1AA]">ASTREON</span>
        </div>
      </div>
    </div>
  );
};
