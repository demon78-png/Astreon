import React, { useState, useEffect, useRef } from 'react';
import { MediaItem } from '../types/entertainment';
import {
  formatRating,
  formatReleaseYear,
  shouldAutoplayCardTrailer,
  buildCardTrailerEmbedUrl
} from '../utils/entertainment';
import { Star, Bookmark, Heart, Play, Film, VolumeX, Calendar } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { buildTmdbImageSrcSet } from '../utils/images';

interface MediaCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
  onWatchTrailer?: (item: MediaItem) => void;
  isWatchlisted?: boolean;
  isFavorite?: boolean;
  onToggleWatchlist?: (item: MediaItem) => void;
  onToggleFavorite?: (item: MediaItem) => void;
  autoplayTrailers?: boolean;
  isOnline?: boolean;
  showReleaseDate?: boolean;
  className?: string;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  onSelect,
  onWatchTrailer,
  isWatchlisted = false,
  isFavorite = false,
  onToggleWatchlist,
  onToggleFavorite,
  autoplayTrailers = true,
  isOnline = true,
  showReleaseDate = false,
  className = ''
}) => {
  const { t, tGenre, formatDate } = useI18n();
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [previewActive, setPreviewActive] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setImgError(false);
    setPreviewActive(false);
  }, [item.id, item.posterPath]);

  const rawReleaseDate = item.releaseDate || item.firstAirDate;
  const year = formatReleaseYear(rawReleaseDate);
  const formattedReleaseDate =
    showReleaseDate && rawReleaseDate && /^\d{4}-\d{2}-\d{2}/.test(rawReleaseDate)
      ? formatDate(rawReleaseDate.slice(0, 10), {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      : year;
  const rating = formatRating(item.voteAverage);
  const trailerVideo =
    item.videos?.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.key) ||
    item.videos?.find((v) => v.site === 'YouTube' && v.key) ||
    null;
  const hasTrailer = Boolean(trailerVideo);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canAutoplay = shouldAutoplayCardTrailer({
    autoplayEnabled: autoplayTrailers,
    isOnline,
    isHovered,
    hasTrailer,
    prefersReducedMotion
  });

  useEffect(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    if (!canAutoplay) {
      setPreviewActive(false);
      return;
    }

    hoverTimerRef.current = setTimeout(() => {
      setPreviewActive(true);
      hoverTimerRef.current = null;
    }, 450);

    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    };
  }, [canAutoplay]);

  return (
    <div
      data-autoplay-enabled={autoplayTrailers ? 'true' : 'false'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex flex-col bg-[#111421] border border-[#272B3A] rounded-xl overflow-hidden hover:border-[#8B5CF6]/50 transition-all duration-300 ${className}`}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full bg-gradient-to-b from-[#191D2B] to-[#111421] overflow-hidden">
        {item.posterPath && !imgError ? (
          <img
            src={item.posterPath}
            srcSet={buildTmdbImageSrcSet(item.posterPath, 'poster')}
            sizes="(max-width: 640px) 164px, (max-width: 768px) 202px, 230px"
            alt={item.title}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <div className="w-8 h-8 rounded-full bg-[#272B3A] flex items-center justify-center text-[#8B5CF6] mb-2">
              <Film className="w-4 h-4" />
            </div>
            <div className="text-xs text-[#F8FAFC] font-semibold line-clamp-2">{item.title}</div>
            <div className="text-[10px] text-[#858B9B] mt-1">{item.mediaType === 'movie' ? t('card.film') : t('card.series')}</div>
          </div>
        )}

        {/* Inline Muted Trailer Auto-Play Preview (when enabled in user preferences) */}
        {canAutoplay && previewActive && trailerVideo && (
          <div
            data-testid={`card-trailer-autoplay-${item.id}`}
            className="absolute inset-0 z-[1] bg-black overflow-hidden animate-in fade-in duration-300 pointer-events-none"
          >
            <iframe
              src={buildCardTrailerEmbedUrl(trailerVideo.key)}
              title={`${item.title} trailer preview`}
              allow="autoplay; encrypted-media; picture-in-picture"
              tabIndex={-1}
              aria-hidden="true"
              className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[267%] max-w-none border-0 pointer-events-none"
            />
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#080A12]/80 backdrop-blur-md border border-[#272B3A] text-[10px] font-mono text-[#F8FAFC]">
              <VolumeX className="w-3 h-3 text-[#38BDF8]" />
              <span>{t('card.mutedPreview')}</span>
            </div>
          </div>
        )}

        {/* Touch-friendly compact glass trailer trigger (< md) matching top-right action glass */}
        {hasTrailer && onWatchTrailer && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWatchTrailer(item);
            }}
            className="md:hidden absolute top-2 left-2 z-10 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-[#080A12]/80 backdrop-blur-md border border-[#272B3A] text-[#F8FAFC] hover:text-[#38BDF8] transition-colors cursor-pointer"
            title={t('card.trailer')}
            aria-label={`Watch trailer for ${item.title}`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        )}

        {/* Subtle scrim overlay on desktop hover */}
        <div className="hidden md:flex absolute inset-0 z-10 bg-gradient-to-t from-[#080A12]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-end p-3 pointer-events-none">
          {hasTrailer && onWatchTrailer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWatchTrailer(item);
              }}
              className="pointer-events-auto w-full min-h-[36px] flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#F8FAFC] text-[#080A12] text-xs font-semibold hover:bg-white transition-colors cursor-pointer shadow-md"
              aria-label={`Watch trailer for ${item.title}`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t('card.trailer')}</span>
            </button>
          )}
        </div>

        {/* Action shortcuts (Watchlist & Favorite) */}
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5 opacity-95 group-hover:opacity-100 transition-opacity">
          {onToggleWatchlist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist(item);
              }}
              className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg backdrop-blur-md border transition-colors cursor-pointer ${
                isWatchlisted
                  ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]'
                  : 'bg-[#080A12]/80 text-[#A1A1AA] hover:text-[#F8FAFC] border-[#272B3A]'
              }`}
              title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
              aria-label={isWatchlisted ? `Remove ${item.title} from watchlist` : `Add ${item.title} to watchlist`}
            >
              <Bookmark className="w-3.5 h-3.5" fill={isWatchlisted ? 'currentColor' : 'none'} />
            </button>
          )}

          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(item);
              }}
              className={`min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg backdrop-blur-md border transition-colors cursor-pointer ${
                isFavorite
                  ? 'bg-rose-600 text-white border-rose-500'
                  : 'bg-[#080A12]/80 text-[#A1A1AA] hover:text-rose-400 border-[#272B3A]'
              }`}
              title={isFavorite ? 'Remove from Favourites' : 'Add to Favourites'}
              aria-label={isFavorite ? `Remove ${item.title} from favourites` : `Add ${item.title} to favourites`}
            >
              <Heart className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>

      {/* Card Info Details */}
      <div
        onClick={() => onSelect(item)}
        className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between cursor-pointer"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(item);
          }
        }}
        aria-label={`View details for ${item.title}`}
      >
        <div>
          <h3 className="font-display font-medium text-sm text-[#F8FAFC] group-hover:text-[#38BDF8] line-clamp-1 transition-colors">
            {item.title}
          </h3>

          {/* Unboxed metadata line with typographic separators */}
          <div className="flex items-center gap-1.5 text-xs text-[#858B9B] mt-1.5">
            <span className={`tabular-nums whitespace-nowrap ${showReleaseDate ? 'truncate' : 'shrink-0'}`}>
              {formattedReleaseDate}
            </span>
            <span aria-hidden="true">·</span>
            <span className="uppercase text-[11px] font-mono tracking-wider text-[#A1A1AA] shrink-0">
              {item.mediaType === 'movie' ? t('card.film') : t('card.series')}
            </span>
            {!showReleaseDate && item.genres && item.genres[0] && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate max-w-[90px]">{tGenre(item.genres[0])}</span>
              </>
            )}
          </div>
        </div>

        {/* TMDB Source Rating or Upcoming Premiere Status */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#272B3A]/60 text-xs">
          {showReleaseDate && rating === 'NR' ? (
            <div className="flex items-center gap-1.5 text-[#38BDF8]">
              <Calendar className="w-3 h-3" />
              <span className="font-mono text-[11px] font-medium uppercase tracking-wide">
                {t('card.upcoming')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[#38BDF8]">
              <Star className="w-3 h-3 fill-[#38BDF8]" />
              <span className="font-mono font-medium tabular-nums">{rating}</span>
              <span className="text-[10px] text-[#858B9B] ml-0.5">TMDB</span>
            </div>
          )}

          <span className="text-[11px] text-[#A1A1AA] hover:text-[#F8FAFC] font-medium transition-colors">
            {t('card.details')}
          </span>
        </div>
      </div>
    </div>
  );
};
