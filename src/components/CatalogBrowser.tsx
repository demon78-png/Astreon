import React, { useState, useEffect, useMemo } from 'react';
import { MediaItem, MediaType, FilterState } from '../types/entertainment';
import { MediaCard } from './MediaCard';
import { filterMedia, sortMedia, extractCatalogFacets, getMediaKey } from '../utils/entertainment';
import type { CatalogFilterParams } from '../utils/routing';
import { Filter, RotateCcw, Film, Tv, Loader2, ChevronDown } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import type { MediaStarStats } from '../utils/ratings';
import { CatalogCardGridSkeleton } from './Skeletons';

interface CatalogBrowserProps {
  mediaType: MediaType | 'all';
  items: MediaItem[];
  onSelect: (item: MediaItem) => void;
  onWatchTrailer?: (item: MediaItem) => void;
  watchlistIds?: number[];
  favoriteIds?: number[];
  watchlistKeys?: string[];
  favoriteKeys?: string[];
  onToggleWatchlist?: (item: MediaItem) => void;
  onToggleFavorite?: (item: MediaItem) => void;
  title: string;
  subtitle: string;
  initialFilters?: CatalogFilterParams;
  onFiltersChange?: (filters: CatalogFilterParams) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  isLoading?: boolean;
  onLoadMore?: (filters: CatalogFilterParams) => void;
  autoplayTrailers?: boolean;
  isOnline?: boolean;
  communityRatings?: Record<string, MediaStarStats>;
}

const BASE_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi & Fantasy',
  'Science Fiction',
  'Thriller',
  'War'
];

export const CatalogBrowser: React.FC<CatalogBrowserProps> = ({
  mediaType,
  items,
  onSelect,
  onWatchTrailer,
  watchlistIds = [],
  favoriteIds = [],
  watchlistKeys,
  favoriteKeys,
  onToggleWatchlist,
  onToggleFavorite,
  title,
  subtitle,
  initialFilters,
  onFiltersChange,
  hasMore = false,
  loadingMore = false,
  isLoading = false,
  onLoadMore,
  autoplayTrailers = true,
  isOnline = true,
  communityRatings
}) => {
  const { t, tGenre } = useI18n();
  const [selectedGenre, setSelectedGenre] = useState(initialFilters?.genre || 'All');
  const [selectedYear, setSelectedYear] = useState(initialFilters?.year || 'All');
  const [minRating, setMinRating] = useState<number>(initialFilters?.minRating || 0);
  const [sortBy, setSortBy] = useState<FilterState['sortBy']>(
    initialFilters?.sort || 'popularity.desc'
  );
  const [searchFilter, setSearchFilter] = useState(initialFilters?.q || '');

  // Keep filter controls synchronized with browser navigation (popstate / view switch)
  useEffect(() => {
    setSelectedGenre(initialFilters?.genre || 'All');
    setSelectedYear(initialFilters?.year || 'All');
    setMinRating(initialFilters?.minRating || 0);
    setSortBy(initialFilters?.sort || 'popularity.desc');
    setSearchFilter(initialFilters?.q || '');
  }, [
    mediaType,
    initialFilters?.genre,
    initialFilters?.year,
    initialFilters?.minRating,
    initialFilters?.sort,
    initialFilters?.q
  ]);

  const facets = useMemo(() => {
    const derived = extractCatalogFacets(items);
    const mergedGenres = Array.from(new Set([...BASE_GENRES, ...derived.genres])).sort((a, b) =>
      a.localeCompare(b)
    );
    return {
      genres: ['All', ...mergedGenres],
      years: derived.years
    };
  }, [items]);

  const emitFilterChange = (next: {
    genre: string;
    year: string;
    minRating: number;
    sort: FilterState['sortBy'];
    q: string;
  }) => {
    onFiltersChange?.({
      genre: next.genre !== 'All' ? next.genre : undefined,
      year: next.year !== 'All' ? next.year : undefined,
      minRating: next.minRating > 0 ? next.minRating : undefined,
      sort: next.sort !== 'popularity.desc' ? next.sort : undefined,
      q: next.q.trim() ? next.q.trim() : undefined
    });
  };

  const filteredItems = useMemo(() => {
    const result = filterMedia(items, {
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
    emitFilterChange({
      genre: 'All',
      year: 'All',
      minRating: 0,
      sort: 'popularity.desc',
      q: ''
    });
  };

  const hasActiveFilters =
    selectedGenre !== 'All' ||
    selectedYear !== 'All' ||
    minRating > 0 ||
    sortBy !== 'popularity.desc' ||
    searchFilter !== '';

  const currentFilterParams: CatalogFilterParams = {
    genre: selectedGenre !== 'All' ? selectedGenre : undefined,
    year: selectedYear !== 'All' ? selectedYear : undefined,
    minRating: minRating > 0 ? minRating : undefined,
    sort: sortBy !== 'popularity.desc' ? sortBy : undefined,
    q: searchFilter.trim() || undefined
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#38BDF8] mb-1">
            {mediaType === 'movie' ? <Film className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
            <span>{mediaType === 'movie' ? t('catalog.cinemaEyebrow') : t('catalog.tvEyebrow')}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-[#F8FAFC] tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-[#858B9B] mt-1 max-w-xl">
            {subtitle}
          </p>
        </div>

        <div className="text-xs text-[#858B9B] font-mono tabular-nums whitespace-nowrap shrink-0">
          {t('catalog.showingCount', { count: filteredItems.length })}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-wrap items-center gap-2">
            <span className="col-span-2 sm:col-span-4 lg:col-span-1 flex items-center gap-1.5 font-medium text-[#A1A1AA] mb-0.5 lg:mb-0 lg:mr-1">
              <Filter className="w-3.5 h-3.5 text-[#8B5CF6]" />
              <span>{t('catalog.filters')}</span>
            </span>

            {/* Genre Filter */}
            <select
              aria-label="Filter by genre"
              value={selectedGenre}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedGenre(val);
                emitFilterChange({
                  genre: val,
                  year: selectedYear,
                  minRating,
                  sort: sortBy,
                  q: searchFilter
                });
              }}
              className="w-full lg:w-auto min-h-[42px] lg:min-h-0 bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A] rounded-lg px-2.5 py-2 lg:py-1.5 text-xs focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
            >
              {facets.genres.map((g) => (
                <option key={g} value={g}>
                  {g === 'All' ? t('catalog.allGenres') : tGenre(g)}
                </option>
              ))}
            </select>

            {/* Year Filter */}
            <select
              aria-label="Filter by release year"
              value={selectedYear}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedYear(val);
                emitFilterChange({
                  genre: selectedGenre,
                  year: val,
                  minRating,
                  sort: sortBy,
                  q: searchFilter
                });
              }}
              className="w-full lg:w-auto min-h-[42px] lg:min-h-0 bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A] rounded-lg px-2.5 py-2 lg:py-1.5 text-xs focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
            >
              <option value="All">{t('catalog.allYears')}</option>
              {facets.years.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>

            {/* Min Rating Filter */}
            <select
              aria-label="Filter by minimum score"
              value={minRating}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMinRating(val);
                emitFilterChange({
                  genre: selectedGenre,
                  year: selectedYear,
                  minRating: val,
                  sort: sortBy,
                  q: searchFilter
                });
              }}
              className="w-full lg:w-auto min-h-[42px] lg:min-h-0 bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A] rounded-lg px-2.5 py-2 lg:py-1.5 text-xs focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
            >
              <option value={0}>{t('catalog.anyScore')}</option>
              <option value={8.0}>{t('catalog.score80')}</option>
              <option value={7.5}>{t('catalog.score75')}</option>
              <option value={7.0}>{t('catalog.score70')}</option>
            </select>

            {/* Sort Order */}
            <select
              aria-label="Sort catalog order"
              value={sortBy}
              onChange={(e) => {
                const val = e.target.value as FilterState['sortBy'];
                setSortBy(val);
                emitFilterChange({
                  genre: selectedGenre,
                  year: selectedYear,
                  minRating,
                  sort: val,
                  q: searchFilter
                });
              }}
              className="w-full lg:w-auto min-h-[42px] lg:min-h-0 bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A] rounded-lg px-2.5 py-2 lg:py-1.5 text-xs focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
            >
              <option value="popularity.desc">{t('catalog.sortPopular')}</option>
              <option value="vote_average.desc">{t('catalog.sortRated')}</option>
              <option value="primary_release_date.desc">{t('catalog.sortNewest')}</option>
              <option value="title.asc">{t('catalog.sortAlpha')}</option>
            </select>
          </div>

          {/* Quick Search and Reset */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <input
              type="text"
              aria-label="Filter catalog by keyword"
              value={searchFilter}
              onChange={(e) => {
                const val = e.target.value;
                setSearchFilter(val);
                emitFilterChange({
                  genre: selectedGenre,
                  year: selectedYear,
                  minRating,
                  sort: sortBy,
                  q: val
                });
              }}
              placeholder={t('catalog.keywordPlaceholder')}
              className="flex-1 lg:flex-initial min-h-[42px] lg:min-h-0 bg-[#191D2B] text-[#F8FAFC] placeholder-[#858B9B] border border-[#272B3A] rounded-lg px-3 py-2 lg:py-1.5 text-xs focus:outline-none focus:border-[#8B5CF6] lg:w-48"
            />

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center justify-center gap-1.5 min-h-[42px] lg:min-h-0 px-3 py-2 lg:py-1.5 rounded-lg bg-[#191D2B] text-[#858B9B] hover:text-[#F8FAFC] border border-[#272B3A] text-xs transition-colors cursor-pointer shrink-0"
                title={t('catalog.resetFilters')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('catalog.reset')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Cards */}
      {isLoading ? (
        <div data-testid="catalog-filter-skeleton">
          <CatalogCardGridSkeleton count={10} />
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5 lg:gap-6">
            {filteredItems.map((item) => {
              const itemKey = getMediaKey(item.id, item.mediaType);
              return (
              <MediaCard
                key={`${item.mediaType}-${item.id}`}
                item={item}
                onSelect={onSelect}
                onWatchTrailer={onWatchTrailer}
                isWatchlisted={watchlistKeys ? watchlistKeys.includes(itemKey) : watchlistIds.includes(item.id)}
                isFavorite={favoriteKeys ? favoriteKeys.includes(itemKey) : favoriteIds.includes(item.id)}
                onToggleWatchlist={onToggleWatchlist}
                onToggleFavorite={onToggleFavorite}
                autoplayTrailers={autoplayTrailers}
                isOnline={isOnline}
                communityRating={communityRatings?.[itemKey]}
              />
              );
            })}
          </div>

          {hasMore && onLoadMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => onLoadMore(currentFilterParams)}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-xl bg-[#111421] hover:bg-[#191D2B] border border-[#272B3A] hover:border-[#8B5CF6]/50 text-xs font-semibold text-[#F8FAFC] transition-colors cursor-pointer disabled:opacity-60"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#38BDF8]" />
                    <span>{t('catalog.loadingMore')}</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>{mediaType === 'tv' ? t('catalog.loadMoreSeries') : t('catalog.loadMoreTitles')}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="py-20 text-center rounded-2xl border border-dashed border-[#272B3A] bg-[#111421]/50 space-y-3">
          <p className="text-base font-semibold text-[#F8FAFC]">{t('catalog.emptyHeading')}</p>
          <p className="text-xs text-[#858B9B] max-w-sm mx-auto">
            {t('catalog.emptyBody')}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-xl bg-[#8B5CF6] text-white text-xs font-semibold hover:bg-[#7C3AED] transition-colors cursor-pointer"
          >
            {t('catalog.resetFilters')}
          </button>
        </div>
      )}
    </div>
  );
};
