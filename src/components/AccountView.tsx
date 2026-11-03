import React, { useState } from 'react';
import { UserProfile, WatchlistItem, FavoriteItem, MediaItem } from '../types/entertainment';
import { Bookmark, Heart, Settings, Trash2, Bell, Check, Film, Tv, Star } from 'lucide-react';
import { formatRating, formatReleaseYear } from '../utils/entertainment';
import { deleteUserAccountFromFirebase } from '../services/firebase';

interface AccountViewProps {
  currentUser: UserProfile;
  activeSubTab: 'watchlist' | 'favorites' | 'profile';
  onSubTabChange: (tab: 'watchlist' | 'favorites' | 'profile') => void;
  watchlist: WatchlistItem[];
  favorites: FavoriteItem[];
  onRemoveWatchlist: (mediaId: number) => void;
  onRemoveFavorite: (mediaId: number) => void;
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

export const AccountView: React.FC<AccountViewProps> = ({
  currentUser,
  activeSubTab,
  onSubTabChange,
  watchlist,
  favorites,
  onRemoveWatchlist,
  onRemoveFavorite,
  onSelectMediaById,
  onUpdatePreferences,
  onSignOut
}) => {
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
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleGenre = (genre: string) => {
    const updated = preferredGenres.includes(genre)
      ? preferredGenres.filter((g) => g !== genre)
      : [...preferredGenres, genre];
    setPreferredGenres(updated);
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePreferences({
      preferredGenres,
      notificationPreferences: notifications
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
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
              Member since {new Date(currentUser.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#080A12] border border-[#272B3A] rounded-xl self-start sm:self-auto text-xs">
          <button
            onClick={() => onSubTabChange('watchlist')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeSubTab === 'watchlist'
                ? 'bg-[#8B5CF6] text-white shadow-sm'
                : 'text-[#A1A1AA] hover:text-[#F8FAFC]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Watchlist ({watchlist.length})</span>
          </button>

          <button
            onClick={() => onSubTabChange('favorites')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeSubTab === 'favorites'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-[#A1A1AA] hover:text-[#F8FAFC]'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Favourites ({favorites.length})</span>
          </button>

          <button
            onClick={() => onSubTabChange('profile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeSubTab === 'profile'
                ? 'bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A]'
                : 'text-[#A1A1AA] hover:text-[#F8FAFC]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </button>
        </div>
      </div>

      {/* WATCHLIST SUBTAB */}
      {activeSubTab === 'watchlist' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-semibold text-[#F8FAFC]">
                Your Watchlist
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
                  key={item.id}
                  className="group relative flex flex-col bg-[#111421] border border-[#272B3A] rounded-xl overflow-hidden hover:border-[#8B5CF6]/50 transition-all"
                >
                  <div
                    onClick={() => onSelectMediaById(item.mediaId, item.mediaType)}
                    className="aspect-[2/3] w-full bg-[#191D2B] relative overflow-hidden cursor-pointer"
                  >
                    <img
                      src={item.posterPath}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveWatchlist(item.mediaId);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-[#080A12]/80 hover:bg-rose-600 text-[#A1A1AA] hover:text-white border border-[#272B3A] transition-colors cursor-pointer"
                      title="Remove from Watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div
                    onClick={() => onSelectMediaById(item.mediaId, item.mediaType)}
                    className="p-3 cursor-pointer"
                  >
                    <h3 className="text-xs font-semibold text-[#F8FAFC] truncate group-hover:text-[#38BDF8]">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#858B9B] mt-1">
                      <span>{formatReleaseYear(item.releaseDate)}</span>
                      <span>·</span>
                      <span className="text-[#38BDF8] font-mono">{formatRating(item.voteAverage)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center rounded-2xl border border-dashed border-[#272B3A] bg-[#111421]/50 space-y-3">
              <Bookmark className="w-8 h-8 text-[#858B9B] mx-auto" />
              <p className="text-sm font-medium text-[#F8FAFC]">Your watchlist is empty</p>
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
                Personal Favourites
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
                  key={item.id}
                  className="group relative flex flex-col bg-[#111421] border border-[#272B3A] rounded-xl overflow-hidden hover:border-rose-500/50 transition-all"
                >
                  <div
                    onClick={() => onSelectMediaById(item.mediaId, item.mediaType)}
                    className="aspect-[2/3] w-full bg-[#191D2B] relative overflow-hidden cursor-pointer"
                  >
                    <img
                      src={item.posterPath}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFavorite(item.mediaId);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-[#080A12]/80 hover:bg-rose-600 text-[#A1A1AA] hover:text-white border border-[#272B3A] transition-colors cursor-pointer"
                      title="Remove from Favourites"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div
                    onClick={() => onSelectMediaById(item.mediaId, item.mediaType)}
                    className="p-3 cursor-pointer"
                  >
                    <h3 className="text-xs font-semibold text-[#F8FAFC] truncate group-hover:text-rose-400">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#858B9B] mt-1">
                      <span>{formatReleaseYear(item.releaseDate)}</span>
                      <span>·</span>
                      <span className="text-[#38BDF8] font-mono">{formatRating(item.voteAverage)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center rounded-2xl border border-dashed border-[#272B3A] bg-[#111421]/50 space-y-3">
              <Heart className="w-8 h-8 text-[#858B9B] mx-auto" />
              <p className="text-sm font-medium text-[#F8FAFC]">No favourites added yet</p>
              <p className="text-xs text-[#858B9B] max-w-sm mx-auto">
                Mark your standout cinematic experiences with the heart icon to highlight them here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* PREFERENCES & PROFILE SUBTAB */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSavePreferences} className="max-w-2xl space-y-6">
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
                    className={`py-2 px-3 text-xs font-medium rounded-xl border text-center transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#8B5CF6]/20 text-[#38BDF8] border-[#8B5CF6]'
                        : 'bg-[#080A12] text-[#858B9B] border-[#272B3A] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {genre}
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
              Save Preferences
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await deleteUserAccountFromFirebase(currentUser.uid);
                    } catch (err) {
                      console.warn('Firebase user deletion note:', err);
                    }
                    localStorage.removeItem('astreon_watchlist');
                    localStorage.removeItem('astreon_favorites');
                    localStorage.removeItem('astreon_user');
                    onSignOut();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Confirm Account Deletion
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#191D2B] text-xs text-[#A1A1AA] hover:text-[#F8FAFC] cursor-pointer"
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
