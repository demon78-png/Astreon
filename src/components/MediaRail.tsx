import React, { useRef } from 'react';
import { MediaItem } from '../types/entertainment';
import { MediaCard } from './MediaCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  viewAllLink
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = direction === 'left' ? -600 : 600;
    scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="my-10" aria-label={title}>
      {/* Header and Controls */}
      <div className="flex items-end justify-between mb-4 px-1">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-semibold text-[#F8FAFC] tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-[#858B9B] mt-0.5 font-normal">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {viewAllLink && (
            <button
              onClick={viewAllLink}
              className="text-xs text-[#38BDF8] hover:text-cyan-300 font-medium mr-2 transition-colors cursor-pointer"
            >
              View All
            </button>
          )}
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-lg bg-[#111421] hover:bg-[#191D2B] border border-[#272B3A] text-[#A1A1AA] hover:text-[#F8FAFC] transition-colors cursor-pointer"
            aria-label={`Scroll ${title} left`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-lg bg-[#111421] hover:bg-[#191D2B] border border-[#272B3A] text-[#A1A1AA] hover:text-[#F8FAFC] transition-colors cursor-pointer"
            aria-label={`Scroll ${title} right`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rail Container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 hide-scrollbar snap-x snap-mandatory"
        tabIndex={0}
        role="region"
        aria-label={`${title} scrollable collection`}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="w-[180px] sm:w-[210px] md:w-[230px] shrink-0 snap-start"
          >
            <MediaCard
              item={item}
              onSelect={onSelect}
              onWatchTrailer={onWatchTrailer}
              isWatchlisted={watchlistIds.includes(item.id)}
              isFavorite={favoriteIds.includes(item.id)}
              onToggleWatchlist={onToggleWatchlist}
              onToggleFavorite={onToggleFavorite}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
