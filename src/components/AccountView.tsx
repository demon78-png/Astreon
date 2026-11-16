import React, { useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  WatchlistItem,
  FavoriteItem,
  WatchHistoryItem,
  CustomCollection
} from '../types/entertainment';
import {
  Bookmark,
  Heart,
  History,
  Settings,
  Trash2,
  Check,
  Film,
  Tv,
  Wifi,
  FolderHeart,
  Globe,
  Lock,
  Share2,
  Plus
} from 'lucide-react';
import {
  formatRating,
  formatReleaseYear,
  getScopedStorageKey,
  resolveAutoplayTrailersPreference
} from '../utils/entertainment';
import { SUPPORTED_PROVIDER_REGIONS } from '../utils/providers';
import { buildCollectionShareUrl } from '../utils/collections';
import type { AccountSubTab } from '../utils/routing';
import { deleteUserAccountFromFirebase } from '../services/firebase';
import { useI18n } from '../contexts/I18nContext';

interface AccountViewProps {
  currentUser: UserProfile;
  activeSubTab: AccountSubTab;
  onSubTabChange: (tab: AccountSubTab) => void;
  watchlist: WatchlistItem[];
  favorites: FavoriteItem[];
  watchHistory: WatchHistoryItem[];
  customCollections: CustomCollection[];
  watchRegion: string;
  onWatchRegionChange: (region: string) => void;
  onCreateCollection: (name: string, description: string, isPublic: boolean) => void;
  onToggleCollectionPublic: (collectionId: string) => void;
  onRemoveFromCollection: (collectionId: string, mediaId: number, mediaType: 'movie' | 'tv') => void;
  onDeleteCollection: (collectionId: string) => void;
  onRemoveWatchlist: (mediaId: number, mediaType: 'movie' | 'tv') => void;
  onRemoveFavorite: (mediaId: number, mediaType: 'movie' | 'tv') => void;
  onRemoveWatchHistory: (entryId: string) => void;
  onClearWatchHistory: () => void;
  onSelectMediaById: (mediaId: number, type: 'movie' | 'tv') => void;
  onUpdatePreferences: (updated: Partial<UserProfile>) => void;
  onSignOut: () => void;
}

const ALL_GENRES = [
  'Science Fiction',
  'Drama',
  'Adventure',
  'Mystery',
  'History',
  'Animation',
  'Action',
  'Comedy'
];

const SavedPosterImage: React.FC<{
  src: string;
  title: string;
  mediaType: 'movie' | 'tv';
}> = ({ src, title, mediaType }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#191D2B] text-[#858B9B] p-3 text-center">
        {mediaType === 'tv' ? (
          <Tv className="w-7 h-7 mb-1.5 opacity-60 text-[#38BDF8]" />
        ) : (
          <Film className="w-7 h-7 mb-1.5 opacity-60 text-[#8B5CF6]" />
        )}
        <span className="text-[11px] font-medium line-clamp-2">{title}</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={title}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
    />
  );
};

export const AccountView: React.FC<AccountViewProps> = ({
  currentUser,
  activeSubTab,
  onSubTabChange,
  watchlist,
  favorites,
  watchHistory,
  customCollections,
  watchRegion,
  onWatchRegionChange,
  onCreateCollection,
  onToggleCollectionPublic,
  onRemoveFromCollection,
  onDeleteCollection,
  onRemoveWatchlist,
  onRemoveFavorite,
  onRemoveWatchHistory,
  onClearWatchHistory,
  onSelectMediaById,
  onUpdatePreferences,
  onSignOut
}) => {
  const { t, tGenre, formatDate } = useI18n();
  const [preferredGenres, setPreferredGenres] = useState<string[]>(
    currentUser.preferredGenres || ['Science Fiction', 'Drama']
  );
  const [notifications, setNotifications] = useState(
    currentUser.notificationPreferences || {
      emailAlerts: true,
      newReleases: true,
      curatedWeekly: false
    }
  );
  const [autoplayTrailers, setAutoplayTrailers] = useState<boolean>(() =>
    resolveAutoplayTrailersPreference(currentUser)
  );
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [newListPublic, setNewListPublic] = useState(true);
  const [copiedCollectionId, setCopiedCollectionId] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setPreferredGenres(currentUser.preferredGenres || ['Science Fiction', 'Drama']);
    setNotifications(
      currentUser.notificationPreferences || {
        emailAlerts: true,
        newReleases: true,
        curatedWeekly: false
      }
    );
  }, [currentUser.uid, currentUser.preferredGenres, currentUser.notificationPreferences]);

  useEffect(() => {
    setAutoplayTrailers(resolveAutoplayTrailersPreference(currentUser));
  }, [currentUser.uid, currentUser.playbackPreferences?.autoplayTrailers]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) {
        clearTimeout(savedTimerRef.current);
      }
    };
  }, []);

  const toggleGenre = (genre: string) => {
    const updated = preferredGenres.includes(genre)
      ? preferredGenres.filter((g) => g !== genre)
      : [...preferredGenres, genre];
    setPreferredGenres(updated);
  };

  const handleToggleAutoplayTrailers = () => {
    const next = !autoplayTrailers;
    setAutoplayTrailers(next);
    onUpdatePreferences({
      playbackPreferences: { autoplayTrailers: next }
    });
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePreferences({
      preferredGenres,
      notificationPreferences: notifications,
      playbackPreferences: { autoplayTrailers },
      watchRegion
    });
    setSavedSuccess(true);
    if (savedTimerRef.current) {
      clearTimeout(savedTimerRef.current);
    }
    savedTimerRef.current = setTimeout(() => {
      setSavedSuccess(false);
      savedTimerRef.current = null;
    }, 2500);
  };

  const handleCopyCollectionLink = async (collectionId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = buildCollectionShareUrl(origin, collectionId);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedCollectionId(collectionId);
        setTimeout(() => setCopiedCollectionId(null), 2500);
      } catch {}
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Account Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#111421] border border-[#272B3A] mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-xl font-display font-bold text-[#38BDF8]">
            {currentUser.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-[#F8FAFC]">
              {currentUser.displayName}
            </h1>
            <p className="text-xs text-[#858B9B]">{currentUser.email}</p>
            <p className="text-[11px] text-[#A1A1AA] font-mono mt-0.5">
              Member since {formatDate(currentUser.createdAt)}
            </p>
          </div>
        </div>

        {/* Sub-tab switcher */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 p-1 bg-[#080A12] border border-[#272B3A] rounded-xl w-full sm:w-auto text-xs">
          <button
            onClick={() => onSubTabChange('watchlist')}
            className={`flex items-center justify-center gap-1.5 min-h-[40px] md:min-h-0 px-2.5 sm:px-3 py-2 md:py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'watchlist'
                ? 'bg-[#8B5CF6] text-white shadow-sm'
                : 'text-[#A1A1AA] hover:text-[#F8FAFC]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('nav.watchlist')} ({watchlist.length})</span>
          </button>

          <button
            onClick={() => onSubTabChange('favorites')}
            className={`flex items-center justify-center gap-1.5 min-h-[40px] md:min-h-0 px-2.5 sm:px-3 py-2 md:py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'favorites'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-[#A1A1AA] hover:text-[#F8FAFC]'
            }`}
          >
            <Heart className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('nav.favorites')} ({favorites.length})</span>
          </button>

          <button
            onClick={() => onSubTabChange('history')}
            data-testid="account-tab-history"
            className={`flex items-center justify-center gap-1.5 min-h-[40px] md:min-h-0 px-2.5 sm:px-3 py-2 md:py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'history'
                ? 'bg-[#0284C7] text-white shadow-sm'
                : 'text-[#A1A1AA] hover:text-[#F8FAFC]'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('nav.watchHistory')} ({watchHistory.length})</span>
          </button>

          <button
            onClick={() => onSubTabChange('collections')}
            data-testid="account-tab-collections"
            className={`flex items-center justify-center gap-1.5 min-h-[40px] md:min-h-0 px-2.5 sm:px-3 py-2 md:py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'collections'
                ? 'bg-[#8B5CF6]/80 text-white shadow-sm'
                : 'text-[#A1A1AA] hover:text-[#F8FAFC]'
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('account.collections')} ({customCollections.length})</span>
          </button>

          <button
            onClick={() => onSubTabChange('profile')}
            className={`flex items-center justify-center gap-1.5 min-h-[40px] md:min-h-0 px-2.5 sm:px-3 py-2 md:py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap col-span-2 sm:col-span-1 ${
              activeSubTab === 'profile'
                ? 'bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A]'
                : 'text-[#A1A1AA] hover:text-[#F8FAFC]'
            }`}
          >
            <Settings className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('account.preferences')}</span>
          </button>
        </div>
      </div>

      {/* WATCHLIST SUBTAB */}
      {activeSubTab === 'watchlist' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-semibold text-[#F8FAFC]">
                {t('account.yourWatchlist')}
              </h2>
              <p className="text-xs text-[#858B9B]">
                Titles bookmarked for future viewing sessions
              </p>
            </div>
          </div>

          {watchlist.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {watchlist.map((item) => (
                <div
                  key={`${item.mediaType}-${item.id}`}
                  className="group relative flex flex-col bg-[#111421] border border-[#272B3A] rounded-xl overflow-hidden hover:border-[#8B5CF6]/50 transition-all"
                >
                  <button
                    type="button"
                    onClick={() => onSelectMediaById(item.mediaId, item.mediaType)}
                    className="w-full text-left flex flex-col flex-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                  >
                    <div className="aspect-[2/3] w-full bg-[#191D2B] relative overflow-hidden">
                      <SavedPosterImage src={item.posterPath} title={item.title} mediaType={item.mediaType} />
                    </div>
                    <div className="p-3 w-full">
                      <h3 className="text-xs font-semibold text-[#F8FAFC] truncate group-hover:text-[#38BDF8]">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#858B9B] mt-1">
                        <span>{formatReleaseYear(item.releaseDate)}</span>
                        <span>·</span>
                        <span className="text-[#38BDF8] font-mono tabular-nums">{formatRating(item.voteAverage)}</span>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveWatchlist(item.mediaId, item.mediaType)}
                    className="absolute top-2 right-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-[#080A12]/85 hover:bg-rose-600 text-[#A1A1AA] hover:text-white border border-[#272B3A] transition-colors cursor-pointer"
                    aria-label={`Remove ${item.title} from Watchlist`}
                    title="Remove from Watchlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center rounded-2xl border border-dashed border-[#272B3A] bg-[#111421]/50 space-y-3">
              <Bookmark className="w-8 h-8 text-[#858B9B] mx-auto" />
              <p className="text-sm font-medium text-[#F8FAFC]">{t('account.watchlistEmpty')}</p>
              <p className="text-xs text-[#858B9B] max-w-sm mx-auto">
                Discover movies and series across ASTREON and click the bookmark button to save them here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* FAVOURITES SUBTAB */}
      {activeSubTab === 'favorites' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-semibold text-[#F8FAFC]">
                {t('account.personalFavorites')}
              </h2>
              <p className="text-xs text-[#858B9B]">
                Your all-time most admired films and television series
              </p>
            </div>
          </div>

          {favorites.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {favorites.map((item) => (
                <div
                  key={`${item.mediaType}-${item.id}`}
                  className="group relative flex flex-col bg-[#111421] border border-[#272B3A] rounded-xl overflow-hidden hover:border-rose-500/50 transition-all"
                >
                  <button
                    type="button"
                    onClick={() => onSelectMediaById(item.mediaId, item.mediaType)}
                    className="w-full text-left flex flex-col flex-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                  >
                    <div className="aspect-[2/3] w-full bg-[#191D2B] relative overflow-hidden">
                      <SavedPosterImage src={item.posterPath} title={item.title} mediaType={item.mediaType} />
                    </div>
                    <div className="p-3 w-full">
                      <h3 className="text-xs font-semibold text-[#F8FAFC] truncate group-hover:text-rose-400">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#858B9B] mt-1">
                        <span>{formatReleaseYear(item.releaseDate)}</span>
                        <span>·</span>
                        <span className="text-[#38BDF8] font-mono tabular-nums">{formatRating(item.voteAverage)}</span>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveFavorite(item.mediaId, item.mediaType)}
                    className="absolute top-2 right-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-[#080A12]/85 hover:bg-rose-600 text-[#A1A1AA] hover:text-white border border-[#272B3A] transition-colors cursor-pointer"
                    aria-label={`Remove ${item.title} from Favourites`}
                    title="Remove from Favourites"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center rounded-2xl border border-dashed border-[#272B3A] bg-[#111421]/50 space-y-3">
              <Heart className="w-8 h-8 text-[#858B9B] mx-auto" />
              <p className="text-sm font-medium text-[#F8FAFC]">{t('account.favoritesEmpty')}</p>
              <p className="text-xs text-[#858B9B] max-w-sm mx-auto">
                Mark your standout cinematic experiences with the heart icon to highlight them here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* WATCH HISTORY SUBTAB */}
      {activeSubTab === 'history' && (
        <div className="space-y-4" data-testid="watch-history-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-display font-semibold text-[#F8FAFC]">
                {t('account.watchHistory')}
              </h2>
              <p className="text-xs text-[#858B9B]">
                {t('account.watchHistorySubtitle')}
              </p>
            </div>
            {watchHistory.length > 0 && (
              <button
                type="button"
                onClick={onClearWatchHistory}
                data-testid="clear-watch-history-btn"
                className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-lg bg-[#191D2B] hover:bg-rose-600/20 text-xs font-medium text-[#A1A1AA] hover:text-rose-300 border border-[#272B3A] hover:border-rose-500/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('account.clearWatchHistory')}</span>
              </button>
            )}
          </div>

          {watchHistory.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {watchHistory.map((item) => (
                <div
                  key={item.id}
                  data-testid={`watch-history-item-${item.id}`}
                  className="group relative flex flex-col bg-[#111421] border border-[#272B3A] rounded-xl overflow-hidden hover:border-[#38BDF8]/50 transition-all"
                >
                  <button
                    type="button"
                    onClick={() => onSelectMediaById(item.mediaId, item.mediaType)}
                    className="w-full text-left flex flex-col flex-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                  >
                    <div className="aspect-[2/3] w-full bg-[#191D2B] relative overflow-hidden">
                      <SavedPosterImage src={item.posterPath} title={item.title} mediaType={item.mediaType} />
                    </div>
                    <div className="p-3 w-full space-y-1">
                      <h3 className="text-xs font-semibold text-[#F8FAFC] truncate group-hover:text-[#38BDF8]">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#858B9B]">
                        <span>{formatReleaseYear(item.releaseDate)}</span>
                        <span>·</span>
                        <span className="text-[#38BDF8] font-mono tabular-nums">{formatRating(item.voteAverage)}</span>
                      </div>
                      <p className="text-[10px] font-mono text-[#858B9B] truncate">
                        {t('account.viewedOn', { date: formatDate(item.viewedAt) })}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveWatchHistory(item.id)}
                    className="absolute top-2 right-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-[#080A12]/85 hover:bg-rose-600 text-[#A1A1AA] hover:text-white border border-[#272B3A] transition-colors cursor-pointer"
                    aria-label={`Remove ${item.title} from Watch History`}
                    title="Remove from Watch History"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center rounded-2xl border border-dashed border-[#272B3A] bg-[#111421]/50 space-y-3">
              <History className="w-8 h-8 text-[#858B9B] mx-auto" />
              <p className="text-sm font-medium text-[#F8FAFC]">{t('account.watchHistoryEmpty')}</p>
              <p className="text-xs text-[#858B9B] max-w-sm mx-auto">
                {t('account.watchHistoryEmptyHint')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* CUSTOM COLLECTIONS SUBTAB */}
      {activeSubTab === 'collections' && (
        <div className="space-y-6" data-testid="custom-collections-panel">
          <div>
            <h2 className="text-lg font-display font-semibold text-[#F8FAFC]">
              {t('account.collections')}
            </h2>
            <p className="text-xs text-[#858B9B]">
              {t('account.collectionsSubtitle')}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newListName.trim()) return;
              onCreateCollection(newListName.trim(), newListDesc.trim(), newListPublic);
              setNewListName('');
              setNewListDesc('');
            }}
            className="p-4 sm:p-5 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder={t('account.collectionName')}
                maxLength={80}
                required
                data-testid="create-collection-name"
                className="w-full px-3.5 py-2.5 text-xs bg-[#080A12] border border-[#272B3A] rounded-xl text-[#F8FAFC] placeholder-[#858B9B] focus:outline-none focus:border-[#8B5CF6]"
              />
              <input
                type="text"
                value={newListDesc}
                onChange={(e) => setNewListDesc(e.target.value)}
                placeholder={t('account.collectionDesc')}
                maxLength={240}
                className="w-full px-3.5 py-2.5 text-xs bg-[#080A12] border border-[#272B3A] rounded-xl text-[#F8FAFC] placeholder-[#858B9B] focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-xs text-[#A1A1AA] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newListPublic}
                  onChange={(e) => setNewListPublic(e.target.checked)}
                  className="rounded bg-[#080A12] border-[#272B3A] text-[#8B5CF6] focus:ring-0"
                />
                <span>{newListPublic ? t('account.collectionPublic') : t('account.collectionPrivate')}</span>
              </label>
              <button
                type="submit"
                data-testid="create-collection-submit"
                className="inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[38px] px-4 py-2 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('account.createCollection')}</span>
              </button>
            </div>
          </form>

          {customCollections.length > 0 ? (
            <div className="space-y-4">
              {customCollections.map((col) => (
                <div
                  key={col.id}
                  data-testid={`collection-card-${col.id}`}
                  className="p-5 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-display font-semibold text-[#F8FAFC]">
                          {col.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded-md bg-[#191D2B] border border-[#272B3A] text-[#A1A1AA]">
                          {col.isPublic ? (
                            <>
                              <Globe className="w-3 h-3 text-[#38BDF8]" />
                              <span>{t('account.collectionPublic')}</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3 h-3 text-[#858B9B]" />
                              <span>{t('account.collectionPrivate')}</span>
                            </>
                          )}
                        </span>
                      </div>
                      {col.description && (
                        <p className="text-xs text-[#A1A1AA] max-w-2xl">{col.description}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {col.isPublic && (
                        <button
                          type="button"
                          onClick={() => handleCopyCollectionLink(col.id)}
                          className="inline-flex items-center gap-1.5 min-h-[40px] sm:min-h-[34px] px-3 py-1.5 rounded-lg bg-[#191D2B] hover:bg-[#272B3A] text-xs font-medium text-[#38BDF8] border border-[#272B3A] transition-colors cursor-pointer"
                        >
                          {copiedCollectionId === col.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {copiedCollectionId === col.id
                              ? t('account.linkCopied')
                              : t('account.shareList')}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onToggleCollectionPublic(col.id)}
                        className="inline-flex items-center gap-1.5 min-h-[40px] sm:min-h-[34px] px-3 py-1.5 rounded-lg bg-[#080A12] hover:bg-[#191D2B] text-xs text-[#A1A1AA] hover:text-[#F8FAFC] border border-[#272B3A] transition-colors cursor-pointer"
                      >
                        {col.isPublic ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                        <span>{col.isPublic ? t('account.collectionPrivate') : t('account.collectionPublic')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCollection(col.id)}
                        aria-label={`Delete ${col.name}`}
                        className="inline-flex items-center justify-center min-w-[40px] min-h-[40px] sm:min-w-[34px] sm:min-h-[34px] p-1.5 rounded-lg bg-[#080A12] hover:bg-rose-600/20 text-[#858B9B] hover:text-rose-300 border border-[#272B3A] transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {col.items.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {col.items.map((entry) => (
                        <div
                          key={`${entry.mediaType}-${entry.mediaId}`}
                          className="group relative flex flex-col bg-[#080A12] border border-[#272B3A] rounded-xl overflow-hidden hover:border-[#8B5CF6]/50 transition-all"
                        >
                          <button
                            type="button"
                            onClick={() => onSelectMediaById(entry.mediaId, entry.mediaType)}
                            className="w-full text-left flex flex-col flex-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                          >
                            <div className="aspect-[2/3] w-full bg-[#191D2B] relative overflow-hidden">
                              <SavedPosterImage src={entry.posterPath} title={entry.title} mediaType={entry.mediaType} />
                            </div>
                            <div className="p-2.5 w-full">
                              <p className="text-[11px] font-semibold text-[#F8FAFC] truncate group-hover:text-[#38BDF8]">
                                {entry.title}
                              </p>
                              <div className="flex items-center gap-1 text-[10px] text-[#858B9B] mt-0.5">
                                <span>{formatReleaseYear(entry.releaseDate)}</span>
                                <span>·</span>
                                <span className="text-[#38BDF8] font-mono tabular-nums">
                                  {formatRating(entry.voteAverage)}
                                </span>
                              </div>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveFromCollection(col.id, entry.mediaId, entry.mediaType)}
                            aria-label={`Remove ${entry.title} from ${col.name}`}
                            className="absolute top-1.5 right-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg bg-[#080A12]/85 hover:bg-rose-600 text-[#A1A1AA] hover:text-white border border-[#272B3A] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#858B9B] italic">
                      {t('account.collectionsEmpty')} — use “{t('detail.saveToCollection')}” on any title to populate this list.
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center rounded-2xl border border-dashed border-[#272B3A] bg-[#111421]/50 space-y-3">
              <FolderHeart className="w-8 h-8 text-[#858B9B] mx-auto" />
              <p className="text-sm font-medium text-[#F8FAFC]">{t('account.collectionsEmpty')}</p>
              <p className="text-xs text-[#858B9B] max-w-sm mx-auto">
                {t('account.collectionsSubtitle')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* PREFERENCES & PROFILE SUBTAB */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSavePreferences} className="max-w-2xl space-y-6">
          {/* Streaming Availability Region */}
          <div className="p-6 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-3">
            <div>
              <h3 className="text-sm font-display font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#38BDF8] shrink-0" />
                <span>{t('account.watchRegionLabel')}</span>
              </h3>
              <p className="text-xs text-[#858B9B] mt-0.5">
                {t('account.watchRegionDesc')}
              </p>
            </div>
            <select
              aria-label={t('account.watchRegionLabel')}
              value={watchRegion}
              onChange={(e) => onWatchRegionChange(e.target.value)}
              data-testid="account-region-select"
              className="w-full sm:w-72 min-h-[44px] sm:min-h-[38px] px-3 py-2 rounded-xl bg-[#080A12] border border-[#272B3A] text-xs font-medium text-[#F8FAFC] focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
            >
              {SUPPORTED_PROVIDER_REGIONS.map((region) => (
                <option key={region.code} value={region.code} className="bg-[#111421] text-[#F8FAFC]">
                  {region.code} — {region.label}
                </option>
              ))}
            </select>
          </div>

          {/* Genre Preferences */}
          <div className="p-6 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-4">
            <div>
              <h3 className="text-sm font-display font-semibold text-[#F8FAFC]">
                Discovery & Recommendation Affinity
              </h3>
              <p className="text-xs text-[#858B9B] mt-0.5">
                Select your preferred genres to tune your personalized recommendations
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ALL_GENRES.map((genre) => {
                const selected = preferredGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`min-h-[42px] md:min-h-0 py-2 px-3 text-xs font-medium rounded-xl border text-center transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#8B5CF6]/20 text-[#38BDF8] border-[#8B5CF6]'
                        : 'bg-[#080A12] text-[#858B9B] border-[#272B3A] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {tGenre(genre)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="p-6 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-4">
            <div>
              <h3 className="text-sm font-display font-semibold text-[#F8FAFC]">
                Notification Controls
              </h3>
              <p className="text-xs text-[#858B9B] mt-0.5">
                Manage communications sent to {currentUser.email}
              </p>
            </div>

            <div className="space-y-3 text-xs text-[#F8FAFC]">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.newReleases}
                  onChange={(e) =>
                    setNotifications({ ...notifications, newReleases: e.target.checked })
                  }
                  className="rounded bg-[#080A12] border-[#272B3A] text-[#8B5CF6] focus:ring-0"
                />
                <span>Alert me when saved watchlist titles premiere or arrive on streaming</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.curatedWeekly}
                  onChange={(e) =>
                    setNotifications({ ...notifications, curatedWeekly: e.target.checked })
                  }
                  className="rounded bg-[#080A12] border-[#272B3A] text-[#8B5CF6] focus:ring-0"
                />
                <span>Receive ASTREON Weekly Curator Dispatches and festival coverage</span>
              </label>
            </div>
          </div>

          {/* Data Saving & Playback Preferences */}
          <div className="p-6 rounded-2xl bg-[#111421] border border-[#272B3A] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-display font-semibold text-[#F8FAFC] flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-[#38BDF8] shrink-0" />
                  <span>{t('account.playbackHeading')}</span>
                </h3>
                <p className="text-xs text-[#858B9B] mt-0.5">
                  {t('account.playbackSubheading')}
                </p>
              </div>
              <span
                data-testid="autoplay-status-badge"
                className={`inline-flex items-center self-start sm:self-auto px-2.5 py-1 rounded-md text-[11px] font-mono border shrink-0 whitespace-nowrap ${
                  autoplayTrailers
                    ? 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {autoplayTrailers ? t('account.autoplayStatusOn') : t('account.autoplayStatusOff')}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#080A12] border border-[#272B3A]">
              <div className="space-y-1 min-w-0">
                <label
                  htmlFor="autoplay-trailers-switch"
                  className="block text-xs font-semibold text-[#F8FAFC] cursor-pointer"
                >
                  {t('account.autoplayToggleLabel')}
                </label>
                <p className="text-[11px] text-[#858B9B] leading-relaxed">
                  {t('account.autoplayToggleDesc')}
                </p>
              </div>

              <button
                id="autoplay-trailers-switch"
                type="button"
                role="switch"
                aria-checked={autoplayTrailers}
                aria-label={t('account.autoplayToggleLabel')}
                onClick={handleToggleAutoplayTrailers}
                className="min-w-[48px] min-h-[44px] flex items-center justify-end shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded-xl"
              >
                <span
                  className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-colors ${
                    autoplayTrailers
                      ? 'bg-[#8B5CF6] border-[#8B5CF6]'
                      : 'bg-[#191D2B] border-[#272B3A]'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                      autoplayTrailers ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          {savedSuccess && (
            <p className="text-xs text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Your profile preferences have been successfully updated.</span>
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {t('account.savePreferences')}
            </button>

            <button
              type="button"
              onClick={() => {
                setDeleteError('');
                setShowDeleteConfirm(true);
              }}
              className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              Delete Account
            </button>
          </div>

          {/* Account Deletion Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-3">
              <p className="text-xs text-rose-300 font-medium">
                Are you sure you want to delete your ASTREON account?
              </p>
              <p className="text-[11px] text-[#A1A1AA]">
                This will permanently remove your profile, personal watchlist, and saved favourites in accordance with our Privacy Policy.
              </p>
              {deleteError && (
                <p className="text-xs text-rose-300 bg-rose-950/50 border border-rose-500/40 rounded-lg px-3 py-2">
                  {deleteError}
                </p>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={deletingAccount}
                  onClick={async () => {
                    setDeletingAccount(true);
                    setDeleteError('');
                    try {
                      await deleteUserAccountFromFirebase(currentUser.uid);
                    } catch (err: any) {
                      const code = err?.code || '';
                      setDeleteError(
                        code === 'auth/requires-recent-login'
                          ? 'For your security, please sign out and sign back in before deleting your account.'
                          : err?.message || 'Unable to delete account right now. Please try again.'
                      );
                      setDeletingAccount(false);
                      return;
                    }
                    localStorage.removeItem(getScopedStorageKey('astreon_watchlist', currentUser.uid));
                    localStorage.removeItem(getScopedStorageKey('astreon_favorites', currentUser.uid));
                    localStorage.removeItem(getScopedStorageKey('astreon_watch_history', currentUser.uid));
                    localStorage.removeItem(getScopedStorageKey('astreon_collections', currentUser.uid));
                    localStorage.removeItem(getScopedStorageKey('astreon_autoplay_trailers', currentUser.uid));
                    localStorage.removeItem('astreon_watchlist');
                    localStorage.removeItem('astreon_favorites');
                    localStorage.removeItem('astreon_collections');
                    localStorage.removeItem('astreon_user');
                    setDeletingAccount(false);
                    onSignOut();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-semibold cursor-pointer"
                >
                  {deletingAccount ? 'Deleting...' : 'Confirm Account Deletion'}
                </button>
                <button
                  type="button"
                  disabled={deletingAccount}
                  onClick={() => {
                    setDeleteError('');
                    setShowDeleteConfirm(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#191D2B] text-xs text-[#A1A1AA] hover:text-[#F8FAFC] cursor-pointer disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
