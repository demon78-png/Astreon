import React from 'react';
import { BrandLogo } from './BrandLogo';
import { useI18n } from '../contexts/I18nContext';

interface FooterProps {
  onOpenLegal: (tab: 'about' | 'privacy' | 'terms' | 'attribution' | 'help' | 'contact') => void;
  onNavigate: (view: string) => void;
  onOpenShare?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, onNavigate, onOpenShare }) => {
  const { t } = useI18n();

  return (
    <footer className="w-full border-t border-[#272B3A] bg-[#080A12] text-[#858B9B] pt-10 sm:pt-12 pb-24 md:pb-12 px-4 sm:px-6 lg:px-8 mt-14 sm:mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
        {/* Brand column */}
        <div className="col-span-2 space-y-4">
          <BrandLogo size="md" onClick={() => onNavigate('discover')} />
          <p className="text-xs uppercase tracking-widest text-[#38BDF8] font-mono">
            {t('footer.tagline')}
          </p>
          <p className="text-sm text-[#A1A1AA] max-w-md leading-relaxed">
            {t('footer.description')}
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
            {t('footer.discovery')}
          </h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button
                onClick={() => onNavigate('movies')}
                className="py-1 hover:text-[#F8FAFC] transition-colors cursor-pointer text-left"
              >
                {t('footer.featuredCinema')}
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('tv')}
                className="py-1 hover:text-[#F8FAFC] transition-colors cursor-pointer text-left"
              >
                {t('footer.prestigeTv')}
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('news')}
                className="py-1 hover:text-[#F8FAFC] transition-colors cursor-pointer text-left"
              >
                {t('footer.editorialDispatches')}
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate('discover')}
                className="py-1 hover:text-[#F8FAFC] transition-colors cursor-pointer text-left"
              >
                {t('footer.globalTrending')}
              </button>
            </li>
            {onOpenShare && (
              <li>
                <button
                  onClick={onOpenShare}
                  className="py-1 text-[#38BDF8] hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-medium text-left"
                >
                  <span>{t('footer.mobileAppQr')}</span>
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Legal & Attribution */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F8FAFC] mb-3">
            {t('footer.legalTrust')}
          </h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button
                onClick={() => onOpenLegal('about')}
                className="py-1 hover:text-[#F8FAFC] transition-colors cursor-pointer text-left"
              >
                {t('footer.about')}
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal('attribution')}
                className="py-1 hover:text-[#F8FAFC] transition-colors cursor-pointer text-left"
              >
                {t('footer.attribution')}
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal('privacy')}
                className="py-1 hover:text-[#F8FAFC] transition-colors cursor-pointer text-left"
              >
                {t('footer.privacy')}
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal('terms')}
                className="py-1 hover:text-[#F8FAFC] transition-colors cursor-pointer text-left"
              >
                {t('footer.terms')}
              </button>
            </li>
            <li>
              <button
                onClick={() => onOpenLegal('help')}
                className="py-1 hover:text-[#F8FAFC] transition-colors cursor-pointer text-left"
              >
                {t('footer.help')}
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* TMDB Mandatory Attribution Banner */}
      <div className="max-w-7xl mx-auto mt-8 sm:mt-10 pt-6 border-t border-[#272B3A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#858B9B]">
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
            {t('footer.tmdbNotice')}
          </p>
        </div>

        <p className="text-[11px] sm:text-right">
          {t('footer.streamNotice')}
        </p>
      </div>
    </footer>
  );
};
