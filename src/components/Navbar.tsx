import React, { useState } from 'react';
import { BrandLogo } from './BrandLogo';
import { Search, User, Bookmark, Heart, Shield, LogOut, Menu, X, Smartphone, QrCode } from 'lucide-react';
import { UserProfile } from '../types/entertainment';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenSearch: () => void;
  onOpenShare: () => void;
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
  currentUser,
  onOpenAuth,
  onSignOut,
  watchlistCount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { id: 'discover', label: 'Discover' },
    { id: 'movies', label: 'Movies' },
    { id: 'tv', label: 'TV Shows' },
    { id: 'news', label: 'Editorial' }
  ];

  const handleLinkClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#272B3A] bg-[#080A12]/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="shrink-0 flex items-center">
          <BrandLogo
            size="md"
            onClick={() => handleLinkClick('discover')}
          />
        </div>

        {/* Zone 2: Primary Nav Links */}
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
                className={`transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                  isActive ? 'text-[#F8FAFC] font-semibold' : 'hover:text-[#F8FAFC]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#8B5CF6] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Search & Account Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Mobile / Share QR Code button */}
          <button
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#A1A1AA] hover:text-[#38BDF8] bg-[#111421] hover:bg-[#191D2B] border border-[#272B3A] rounded-lg transition-colors cursor-pointer"
            title="Scan QR Code or Get Mobile Link"
            aria-label="Scan QR Code or Get Mobile Link"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="hidden lg:inline text-xs">Mobile App</span>
          </button>

          {/* Search Trigger Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-[#A1A1AA] hover:text-[#F8FAFC] bg-[#111421] hover:bg-[#191D2B] border border-[#272B3A] rounded-lg transition-colors cursor-pointer"
            aria-label="Search movies, series, cast and topics"
          >
            <Search className="w-3.5 h-3.5 text-[#858B9B]" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] font-mono bg-[#191D2B] text-[#858B9B] border border-[#272B3A] rounded">
              /
            </kbd>
          </button>

          {/* User Account / Auth Button */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 text-xs text-[#F8FAFC] bg-[#111421] hover:bg-[#191D2B] border border-[#272B3A] rounded-lg transition-colors cursor-pointer"
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
                  <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#8B5CF6] text-white rounded-full">
                    {watchlistCount}
                  </span>
                )}
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#111421] border border-[#272B3A] shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-[#272B3A]">
                    <p className="text-xs font-semibold text-[#F8FAFC] truncate">
                      {currentUser.displayName}
                    </p>
                    <p className="text-[11px] text-[#858B9B] truncate">{currentUser.email}</p>
                  </div>

                  <button
                    onClick={() => handleLinkClick('watchlist')}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#A1A1AA] hover:text-[#F8FAFC] hover:bg-[#191D2B] text-left transition-colors cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Watchlist</span>
                    {watchlistCount > 0 && (
                      <span className="ml-auto text-[10px] text-[#858B9B] font-mono">
                        {watchlistCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => handleLinkClick('favorites')}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#A1A1AA] hover:text-[#F8FAFC] hover:bg-[#191D2B] text-left transition-colors cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span>Favourites</span>
                  </button>

                  <button
                    onClick={() => handleLinkClick('account')}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#A1A1AA] hover:text-[#F8FAFC] hover:bg-[#191D2B] text-left transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-[#858B9B]" />
                    <span>Preferences & Profile</span>
                  </button>

                  {currentUser.isAdmin && (
                    <button
                      onClick={() => handleLinkClick('admin')}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-amber-300 hover:text-amber-200 hover:bg-[#191D2B] text-left transition-colors cursor-pointer border-t border-[#272B3A] mt-1 pt-2"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Admin Console</span>
                    </button>
                  )}

                  <div className="border-t border-[#272B3A] mt-1 pt-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 text-left transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg transition-colors cursor-pointer shadow-sm shadow-[#8B5CF6]/20 whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#A1A1AA] hover:text-[#F8FAFC] focus:outline-none"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#272B3A] bg-[#080A12] px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id)}
              className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === link.id
                  ? 'bg-[#191D2B] text-[#F8FAFC]'
                  : 'text-[#A1A1AA] hover:bg-[#111421] hover:text-[#F8FAFC]'
              }`}
            >
              {link.label}
            </button>
          ))}
          {currentUser?.isAdmin && (
            <button
              onClick={() => handleLinkClick('admin')}
              className="block w-full text-left px-3 py-2 text-sm font-medium text-amber-300 hover:bg-[#191D2B] rounded-md"
            >
              Admin Console
            </button>
          )}
          <button
            onClick={() => {
              onOpenShare();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#38BDF8] hover:bg-[#191D2B] rounded-md transition-colors"
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile App & QR Code</span>
          </button>
        </div>
      )}
    </header>
  );
};
