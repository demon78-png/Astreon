import React, { useRef } from 'react';
import { MediaItem } from '../types/entertainment';
import { MediaCard } from './MediaCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface MediaRailProps {
  title: string;
  subtitle?: string;
  items: MediaItem[];
  onSelect: (item: MediaItem) => void;
  onWatchTrailer?: (item: MediaItem) => void;
  watchlistIds?: number[];
  favoriteIds?: number[];
  onToggleWatchlist?: (item: MediaItem) => void;
  onToggleFavorite?: (item: MediaItem) => void;
  autoplayTrailers?: boolean;
  isOnline?: boolean;
  showReleaseDate?: boolean;
  testId?: string;
  viewAllLink?: () => void;
}

export const MediaRail: React.FC<MediaRailProps> = ({
  title,
  subtitle,
  items,
  onSelect,
  onWatchTrailer,
  watchlistIds = [],
  favoriteIds = [],
  onToggleWatchlist,
  onToggleFavorite,
  autoplayTrailers = true,
  isOnline = true,
  showReleaseDate = false,
  testId,
  viewAllLink
}) => {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -600 : 600;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="my-8 sm:my-10" aria-label={title} data-testid={testId}>
      {/* Header and Controls */}
      <div className="flex items-end justify-between gap-3 mb-4 px-1">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-display font-semibold text-[#F8FAFC] tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-[#858B9B] mt-0.5 font-normal line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {viewAllLink && (
            <button
              onClick={viewAllLink}
              className="min-h-[40px] px-2 flex items-center text-xs text-[#38BDF8] hover:text-cyan-300 font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              {t('rail.viewAll')}
            </button>
          )}
          <button
            onClick={() => scroll('left')}
            className="min-w-[40px] min-h-[40px] md:min-w-0 md:min-h-0 flex items-center justify-center p-2 md:p-1.5 rounded-lg bg-[#111421] hover:bg-[#191D2B] border border-[#272B3A] text-[#A1A1AA] hover:text-[#F8FAFC] transition-colors cursor-pointer"
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="min-w-[40px] min-h-[40px] md:min-w-0 md:min-h-0 flex items-center justify-center p-2 md:p-1.5 rounded-lg bg-[#111421] hover:bg-[#191D2B] border border-[#272B3A] text-[#A1A1AA] hover:text-[#F8FAFC] transition-colors cursor-pointer"
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rail Container */}
      <div
        ref={scrollRef}
        className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-4 pt-1 px-1 hide-scrollbar snap-x snap-mandatory"
        tabIndex={0}
        role="region"
        aria-label={`${title} scrollable collection`}
      >
        {items.map((item) => (
          <div
            key={`${item.mediaType}-${item.id}`}
            className="w-[164px] sm:w-[202px] md:w-[230px] shrink-0 snap-start"
          >
            <MediaCard
              item={item}
              onSelect={onSelect}
              onWatchTrailer={onWatchTrailer}
              isWatchlisted={watchlistIds.includes(item.id)}
              isFavorite={favoriteIds.includes(item.id)}
              onToggleWatchlist={onToggleWatchlist}
              onToggleFavorite={onToggleFavorite}
              autoplayTrailers={autoplayTrailers}
              isOnline={isOnline}
              showReleaseDate={showReleaseDate}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
