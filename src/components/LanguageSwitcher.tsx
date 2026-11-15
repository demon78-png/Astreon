import React, { useState, useRef, useEffect } from 'react';
import { Languages, Check, ChevronDown, Loader2 } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import {
  getLocaleConfig,
  getLanguageSwitcherLocales,
  SupportedLocale
} from '../utils/i18n';

interface LanguageSwitcherProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  isOpen: controlledOpen,
  onOpenChange
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const { locale, setLocale, isLocalized, isTranslating, t } = useI18n();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next);
    }
    onOpenChange?.(next);
  };

  const locales = getLanguageSwitcherLocales();
  const activeLocaleConfig = getLocaleConfig(locale);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const handleSelectLocale = (code: SupportedLocale) => {
    setLocale(code);
    setOpen(false);
  };

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = optionRefs.current.filter((el): el is HTMLButtonElement => Boolean(el));
    if (items.length === 0) return;

    const currentIdx = items.findIndex((el) => el === document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % items.length;
      items[nextIdx]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = currentIdx <= 0 ? items.length - 1 : currentIdx - 1;
      items[prevIdx]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-center gap-1.5 min-h-[40px] md:min-h-0 px-2.5 py-1.5 text-xs border rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] ${
          isLocalized
            ? 'bg-[#8B5CF6]/15 text-[#F8FAFC] border-[#8B5CF6]/60'
            : 'bg-[#111421] hover:bg-[#191D2B] text-[#A1A1AA] hover:text-[#F8FAFC] border-[#272B3A]'
        }`}
        aria-label={`${t('nav.language')}: ${activeLocaleConfig.nativeName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="language-switcher"
      >
        {isTranslating ? (
          <Loader2 className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#38BDF8] animate-spin shrink-0" />
        ) : (
          <Languages className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#38BDF8] shrink-0" />
        )}
        <span className="font-mono font-semibold text-[11px]">
          {activeLocaleConfig.shortLabel}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-[#858B9B] hidden sm:inline shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('nav.language')}
          data-testid="language-switcher-menu"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 mt-2 w-60 rounded-xl bg-[#111421] border border-[#272B3A] shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-3.5 py-2 border-b border-[#272B3A] flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#858B9B]">
              {t('nav.language')}
            </span>
            {isLocalized && (
              <button
                type="button"
                onClick={() => handleSelectLocale('en')}
                className="text-[11px] text-[#38BDF8] hover:underline cursor-pointer whitespace-nowrap"
              >
                {t('nav.switchToEnglish')}
              </button>
            )}
          </div>

          <div className="py-1">
            {locales.map((cfg, idx) => {
              const selected = locale === cfg.code;
              return (
                <button
                  key={cfg.code}
                  ref={(el) => {
                    optionRefs.current[idx] = el;
                  }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  data-testid={`language-option-${cfg.code}`}
                  onClick={() => handleSelectLocale(cfg.code)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 md:py-2 text-xs text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-[#191D2B] ${
                    selected
                      ? 'bg-[#8B5CF6]/15 text-[#F8FAFC] font-semibold'
                      : 'text-[#A1A1AA] hover:text-[#F8FAFC] hover:bg-[#191D2B]'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 font-mono text-[11px] text-[#38BDF8] shrink-0">
                      {cfg.shortLabel}
                    </span>
                    <span className="truncate">{cfg.nativeName}</span>
                    {cfg.englishName !== cfg.nativeName && (
                      <span className="text-[11px] text-[#858B9B] truncate">
                        {cfg.englishName}
                      </span>
                    )}
                  </span>
                  {selected && <Check className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
