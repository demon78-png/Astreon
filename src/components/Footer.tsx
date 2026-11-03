import React from 'react';
import { BrandLogo } from './BrandLogo';

interface FooterProps {
  onOpenLegal: (tab: 'about' | 'privacy' | 'terms' | 'attribution' | 'help' | 'contact') => void;
  onNavigate: (view: string) => void;
  onOpenShare?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, onNavigate, onOpenShare }) => {
  return (
    <footer className="w-full border-t border-[#272B3A] bg-[#080A12] text-[#858B9B] py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand column */}
        <div className="md:col-span-2 space-y-4">
          <BrandLogo size="md" onClick={() => onNavigate('discover')} />
          <p className="text-xs uppercase tracking-widest text-[#38BDF8] font-mono">
            Discover Beyond The Screen.
          </p>
          <p className="text-sm text-[#A1A1AA] max-w-md leading-relaxed">
            ASTREON is an independent, premium entertainment discovery platform crafted for cinema
            enthusiasts, television admirers, and cultural explorers worldwide.
          </p>
          <div className="pt-2">
            <span className="text-[11px] text-[#858B9B]">
              © {new Date().getFullYear()} ASTREON Inc. All rights reserved.
            </span>
          </div>
        </div>

        {/* Exploration links */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F8FAFC] mb-3">
            Discovery
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => onNavigate('movies')}
                className="hover:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                Featured Cinema
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('tv')}
                className="hover:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                Prestige Television
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('news')}
                className="hover:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                Editorial Dispatches
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('trending')}
                className="hover:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                Global Trending
              </button>
            </li>
            {onOpenShare && (
              <li>
                <button
                  onClick={onOpenShare}
                  className="text-[#38BDF8] hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-medium"
                >
                  <span>Mobile App & QR Code</span>
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Legal & Attribution */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F8FAFC] mb-3">
            Legal & Trust
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button
                onClick={() => onOpenLegal('about')}
                className="hover:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                About ASTREON
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal('attribution')}
                className="hover:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                Content Attribution
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal('privacy')}
                className="hover:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal('terms')}
                className="hover:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                Terms of Service
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal('help')}
                className="hover:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                Help & FAQ
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* TMDB Mandatory Attribution Banner */}
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-[#272B3A] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#858B9B]">
        <div className="flex items-center gap-3">
          {/* TMDB Official Blue Ribbon SVG Icon */}
          <div className="w-16 shrink-0">
            <svg viewBox="0 0 185 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="TMDB logo">
              <rect width="185" height="16" rx="3" fill="#032541" />
              <text x="8" y="12" fill="#01B4E4" fontSize="11" fontWeight="bold" fontFamily="sans-serif">TMDB</text>
              <text x="44" y="11" fill="#90CEA1" fontSize="8" fontFamily="sans-serif">METADATA</text>
            </svg>
          </div>
          <p className="text-[11px] leading-relaxed">
            This platform uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>

        <p className="text-[11px] text-right">
          Authorized video embeds stream exclusively from verified studio distribution channels.
        </p>
      </div>
    </footer>
  );
};
