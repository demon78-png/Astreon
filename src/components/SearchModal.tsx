import React, { useState, useEffect, useRef } from 'react';
import { MediaItem, NewsArticle } from '../types/entertainment';
import { formatRating, formatReleaseYear } from '../utils/entertainment';
import {
  loadRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches
} from '../utils/recentSearches';
import { Search, X, Film, Tv, Newspaper, Star, Clock, Loader2 } from 'lucide-react';
import { saveSearchQueryToFirestore } from '../services/firebase';
import { searchMedia } from '../services/api';
import { useI18n } from '../contexts/I18nContext';
import { trackSearchInteraction } from '../utils/analytics';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  newsArticles: NewsArticle[];
  onSelectMedia: (item: MediaItem) => void;
  onSelectArticle: (article: NewsArticle) => void;
  currentUserId?: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  mediaItems,
  newsArticles,
  onSelectMedia,
  onSelectArticle,
  currentUserId
}) => {
  const { t, tGenre, tmdbLanguage } = useI18n();
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv' | 'news'>('all');
  const [filterGenre, setFilterGenre] = useState<string>('');
  const [filterEra, setFilterEra] = useState<string>('');
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [liveResults, setLiveResults] = useState<MediaItem[] | null>(null);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [searchSource, setSearchSource] = useState<'tmdb' | 'catalog'>('catalog');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadRecentSearches());

  const [failedThumbs, setFailedThumbs] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      setRecentSearches(loadRecentSearches());
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setFilterGenre('');
      setFilterEra('');
      setActiveIndex(-1);
      setLiveResults(null);
      setIsSearchingLive(false);
      setSearchSource('catalog');
    }
  }, [isOpen]);

  // Debounced live TMDB search
  useEffect(() => {
    const trimmed = query.trim();
    if (!isOpen || trimmed.length < 2 || filterType === 'news') {
      setLiveResults(null);
      setIsSearchingLive(false);
      setSearchSource('catalog');
      return;
    }

    let cancelled = false;
    setIsSearchingLive(true);
    const timer = setTimeout(async () => {
      const res = await searchMedia(
        trimmed,
        filterType === 'movie' || filterType === 'tv' ? filterType : 'all',
        tmdbLanguage
      );
      if (!cancelled) {
        setLiveResults(res.results);
        setSearchSource(res.source);
        setIsSearchingLive(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, filterType, isOpen, tmdbLanguage]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, filterType, filterGenre, filterEra]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchesQuickChips = (m: MediaItem) => {
    if (filterGenre && !m.genres.some((g) => g.toLowerCase() === filterGenre.toLowerCase())) {
      return false;
    }
    if (filterEra) {
      const rawYear = Number((m.releaseDate || m.firstAirDate || '').slice(0, 4));
      if (!Number.isFinite(rawYear) || rawYear === 0) return false;
      if (filterEra === '2026+' && rawYear < 2026) return false;
      if (filterEra === '2025' && rawYear !== 2025) return false;
      if (filterEra === '2024' && rawYear !== 2024) return false;
      if (filterEra === 'classic' && rawYear >= 2020) return false;
    }
    return true;
  };

  const localFilteredMedia = mediaItems.filter((m) => {
    if (filterType === 'news') return false;
    if (filterType !== 'all' && m.mediaType !== filterType) return false;
    if (!matchesQuickChips(m)) return false;
    if (!q) return true;
    return (
      m.title.toLowerCase().includes(q) ||
      m.overview.toLowerCase().includes(q) ||
      m.genres.some((g) => g.toLowerCase().includes(q)) ||
      m.cast?.some((c) => c.name.toLowerCase().includes(q))
    );
  });

  const filteredMedia = (() => {
    if (filterType === 'news') return [];
    if (!liveResults || q.length < 2) return localFilteredMedia;
    const seen = new Set(localFilteredMedia.map((m) => `${m.mediaType}:${m.id}`));
    const extraLive = liveResults.filter(
      (m) => !seen.has(`${m.mediaType}:${m.id}`) && matchesQuickChips(m)
    );
    return [...localFilteredMedia, ...extraLive];
  })();

  const filteredNews = newsArticles.filter((n) => {
    if (filterType === 'movie' || filterType === 'tv' || filterGenre || filterEra) return false;
    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      n.excerpt.toLowerCase().includes(q) ||
      n.category.toLowerCase().includes(q) ||
      n.author.toLowerCase().includes(q)
    );
  });

  type KeyboardTarget =
    | { kind: 'media'; item: MediaItem; optionId: string }
    | { kind: 'news'; article: NewsArticle; optionId: string };

  const combinedOptions: KeyboardTarget[] = [
    ...filteredMedia.map((item) => ({
      kind: 'media' as const,
      item,
      optionId: `search-opt-media-${item.mediaType}-${item.id}`
    })),
    ...filteredNews.map((article) => ({
      kind: 'news' as const,
      article,
      optionId: `search-opt-news-${article.id}`
    }))
  ];

  const activeOptionId =
    activeIndex >= 0 && activeIndex < combinedOptions.length
      ? combinedOptions[activeIndex].optionId
      : undefined;

  const saveSearch = (term: string, resultCount?: number) => {
    const cleanTerm = term.trim();
    if (!cleanTerm) return;
    const updated = addRecentSearch(recentSearches, cleanTerm);
    setRecentSearches(updated);
    trackSearchInteraction(
      cleanTerm,
      typeof resultCount === 'number' ? resultCount : filteredMedia.length + filteredNews.length
    );
    if (currentUserId) {
      saveSearchQueryToFirestore(currentUserId, cleanTerm).catch(() => {});
    }
  };

  const handleSelectQuery = (term: string) => {
    setQuery(term);
    saveSearch(term, filteredMedia.length + filteredNews.length);
    inputRef.current?.focus();
  };

  const handleRemoveRecent = (term: string) => {
    setRecentSearches((prev) => removeRecentSearch(prev, term));
  };

  const handleClearRecent = () => {
    setRecentSearches(clearRecentSearches());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-start justify-center p-0 md:p-12 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-heading"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full md:max-w-2xl max-h-[88dvh] md:max-h-none flex flex-col bg-[#111421] border-t md:border border-[#272B3A] rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl md:mt-12 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile bottom-sheet drag handle */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1 bg-[#080A12] shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-[#272B3A]" aria-hidden="true" />
        </div>

        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#272B3A] bg-[#080A12] gap-3 shrink-0">
          {isSearchingLive ? (
            <Loader2 className="w-5 h-5 text-[#38BDF8] shrink-0 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-[#858B9B] shrink-0" />
          )}
          <input
            ref={inputRef}
            id="search-modal-heading"
            type="text"
            role="combobox"
            aria-expanded={combinedOptions.length > 0}
            aria-controls="search-results-listbox"
            aria-activedescendant={activeOptionId}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                if (combinedOptions.length === 0) return;
                e.preventDefault();
                setActiveIndex((prev) => {
                  const next = prev < combinedOptions.length - 1 ? prev + 1 : 0;
                  document
                    .getElementById(combinedOptions[next]?.optionId || '')
                    ?.scrollIntoView({ block: 'nearest' });
                  return next;
                });
              } else if (e.key === 'ArrowUp') {
                if (combinedOptions.length === 0) return;
                e.preventDefault();
                setActiveIndex((prev) => {
                  const next = prev > 0 ? prev - 1 : combinedOptions.length - 1;
                  document
                    .getElementById(combinedOptions[next]?.optionId || '')
                    ?.scrollIntoView({ block: 'nearest' });
                  return next;
                });
              } else if (e.key === 'Enter') {
                if (activeIndex >= 0 && activeIndex < combinedOptions.length) {
                  e.preventDefault();
                  const selected = combinedOptions[activeIndex];
                  if (query.trim()) saveSearch(query);
                  if (selected.kind === 'media') onSelectMedia(selected.item);
                  else onSelectArticle(selected.article);
                  onClose();
                } else if (query.trim()) {
                  e.preventDefault();
                  saveSearch(query);
                }
              }
            }}
            placeholder={t('search.placeholder')}
            className="w-full min-h-[36px] bg-transparent text-sm sm:text-base text-[#F8FAFC] placeholder-[#858B9B] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#858B9B] hover:text-[#F8FAFC] rounded cursor-pointer"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[36px] px-2.5 py-1 text-xs text-[#858B9B] hover:text-[#F8FAFC] border border-[#272B3A] rounded-lg bg-[#191D2B] cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Filter Tabs & Quick Genre / Era Chips */}
        <div className="p-2.5 bg-[#080A12]/60 border-b border-[#272B3A] space-y-2 text-xs shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
              {[
                { id: 'all', label: t('search.allResults') },
                { id: 'movie', label: t('search.films') },
                { id: 'tv', label: t('search.series') },
                { id: 'news', label: t('nav.editorial') }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id as any)}
                  className={`min-h-[36px] md:min-h-0 px-3 py-1.5 md:py-1 rounded-lg font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    filterType === tab.id
                      ? 'bg-[#8B5CF6] text-white shadow-sm'
                      : 'text-[#858B9B] hover:text-[#F8FAFC] hover:bg-[#191D2B]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {searchSource === 'tmdb' && q.length >= 2 && (
              <span className="text-[10px] font-mono text-[#38BDF8] px-2 shrink-0">
                Live TMDB
              </span>
            )}
          </div>

          {filterType !== 'news' && (
            <div
              className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]"
              data-testid="search-quick-chips"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[#858B9B] mr-0.5">{t('search.quickGenres')}:</span>
                {['Science Fiction', 'Drama', 'Action', 'Mystery', 'Animation'].map((genre) => {
                  const active = filterGenre === genre;
                  return (
                    <button
                      key={genre}
                      type="button"
                      data-testid={`search-genre-chip-${genre}`}
                      onClick={() => setFilterGenre(active ? '' : genre)}
                      className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#38BDF8]/15 border-[#38BDF8]/50 text-[#38BDF8]'
                          : 'bg-[#111421] border-[#272B3A] text-[#A1A1AA] hover:text-[#F8FAFC]'
                      }`}
                    >
                      {tGenre(genre)}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[#858B9B] mr-0.5">{t('search.quickDecades')}:</span>
                {[
                  { id: '2026+', label: '2026+' },
                  { id: '2025', label: '2025' },
                  { id: '2024', label: '2024' },
                  { id: 'classic', label: '<2020' }
                ].map((era) => {
                  const active = filterEra === era.id;
                  return (
                    <button
                      key={era.id}
                      type="button"
                      data-testid={`search-era-chip-${era.id}`}
                      onClick={() => setFilterEra(active ? '' : era.id)}
                      className={`px-2 py-0.5 rounded border font-mono transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#8B5CF6]/20 border-[#8B5CF6]/60 text-[#F8FAFC]'
                          : 'bg-[#111421] border-[#272B3A] text-[#A1A1AA] hover:text-[#F8FAFC]'
                      }`}
                    >
                      {era.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Search Results Area */}
        <div
          id="search-results-listbox"
          role="listbox"
          className="flex-1 md:max-h-[56vh] overflow-y-auto p-4 space-y-4 custom-scrollbar"
        >
          {/* Recent Searches section when query input is empty */}
          {!q && !filterGenre && !filterEra && (
            <section
              className="space-y-2.5 pb-3 border-b border-[#272B3A]/80"
              aria-label={t('search.recent')}
              data-testid="recent-searches-section"
            >
              <div className="flex items-center justify-between text-xs text-[#858B9B]">
                <span className="flex items-center gap-1.5 font-medium text-[#A1A1AA]">
                  <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                  {t('search.recent')}
                </span>
                {recentSearches.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearRecent}
                    data-testid="clear-recent-searches"
                    className="hover:text-rose-400 text-[11px] transition-colors cursor-pointer"
                  >
                    {t('search.clearHistory')}
                  </button>
                )}
              </div>

              {recentSearches.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      data-testid="recent-search-chip"
                      className="inline-flex items-center rounded-lg bg-[#191D2B] border border-[#272B3A] hover:border-[#8B5CF6]/50 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectQuery(term)}
                        className="pl-3 pr-1.5 py-1.5 md:py-1 text-xs text-[#A1A1AA] hover:text-[#F8FAFC] cursor-pointer"
                      >
                        {term}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveRecent(term)}
                        aria-label={`Remove ${term} from recent searches`}
                        className="pr-2 pl-1 py-1.5 md:py-1 text-[#858B9B] hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p
                  className="text-xs text-[#858B9B]"
                  data-testid="recent-searches-empty"
                >
                  {t('search.recentEmpty')}
                </p>
              )}
            </section>
          )}

          {/* Media Results List */}
          {filteredMedia.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] uppercase tracking-wider font-semibold text-[#858B9B]">
                {t('search.titles')} ({filteredMedia.length})
              </h4>
              <div className="space-y-1.5">
                {filteredMedia.map((item, idx) => {
                  const itemKey = `${item.mediaType}-${item.id}`;
                  const optionId = `search-opt-media-${itemKey}`;
                  const isActive = activeIndex === idx;
                  return (
                    <div
                      key={itemKey}
                      id={optionId}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => {
                        if (query.trim()) saveSearch(query);
                        onSelectMedia(item);
                        onClose();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (query.trim()) saveSearch(query);
                          onSelectMedia(item);
                          onClose();
                        }
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors cursor-pointer group ${
                        isActive
                          ? 'bg-[#191D2B] border-[#38BDF8]/60 ring-1 ring-[#38BDF8]/40'
                          : 'bg-[#080A12]/50 hover:bg-[#191D2B] border-transparent hover:border-[#272B3A]'
                      }`}
                      tabIndex={0}
                    >
                      <div className="w-10 h-14 rounded-lg bg-[#191D2B] overflow-hidden shrink-0">
                        {item.posterPath && !failedThumbs[itemKey] ? (
                          <img
                            src={item.posterPath}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            onError={() => setFailedThumbs((prev) => ({ ...prev, [itemKey]: true }))}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#858B9B]">
                            <Film className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {item.mediaType === 'movie' ? (
                            <Film className="w-3.5 h-3.5 text-[#38BDF8]" />
                          ) : (
                            <Tv className="w-3.5 h-3.5 text-[#8B5CF6]" />
                          )}
                          <h5 className="text-xs sm:text-sm font-semibold text-[#F8FAFC] group-hover:text-[#38BDF8] truncate">
                            {item.title}
                          </h5>
                        </div>
                        <p className="text-[11px] text-[#858B9B] mt-0.5">
                          {formatReleaseYear(item.releaseDate || item.firstAirDate)} ·{' '}
                          {item.genres.slice(0, 2).map(tGenre).join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-mono text-[#38BDF8] shrink-0">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{formatRating(item.voteAverage)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Editorial News Results */}
          {filteredNews.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#272B3A]">
              <h4 className="text-[11px] uppercase tracking-wider font-semibold text-[#858B9B]">
                {t('search.articles')} ({filteredNews.length})
              </h4>
              <div className="space-y-1.5">
                {filteredNews.map((article, idx) => {
                  const combinedIdx = filteredMedia.length + idx;
                  const optionId = `search-opt-news-${article.id}`;
                  const isActive = activeIndex === combinedIdx;
                  return (
                    <div
                      key={article.id}
                      id={optionId}
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(combinedIdx)}
                      onClick={() => {
                        if (query.trim()) saveSearch(query);
                        onSelectArticle(article);
                        onClose();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (query.trim()) saveSearch(query);
                          onSelectArticle(article);
                          onClose();
                        }
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors cursor-pointer group ${
                        isActive
                          ? 'bg-[#191D2B] border-[#8B5CF6]/60 ring-1 ring-[#8B5CF6]/40'
                          : 'bg-[#080A12]/50 hover:bg-[#191D2B] border-transparent hover:border-[#272B3A]'
                      }`}
                      tabIndex={0}
                    >
                      <Newspaper className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs sm:text-sm font-medium text-[#F8FAFC] group-hover:text-[#8B5CF6] truncate">
                          {article.title}
                        </h5>
                        <p className="text-[11px] text-[#858B9B]">
                          {article.category} · {article.readTime} ·{' '}
                          {t('editorial.byAuthor', { author: article.author })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state when nothing matches */}
          {filteredMedia.length === 0 && filteredNews.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-medium text-[#F8FAFC]">
                {t('search.noMatches', { query })}
              </p>
              <p className="text-xs text-[#858B9B]">{t('search.noMatchesHint')}</p>
            </div>
          )}
        </div>

        {/* Keyboard navigation hint footer */}
        <div className="hidden md:flex items-center justify-between px-4 py-2 border-t border-[#272B3A] bg-[#080A12] text-[11px] font-mono text-[#858B9B]">
          <span>{t('search.keyboardHint')}</span>
          <span>/ {t('shortcuts.toggleSearch')} · ? {t('shortcuts.toggleHelp')}</span>
        </div>
      </div>
    </div>
  );
};
