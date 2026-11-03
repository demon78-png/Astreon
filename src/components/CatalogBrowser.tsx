import React, { useState, useMemo } from 'react';
import { MediaItem, MediaType, FilterState } from '../types/entertainment';
import { MediaCard } from './MediaCard';
import { filterMedia, sortMedia } from '../utils/entertainment';
import { Filter, RotateCcw, Film, Tv } from 'lucide-react';

interface CatalogBrowserProps {
  mediaType: MediaType | 'all';
  items: MediaItem[];
  onSelect: (item: MediaItem) => void;
  onWatchTrailer?: (item: MediaItem) => void;
  watchlistIds?: number[];
  favoriteIds?: number[];
  onToggleWatchlist?: (item: MediaItem) => void;
  onToggleFavorite?: (item: MediaItem) => void;
  title: string;
  subtitle: string;
}

const GENRE_LIST = [
  'All',
  'Science Fiction',
  'Drama',
  'Adventure',
  'Mystery',
  'History',
  'Animation',
  'Action',
  'Comedy'
];

export const CatalogBrowser: React.FC<CatalogBrowserProps> = ({
  mediaType,
  items,
  onSelect,
  onWatchTrailer,
  watchlistIds = [],
  favoriteIds = [],
  onToggleWatchlist,
  onToggleFavorite,
  title,
  subtitle
}) => {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<FilterState['sortBy']>('popularity.desc');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredItems = useMemo(() => {
    let result = filterMedia(items, {
      type: mediaType === 'all' ? undefined : mediaType,
      genre: selectedGenre === 'All' ? undefined : selectedGenre,
      year: selectedYear === 'All' ? undefined : selectedYear,
      minRating,
      searchQuery: searchFilter
    });
    return sortMedia(result, sortBy);
  }, [items, mediaType, selectedGenre, selectedYear, minRating, sortBy, searchFilter]);

  const handleResetFilters = () => {
    setSelectedGenre('All');
    setSelectedYear('All');
    setMinRating(0);
    setSortBy('popularity.desc');
    setSearchFilter('');
  };

  const hasActiveFilters =
    selectedGenre !== 'All' || selectedYear !== 'All' || minRating > 0 || sortBy !== 'popularity.desc' || searchFilter !== '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#38BDF8] mb-1">
            {mediaType === 'movie' ? <Film className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
            <span>{mediaType === 'movie' ? 'Cinema Exploration' : 'Television Series'}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-[#F8FAFC] tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-[#858B9B] mt-1 max-w-xl">
            {subtitle}
          </p>
        </div>

        <div className="text-xs text-[#858B9B] font-mono">
          Showing <span className="text-[#38BDF8] font-bold">{filteredItems.length}</span> titles
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 font-medium text-[#A1A1AA] mr-1">
              <Filter className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>Filters:</span>
            </span>

            {/* Genre Filter */}
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
            >
              {GENRE_LIST.map((g) => (
                <option key={g} value={g}>
                  {g === 'All' ? 'All Genres' : g}
                </option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
            >
              <option value="All">All Years</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2018">2018</option>
              <option value="2017">2017</option>
              <option value="2014">2014</option>
            </select>

            {/* Min Rating Filter */}
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
            >
              <option value={0}>Any Score</option>
              <option value={8.0}>8.0+ Exceptional</option>
              <option value={7.5}>7.5+ Highly Rated</option>
              <option value={7.0}>7.0+ Recommended</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
            >
              <option value="popularity.desc">Most Popular</option>
              <option value="vote_average.desc">Highest Rated</option>
              <option value="primary_release_date.desc">Release Date (Newest)</option>
              <option value="title.asc">Title (A-Z)</option>
            </select>
          </div>

          {/* Quick Search and Reset */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter by keyword..."
              className="bg-[#191D2B] text-[#F8FAFC] placeholder-[#858B9B] border border-[#272B3A] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#8B5CF6] w-36 sm:w-48"
            />

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#191D2B] text-[#858B9B] hover:text-[#F8FAFC] border border-[#272B3A] text-xs transition-colors cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Cards */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onSelect={onSelect}
              onWatchTrailer={onWatchTrailer}
              isWatchlisted={watchlistIds.includes(item.id)}
              isFavorite={favoriteIds.includes(item.id)}
              onToggleWatchlist={onToggleWatchlist}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center rounded-2xl border border-dashed border-[#272B3A] bg-[#111421]/50 space-y-3">
          <p className="text-base font-semibold text-[#F8FAFC]">No titles match the chosen filters</p>
          <p className="text-xs text-[#858B9B] max-w-sm mx-auto">
            Try adjusting your genre, year, or rating thresholds to uncover more titles.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-[#8B5CF6] text-white text-xs font-semibold hover:bg-[#7C3AED] transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
