import React, { useState, useEffect, useRef } from 'react';
import { MediaItem, NewsArticle } from '../types/entertainment';
import { formatRating, formatReleaseYear } from '../utils/entertainment';
import { Search, X, Film, Tv, Newspaper, Star, Clock } from 'lucide-react';
import { saveSearchQueryToFirestore } from '../services/firebase';

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
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv' | 'news'>('all');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('astreon_recent_searches');
      return saved ? JSON.parse(saved) : ['Dune', 'Oppenheimer', 'Severance', 'Sci-Fi'];
    } catch {
      return ['Dune', 'Oppenheimer', 'Severance'];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const filteredMedia = mediaItems.filter((m) => {
    if (filterType === 'news') return false;
    if (filterType !== 'all' && m.mediaType !== filterType) return false;
    if (!q) return true;
    return (
      m.title.toLowerCase().includes(q) ||
      m.overview.toLowerCase().includes(q) ||
      m.genres.some((g) => g.toLowerCase().includes(q)) ||
      m.cast?.some((c) => c.name.toLowerCase().includes(q))
    );
  });

  const filteredNews = newsArticles.filter((n) => {
    if (filterType === 'movie' || filterType === 'tv') return false;
    if (!q) return true;
    return (
      n.title.toLowerCase().includes(q) ||
      n.excerpt.toLowerCase().includes(q) ||
      n.category.toLowerCase().includes(q) ||
      n.author.toLowerCase().includes(q)
    );
  });

  const handleSelectQuery = (term: string) => {
    setQuery(term);
    saveSearch(term);
  };

  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term.trim(), ...recentSearches.filter((s) => s.toLowerCase() !== term.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('astreon_recent_searches', JSON.stringify(updated));
    } catch {}
    if (currentUserId) {
      saveSearchQueryToFirestore(currentUserId, term.trim()).catch(() => {});
    }
  };

  const clearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('astreon_recent_searches');
    } catch {}
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 md:p-12 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-heading"
    >
      <div
        className="relative w-full max-w-2xl bg-[#111421] border border-[#272B3A] rounded-2xl overflow-hidden shadow-2xl mt-8 sm:mt-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#272B3A] bg-[#080A12] gap-3">
          <Search className="w-5 h-5 text-[#858B9B] shrink-0" />
          <input
            ref={inputRef}
            id="search-modal-heading"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query) saveSearch(query);
            }}
            placeholder="Search films, series, genres, cast members, or editorial dispatches..."
            className="w-full bg-transparent text-sm sm:text-base text-[#F8FAFC] placeholder-[#858B9B] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#858B9B] hover:text-[#F8FAFC] rounded cursor-pointer"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs text-[#858B9B] hover:text-[#F8FAFC] border border-[#272B3A] rounded-md bg-[#191D2B] cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-2 bg-[#080A12]/60 border-b border-[#272B3A] text-xs">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'movie', label: 'Films' },
            { id: 'tv', label: 'Series' },
            { id: 'news', label: 'Editorial' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filterType === tab.id
                  ? 'bg-[#8B5CF6] text-white shadow-sm'
                  : 'text-[#858B9B] hover:text-[#F8FAFC] hover:bg-[#191D2B]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Recent search chips when query is empty */}
          {!query && recentSearches.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#858B9B]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Recent Inquiries
                </span>
                <button
                  onClick={clearRecent}
                  className="hover:text-rose-400 text-[11px] cursor-pointer"
                >
                  Clear History
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSelectQuery(term)}
                    className="px-3 py-1 rounded-lg bg-[#191D2B] hover:bg-[#272B3A] border border-[#272B3A] text-xs text-[#A1A1AA] hover:text-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Media Results List */}
          {filteredMedia.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[11px] uppercase tracking-wider font-semibold text-[#858B9B]">
                Titles ({filteredMedia.length})
              </h4>
              <div className="space-y-1.5">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (query) saveSearch(query);
                      onSelectMedia(item);
                      onClose();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#080A12]/50 hover:bg-[#191D2B] border border-transparent hover:border-[#272B3A] transition-colors cursor-pointer group"
                    role="button"
                    tabIndex={0}
                  >
                    <div className="w-10 h-14 rounded-lg bg-[#191D2B] overflow-hidden shrink-0">
                      <img
                        src={item.posterPath}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
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
                        {formatReleaseYear(item.releaseDate || item.firstAirDate)} · {item.genres.slice(0, 2).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-mono text-[#38BDF8] shrink-0">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{formatRating(item.voteAverage)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Editorial News Results */}
          {filteredNews.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#272B3A]">
              <h4 className="text-[11px] uppercase tracking-wider font-semibold text-[#858B9B]">
                Editorial Articles ({filteredNews.length})
              </h4>
              <div className="space-y-1.5">
                {filteredNews.map((article) => (
                  <div
                    key={article.id}
                    onClick={() => {
                      if (query) saveSearch(query);
                      onSelectArticle(article);
                      onClose();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-[#080A12]/50 hover:bg-[#191D2B] border border-transparent hover:border-[#272B3A] transition-colors cursor-pointer group"
                    role="button"
                    tabIndex={0}
                  >
                    <Newspaper className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs sm:text-sm font-medium text-[#F8FAFC] group-hover:text-[#8B5CF6] truncate">
                        {article.title}
                      </h5>
                      <p className="text-[11px] text-[#858B9B]">
                        {article.category} · {article.readTime} · By {article.author}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state when nothing matches */}
          {filteredMedia.length === 0 && filteredNews.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-medium text-[#F8FAFC]">
                No entertainment matches found for "{query}"
              </p>
              <p className="text-xs text-[#858B9B]">
                Try adjusting your search criteria, browsing by genre in Movies or TV Shows, or clearing filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
