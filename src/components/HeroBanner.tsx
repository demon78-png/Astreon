import React, { useState, useEffect } from 'react';
import { MediaItem } from '../types/entertainment';
import { formatRating, formatReleaseYear, formatRuntime } from '../utils/entertainment';
import { Play, Info, Bookmark, Star } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface HeroBannerProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
  onWatchTrailer?: (item: MediaItem) => void;
  isWatchlisted?: boolean;
  onToggleWatchlist?: (item: MediaItem) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  item,
  onSelect,
  onWatchTrailer,
  isWatchlisted = false,
  onToggleWatchlist
}) => {
  const { t, tGenre } = useI18n();
  const [imgError, setImgError] = useState(false);
  const backdropUrl = item.backdropPath || item.posterPath;

  useEffect(() => {
    setImgError(false);
  }, [backdropUrl]);

  const year = formatReleaseYear(item.releaseDate || item.firstAirDate);
  const rating = formatRating(item.voteAverage);
  const runtime = formatRuntime(item.runtime);
  const hasTrailer = item.videos && item.videos.some((v) => v.site === 'YouTube' && v.key);

  return (
    <section className="relative w-full min-h-[460px] sm:min-h-[580px] md:min-h-[620px] flex items-end overflow-hidden rounded-2xl border border-[#272B3A] bg-[#080A12] mb-8 sm:mb-12 shadow-2xl">
      {/* High-Resolution Backdrop Image */}
      <div className="absolute inset-0 z-0">
        {backdropUrl && !imgError ? (
          <img
            src={backdropUrl}
            alt={item.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center filter brightness-[0.85] contrast-[1.1]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#191D2B] via-[#111421] to-[#080A12]" />
        )}
        {/* Measured dark scrim gradient for WCAG contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080A12] via-[#080A12]/70 to-[#080A12]/15" />
        <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-[#080A12] via-[#080A12]/70 via-40% to-transparent" />
      </div>

      {/* Hero Content Information */}
      <div className="relative z-10 max-w-3xl p-5 sm:p-8 md:p-12 space-y-3.5 sm:space-y-4">
        {/* Editorial Eyebrow */}
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#38BDF8] uppercase">
          <span>{t('hero.spotlight')}</span>
          <span aria-hidden="true">·</span>
          <span>{item.mediaType === 'movie' ? t('hero.featureFilm') : t('hero.prestigeSeries')}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold text-[#F8FAFC] tracking-tight leading-tight text-balance">
          {item.title}
        </h1>

        {/* Metadata Line */}
        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#A1A1AA]">
          <div className="flex items-center gap-1 text-[#38BDF8] font-semibold">
            <Star className="w-3.5 h-3.5 fill-[#38BDF8]" />
            <span className="font-mono tabular-nums">{rating}</span>
            <span className="text-[11px] text-[#858B9B] font-normal">TMDB</span>
          </div>

          <span aria-hidden="true" className="text-[#272B3A]">·</span>
          <span className="tabular-nums">{year}</span>

          {item.runtime ? (
            <>
              <span aria-hidden="true" className="text-[#272B3A]">·</span>
              <span className="tabular-nums">{runtime}</span>
            </>
          ) : item.numberOfSeasons ? (
            <>
              <span aria-hidden="true" className="text-[#272B3A]">·</span>
              <span className="tabular-nums">{item.numberOfSeasons} {t('hero.seasons')}</span>
            </>
          ) : null}

          {item.genres && item.genres.length > 0 && (
            <>
              <span aria-hidden="true" className="text-[#272B3A]">·</span>
              <span className="text-[#F8FAFC]">{item.genres.slice(0, 3).map(tGenre).join(', ')}</span>
            </>
          )}
        </div>

        {/* Synopsis Overview */}
        <p className="text-sm sm:text-base text-[#A1A1AA] max-w-2xl line-clamp-3 leading-relaxed">
          {item.overview}
        </p>

        {/* Interactive CTA Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2 sm:pt-3">
          {hasTrailer && onWatchTrailer && (
            <button
              onClick={() => onWatchTrailer(item)}
              className="flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-white text-[#080A12] text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-white/5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t('hero.watchTrailer')}</span>
            </button>
          )}

          <button
            onClick={() => onSelect(item)}
            className="flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#111421]/90 hover:bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A] text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            <Info className="w-4 h-4 text-[#38BDF8]" />
            <span>{t('hero.titleDetails')}</span>
          </button>

          {onToggleWatchlist && (
            <button
              onClick={() => onToggleWatchlist(item)}
              className={`flex items-center justify-center gap-2 min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                isWatchlisted
                  ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]'
                  : 'bg-[#111421]/80 hover:bg-[#191D2B] text-[#A1A1AA] hover:text-[#F8FAFC] border-[#272B3A]'
              }`}
              title={isWatchlisted ? t('hero.watchlisted') : t('hero.watchlist')}
              aria-label={isWatchlisted ? t('hero.watchlisted') : t('hero.watchlist')}
            >
              <Bookmark className="w-4 h-4" fill={isWatchlisted ? 'currentColor' : 'none'} />
              <span className="hidden sm:inline">
                {isWatchlisted ? t('hero.watchlisted') : t('hero.watchlist')}
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
