import React from 'react';
import { MediaItem } from '../types/entertainment';
import { formatRating, formatReleaseYear } from '../utils/entertainment';
import { Star, Bookmark, Heart, Play } from 'lucide-react';

interface MediaCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
  onWatchTrailer?: (item: MediaItem) => void;
  isWatchlisted?: boolean;
  isFavorite?: boolean;
  onToggleWatchlist?: (item: MediaItem) => void;
  onToggleFavorite?: (item: MediaItem) => void;
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
  className = ''
}) => {
  const year = formatReleaseYear(item.releaseDate || item.firstAirDate);
  const rating = formatRating(item.voteAverage);
  const hasTrailer = item.videos && item.videos.some((v) => v.site === 'YouTube' && v.key);

  return (
    <div
      className={`group relative flex flex-col bg-[#111421] border border-[#272B3A] rounded-xl overflow-hidden hover:border-[#8B5CF6]/50 transition-all duration-300 ${className}`}
    >
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full bg-gradient-to-b from-[#191D2B] to-[#111421] overflow-hidden">
        {item.posterPath ? (
          <img
            src={item.posterPath}
            alt={item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.classList.add('flex', 'flex-col', 'items-center', 'justify-center', 'p-4', 'text-center');
                parent.innerHTML = `
                  <div class="w-8 h-8 rounded-full bg-[#272B3A] flex items-center justify-center text-[#8B5CF6] mb-2">
                    <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
                  </div>
                  <div class="text-xs text-[#F8FAFC] font-semibold line-clamp-2">${item.title}</div>
                  <div class="text-[10px] text-[#858B9B] mt-1">${item.mediaType === 'movie' ? 'Film' : 'Series'}</div>
                `;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <div className="text-xs text-[#F8FAFC] font-semibold">{item.title}</div>
            <div className="text-[10px] text-[#858B9B] mt-1">{item.mediaType === 'movie' ? 'Film' : 'Series'}</div>
          </div>
        )}

        {/* Subtle scrim overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080A12]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 pointer-events-none">
          {hasTrailer && onWatchTrailer && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWatchTrailer(item);
              }}
              className="pointer-events-auto w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#F8FAFC] text-[#080A12] text-xs font-semibold hover:bg-white transition-colors cursor-pointer shadow-md"
              aria-label={`Watch trailer for ${item.title}`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Trailer</span>
            </button>
          )}
        </div>

        {/* Action shortcuts (Watchlist & Favorite) */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          {onToggleWatchlist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist(item);
              }}
              className={`p-1.5 rounded-md backdrop-blur-md border transition-colors cursor-pointer ${
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
              className={`p-1.5 rounded-md backdrop-blur-md border transition-colors cursor-pointer ${
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
        className="p-3.5 flex flex-col flex-1 justify-between cursor-pointer"
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
            <span>{year}</span>
            <span aria-hidden="true">·</span>
            <span className="uppercase text-[11px] font-mono tracking-wider text-[#A1A1AA]">
              {item.mediaType === 'movie' ? 'Film' : 'Series'}
            </span>
            {item.genres && item.genres[0] && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate max-w-[90px]">{item.genres[0]}</span>
              </>
            )}
          </div>
        </div>

        {/* TMDB Source Rating */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#272B3A]/60 text-xs">
          <div className="flex items-center gap-1 text-[#38BDF8]">
            <Star className="w-3 h-3 fill-[#38BDF8]" />
            <span className="font-mono font-medium">{rating}</span>
            <span className="text-[10px] text-[#858B9B] ml-0.5">TMDB</span>
          </div>

          <span className="text-[11px] text-[#A1A1AA] hover:text-[#F8FAFC] font-medium transition-colors">
            Details →
          </span>
        </div>
      </div>
    </div>
  );
};
