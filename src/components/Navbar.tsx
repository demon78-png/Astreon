import React, { useState, useRef, useEffect } from 'react';
import { BrandLogo } from './BrandLogo';
import {
  Search,
  User,
  Bookmark,
  Heart,
  History,
  Shield,
  LogOut,
  Smartphone,
  Compass,
  Film,
  Tv,
  Newspaper,
  FolderHeart,
  Keyboard
} from 'lucide-react';
import { UserProfile } from '../types/entertainment';
import { PWAInstallButton } from './PWAInstallButton';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useI18n } from '../contexts/I18nContext';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenSearch: () => void;
  onOpenShare: () => void;
  onOpenShortcuts?: () => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  watchlistCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenSearch,
  onOpenShare,
  onOpenShortcuts,
  currentUser,
  onOpenAuth,
  onSignOut,
  watchlistCount
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { t } = useI18n();

  useEffect(() => {
    if (!userDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [userDropdownOpen]);

  const navLinks = [
    { id: 'discover', label: t('nav.discover'), icon: Compass, shortcut: '1' },
    { id: 'movies', label: t('nav.movies'), icon: Film, shortcut: '2' },
    { id: 'tv', label: t('nav.tv'), icon: Tv, shortcut: '3' },
    { id: 'news', label: t('nav.editorial'), icon: Newspaper, shortcut: '4' }
  ];

  const handleLinkClick = (id: string) => {
    onNavigate(id);
    setUserDropdownOpen(false);
    setLangMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#272B3A] bg-[#080A12]/90 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-2 sm:gap-6">
          {/* Zone 1: Brand Wordmark */}
          <div className="shrink-0 flex items-center">
            <BrandLogo
              size="md"
              onClick={() => handleLinkClick('discover')}
            />
          </div>

          {/* Zone 2: Primary Desktop Nav Links */}
          <nav
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#A1A1AA]"
            aria-label="Main Navigation"
          >
            {navLinks.map((link) => {
              const isActive = currentView === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 relative ${
                    isActive ? 'text-[#F8FAFC] font-semibold' : 'hover:text-[#F8FAFC]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-keyshortcuts={link.shortcut}
                  title={`${link.label} (${link.shortcut})`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#8B5CF6] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Language Switcher, Search & Account Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Native PWA Install Trigger */}
            <div className="hidden lg:block">
              <PWAInstallButton variant="compact" />
            </div>

            {/* Mobile / Share QR Code button */}
            <button
              onClick={onOpenShare}
              className="hidden sm:flex items-center justify-center gap-1.5 min-h-[40px] md:min-h-0 px-2.5 py-1.5 text-xs text-[#A1A1AA] hover:text-[#38BDF8] bg-[#111421] hover:bg-[#191D2B] border border-[#272B3A] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Scan QR Code or Get Mobile Link"
              aria-label="Scan QR Code or Get Mobile Link"
            >
              <Smartphone className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#38BDF8]" />
              <span className="hidden xl:inline text-xs">{t('nav.mobileApp')}</span>
            </button>

            {/* Language Switcher (English, Spanish, French, Japanese) */}
            <LanguageSwitcher
              isOpen={langMenuOpen}
              onOpenChange={(open) => {
                setLangMenuOpen(open);
                if (open) setUserDropdownOpen(false);
              }}
            />

            {/* Search Trigger Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center justify-center gap-2 min-h-[40px] min-w-[40px] md:min-h-0 md:min-w-0 px-2.5 sm:px-3 py-1.5 text-xs text-[#A1A1AA] hover:text-[#F8FAFC] bg-[#111421] hover:bg-[#191D2B] border border-[#272B3A] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              aria-label={t('nav.search')}
              aria-keyshortcuts="/"
              title={`${t('nav.search')} (/)`}
              data-testid="navbar-search-btn"
            >
              <Search className="w-4 h-4 md:w-3.5 md:h-3.5 text-[#858B9B]" />
              <span className="hidden sm:inline">{t('nav.search')}</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.2 text-[10px] font-mono bg-[#191D2B] text-[#858B9B] border border-[#272B3A] rounded">
                /
              </kbd>
            </button>

            {/* User Account / Auth Button */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setLangMenuOpen(false);
                  }}
                  className="flex items-center gap-2 min-h-[40px] md:min-h-0 px-2 py-1 md:p-1.5 text-xs text-[#F8FAFC] bg-[#111421] hover:bg-[#191D2B] border border-[#272B3A] rounded-lg transition-colors cursor-pointer"
                  aria-label="User Account Menu"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-6 h-6 rounded-md bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-xs font-semibold text-[#38BDF8]">
                    {currentUser.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate text-xs font-medium">
                    {currentUser.displayName}
                  </span>
                  {watchlistCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono tabular-nums bg-[#8B5CF6] text-white rounded-full">
                      {watchlistCount}
                    </span>
                  )}
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-xl bg-[#111421] border border-[#272B3A] shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-[#272B3A]">
                      <p className="text-xs font-semibold text-[#F8FAFC] truncate">
                        {currentUser.displayName}
                      </p>
                      <p className="text-[11px] text-[#858B9B] truncate">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => handleLinkClick('watchlist')}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 md:py-2 text-xs text-[#A1A1AA] hover:text-[#F8FAFC] hover:bg-[#191D2B] text-left transition-colors cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>{t('nav.watchlist')}</span>
                      {watchlistCount > 0 && (
                        <span className="ml-auto text-[10px] text-[#858B9B] font-mono tabular-nums">
                          {watchlistCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => handleLinkClick('favorites')}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 md:py-2 text-xs text-[#A1A1AA] hover:text-[#F8FAFC] hover:bg-[#191D2B] text-left transition-colors cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t('nav.favorites')}</span>
                    </button>

                    <button
                      onClick={() => handleLinkClick('history')}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 md:py-2 text-xs text-[#A1A1AA] hover:text-[#F8FAFC] hover:bg-[#191D2B] text-left transition-colors cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>{t('nav.watchHistory')}</span>
                    </button>

                    <button
                      onClick={() => handleLinkClick('collections')}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 md:py-2 text-xs text-[#A1A1AA] hover:text-[#F8FAFC] hover:bg-[#191D2B] text-left transition-colors cursor-pointer"
                    >
                      <FolderHeart className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      <span>{t('nav.collections')}</span>
                    </button>

                    <button
                      onClick={() => handleLinkClick('profile')}
                      aria-keyshortcuts="6"
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 md:py-2 text-xs text-[#A1A1AA] hover:text-[#F8FAFC] hover:bg-[#191D2B] text-left transition-colors cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-[#858B9B]" />
                      <span>{t('nav.preferences')}</span>
                      <kbd className="ml-auto text-[10px] font-mono text-[#858B9B]">6</kbd>
                    </button>

                    {onOpenShortcuts && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenShortcuts();
                        }}
                        aria-keyshortcuts="?"
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 md:py-2 text-xs text-[#A1A1AA] hover:text-[#F8FAFC] hover:bg-[#191D2B] text-left transition-colors cursor-pointer"
                      >
                        <Keyboard className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span>{t('shortcuts.toggleHelp')}</span>
                        <kbd className="ml-auto text-[10px] font-mono text-[#858B9B]">?</kbd>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenShare();
                      }}
                      className="w-full flex sm:hidden items-center gap-2.5 px-4 py-2.5 text-xs text-[#38BDF8] hover:bg-[#191D2B] text-left transition-colors cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{t('nav.mobileApp')}</span>
                    </button>

                    {currentUser.isAdmin && (
                      <button
                        onClick={() => handleLinkClick('admin')}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 md:py-2 text-xs text-amber-300 hover:text-amber-200 hover:bg-[#191D2B] text-left transition-colors cursor-pointer border-t border-[#272B3A] mt-1 pt-2"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>{t('nav.admin')}</span>
                      </button>
                    )}

                    <div className="border-t border-[#272B3A] mt-1 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onSignOut();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 md:py-2 text-xs text-rose-400 hover:bg-rose-500/10 text-left transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('nav.signOut')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="min-h-[40px] md:min-h-0 px-3 sm:px-3.5 py-1.5 text-xs font-medium text-white bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg transition-colors cursor-pointer shadow-sm shadow-[#8B5CF6]/20 whitespace-nowrap shrink-0"
              >
                {t('nav.signIn')}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Fixed Bottom Thumb-Zone Tab Bar (Mobile & 720x1612 portrait, hidden on md+ desktop) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#272B3A] bg-[#080A12]/95 backdrop-blur-md pb-safe"
        aria-label="Bottom Navigation"
        data-testid="mobile-bottom-nav"
      >
        <div className="grid grid-cols-5 items-center h-16 max-w-3xl mx-auto px-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentView === link.id;
            return (
              <button
                key={link.id}
                type="button"
                onClick={() => handleLinkClick(link.id)}
                className={`relative flex flex-col items-center justify-center min-h-[44px] h-full px-1 transition-colors cursor-pointer ${
                  isActive ? 'text-[#F8FAFC]' : 'text-[#858B9B] hover:text-[#A1A1AA]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform ${
                    isActive ? 'text-[#38BDF8] scale-105' : ''
                  }`}
                />
                <span
                  className={`text-[10px] sm:text-[11px] font-medium tracking-tight mt-1 max-w-full truncate ${
                    isActive ? 'text-[#F8FAFC]' : 'text-[#858B9B]'
                  }`}
                >
                  {link.label}
                </span>
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-[#8B5CF6]"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}

          {/* 5th Tab: Saved Watchlist / Account */}
          <button
            type="button"
            onClick={() => handleLinkClick('watchlist')}
            className={`relative flex flex-col items-center justify-center min-h-[44px] h-full px-1 transition-colors cursor-pointer ${
              currentView === 'account' ? 'text-[#F8FAFC]' : 'text-[#858B9B] hover:text-[#A1A1AA]'
            }`}
            aria-current={currentView === 'account' ? 'page' : undefined}
          >
            <div className="relative flex items-center justify-center">
              <Bookmark
                className={`w-5 h-5 shrink-0 transition-transform ${
                  currentView === 'account' ? 'text-[#8B5CF6] fill-[#8B5CF6]/30 scale-105' : ''
                }`}
              />
              {watchlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[#8B5CF6] text-[9px] font-mono font-bold text-white tabular-nums">
                  {watchlistCount > 99 ? '99+' : watchlistCount}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] sm:text-[11px] font-medium tracking-tight mt-1 max-w-full truncate ${
                currentView === 'account' ? 'text-[#F8FAFC]' : 'text-[#858B9B]'
              }`}
            >
              {t('nav.watchlist')}
            </span>
            {currentView === 'account' && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full bg-[#8B5CF6]"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
