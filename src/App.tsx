import React, { useState, useEffect, useMemo } from 'react';
import {
  MediaItem,
  NewsArticle,
  UserProfile,
  WatchlistItem,
  FavoriteItem,
  UserReview
} from './types/entertainment';
import { SEED_MEDIA, SEED_NEWS, SEED_REVIEWS, INITIAL_FEATURED_ID } from './data/seedData';
import {
  getFeaturedMedia,
  getDiscoverMedia,
  getNewsArticles,
  getReviews
} from './services/api';
import {
  testFirestoreConnection,
  subscribeToAuthState,
  fetchUserWatchlist,
  addToUserWatchlist,
  removeFromUserWatchlist,
  fetchUserFavorites,
  addToUserFavorites,
  removeFromUserFavorites,
  saveUserProfile,
  getUserProfile,
  logoutUser
} from './services/firebase';
import { calculateRecommendationScore } from './utils/entertainment';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HeroBanner } from './components/HeroBanner';
import { MediaRail } from './components/MediaRail';
import { TitleDetailModal } from './components/TitleDetailModal';
import { TrailerModal } from './components/TrailerModal';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/AuthModal';
import { AccountView } from './components/AccountView';
import { EditorialNewsView } from './components/EditorialNewsView';
import { AdminConsole } from './components/AdminConsole';
import { LegalModal, LegalTab } from './components/LegalModal';
import { CatalogBrowser } from './components/CatalogBrowser';
import { ShareMobileModal } from './components/ShareMobileModal';
import { Sparkles, Film, Tv, Play, Newspaper, Check, Info } from 'lucide-react';

export default function App() {
  // Navigation & View state
  const [currentView, setCurrentView] = useState<string>('discover');
  const [accountSubTab, setAccountSubTab] = useState<'watchlist' | 'favorites' | 'profile'>('watchlist');

  // Media & Editorial Data state
  const [mediaList, setMediaList] = useState<MediaItem[]>(SEED_MEDIA);
  const [featuredMedia, setFeaturedMedia] = useState<MediaItem>(SEED_MEDIA[0]);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>(SEED_NEWS);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>(SEED_REVIEWS);

  // Active Modals state
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [trailerMedia, setTrailerMedia] = useState<MediaItem | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('about');

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // User Authentication State (Persisted)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('astreon_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Watchlist State (Persisted)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem('astreon_watchlist');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'wl-1',
              mediaId: 693134,
              mediaType: 'movie',
              title: 'Dune: Part Two',
              posterPath: 'https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
              voteAverage: 8.2,
              releaseDate: '2024-03-01',
              genres: ['Science Fiction', 'Adventure'],
              addedAt: new Date().toISOString()
            },
            {
              id: 'wl-2',
              mediaId: 115959,
              mediaType: 'tv',
              title: 'Severance',
              posterPath: 'https://image.tmdb.org/t/p/w780/jtlV9Oea0Z6d3gR00G19Kz5G7P7.jpg',
              voteAverage: 8.4,
              releaseDate: '2022-02-18',
              genres: ['Drama', 'Mystery'],
              addedAt: new Date().toISOString()
            }
          ];
    } catch {
      return [];
    }
  });

  // Favourites State (Persisted)
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const saved = localStorage.getItem('astreon_favorites');
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'fav-1',
              mediaId: 872585,
              mediaType: 'movie',
              title: 'Oppenheimer',
              posterPath: 'https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
              voteAverage: 8.1,
              releaseDate: '2023-07-21',
              genres: ['Drama', 'History'],
              addedAt: new Date().toISOString()
            }
          ];
    } catch {
      return [];
    }
  });

  // Load backend data and verify Firestore on startup
  useEffect(() => {
    testFirestoreConnection();

    getFeaturedMedia().then((feat) => {
      if (feat) setFeaturedMedia(feat);
    });

    getDiscoverMedia().then((res) => {
      if (res.results && res.results.length > 0) {
        setMediaList(res.results);
      }
    });

    getNewsArticles().then((articles) => {
      if (articles && articles.length > 0) {
        setNewsArticles(articles);
      }
    });

    getReviews().then((revs) => {
      if (revs && revs.length > 0) {
        setReviews(revs);
      }
    });

    // Subscribe to Firebase Auth state
    const unsubscribe = subscribeToAuthState(async (fbUser) => {
      if (fbUser) {
        const profile = await getUserProfile(fbUser.uid);
        if (profile) {
          setCurrentUser(profile);
        }
        // Sync remote watchlist from Firestore
        fetchUserWatchlist(fbUser.uid).then((remoteWl) => {
          if (remoteWl && remoteWl.length > 0) {
            setWatchlist(remoteWl);
          }
        });
        // Sync remote favorites from Firestore
        fetchUserFavorites(fbUser.uid).then((remoteFav) => {
          if (remoteFav && remoteFav.length > 0) {
            setFavorites(remoteFav);
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync Watchlist and Favorites to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('astreon_watchlist', JSON.stringify(watchlist));
    } catch {}
  }, [watchlist]);

  useEffect(() => {
    try {
      localStorage.setItem('astreon_favorites', JSON.stringify(favorites));
    } catch {}
  }, [favorites]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('astreon_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('astreon_user');
      }
    } catch {}
  }, [currentUser]);

  // Derived Watchlist and Favorites ID arrays for fast checks
  const watchlistIds = useMemo(() => watchlist.map((w) => w.mediaId), [watchlist]);
  const favoriteIds = useMemo(() => favorites.map((f) => f.mediaId), [favorites]);

  // Watchlist genre occurrence counts for recommendations
  const watchlistGenreCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of watchlist) {
      for (const g of item.genres || []) {
        counts[g] = (counts[g] || 0) + 1;
      }
    }
    return counts;
  }, [watchlist]);

  // Dynamic recommendations based on user genre affinity and watchlist
  const recommendedItems = useMemo(() => {
    const userPreferred = currentUser?.preferredGenres || ['Science Fiction', 'Drama'];
    return [...mediaList].sort((a, b) => {
      const scoreB = calculateRecommendationScore(b, userPreferred, watchlistGenreCounts);
      const scoreA = calculateRecommendationScore(a, userPreferred, watchlistGenreCounts);
      return scoreB - scoreA;
    });
  }, [mediaList, currentUser, watchlistGenreCounts]);

  // Collections by category
  const trendingMovies = useMemo(() => mediaList.filter((m) => m.mediaType === 'movie'), [mediaList]);
  const tvSeries = useMemo(() => mediaList.filter((m) => m.mediaType === 'tv'), [mediaList]);
  const topRated = useMemo(
    () => [...mediaList].sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0)),
    [mediaList]
  );
  const titlesWithTrailers = useMemo(
    () => mediaList.filter((m) => m.videos && m.videos.some((v) => v.site === 'YouTube')),
    [mediaList]
  );

  // Toggle Watchlist handler with Firestore persistence
  const handleToggleWatchlist = (item: MediaItem) => {
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }
    if (watchlistIds.includes(item.id)) {
      setWatchlist((prev) => prev.filter((w) => w.mediaId !== item.id));
      if (currentUser.uid) {
        removeFromUserWatchlist(currentUser.uid, item.id);
      }
      showToast(`Removed "${item.title}" from your Watchlist`);
    } else {
      const newEntry: WatchlistItem = {
        id: `wl-${Date.now()}`,
        mediaId: item.id,
        mediaType: item.mediaType,
        title: item.title,
        posterPath: item.posterPath,
        backdropPath: item.backdropPath,
        voteAverage: item.voteAverage,
        releaseDate: item.releaseDate || item.firstAirDate,
        genres: item.genres,
        addedAt: new Date().toISOString()
      };
      setWatchlist((prev) => [newEntry, ...prev]);
      if (currentUser.uid) {
        addToUserWatchlist(currentUser.uid, newEntry);
      }
      showToast(`Added "${item.title}" to your Watchlist`);
    }
  };

  // Toggle Favourites handler with Firestore persistence
  const handleToggleFavorite = (item: MediaItem) => {
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }
    if (favoriteIds.includes(item.id)) {
      setFavorites((prev) => prev.filter((f) => f.mediaId !== item.id));
      if (currentUser.uid) {
        removeFromUserFavorites(currentUser.uid, item.id);
      }
      showToast(`Removed "${item.title}" from Favourites`);
    } else {
      const newEntry: FavoriteItem = {
        id: `fav-${Date.now()}`,
        mediaId: item.id,
        mediaType: item.mediaType,
        title: item.title,
        posterPath: item.posterPath,
        backdropPath: item.backdropPath,
        voteAverage: item.voteAverage,
        releaseDate: item.releaseDate || item.firstAirDate,
        genres: item.genres,
        addedAt: new Date().toISOString()
      };
      setFavorites((prev) => [newEntry, ...prev]);
      if (currentUser.uid) {
        addToUserFavorites(currentUser.uid, newEntry);
      }
      showToast(`Added "${item.title}" to Favourites`);
    }
  };

  const handleNavigate = (view: string) => {
    if (view === 'watchlist') {
      setCurrentView('account');
      setAccountSubTab('watchlist');
    } else if (view === 'favorites') {
      setCurrentView('account');
      setAccountSubTab('favorites');
    } else {
      setCurrentView(view);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLegal = (tab: LegalTab) => {
    setLegalTab(tab);
    setLegalOpen(true);
  };

  const handleSelectMediaById = (id: number, type: 'movie' | 'tv') => {
    const match = mediaList.find((m) => m.id === id);
    if (match) {
      setSelectedMedia(match);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080A12] text-[#F8FAFC]">
      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenShare={() => setShareOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setAuthOpen(true)}
        onSignOut={() => {
          logoutUser();
          setCurrentUser(null);
          showToast('Signed out of ASTREON account');
        }}
        watchlistCount={watchlist.length}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {/* VIEW 1: DISCOVER / HOMEPAGE */}
        {currentView === 'discover' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Hero Banner */}
            <HeroBanner
              item={featuredMedia}
              onSelect={(m) => setSelectedMedia(m)}
              onWatchTrailer={(m) => setTrailerMedia(m)}
              isWatchlisted={watchlistIds.includes(featuredMedia.id)}
              onToggleWatchlist={handleToggleWatchlist}
            />

            {/* Content Rails */}
            <div className="space-y-4">
              {/* Recommended For You (Personalized) */}
              <MediaRail
                title="Curated Recommendations"
                subtitle={
                  currentUser
                    ? `Tuned to your affinity for ${currentUser.preferredGenres?.join(', ')}`
                    : 'Algorithmic curation based on critical acclaim and narrative scope'
                }
                items={recommendedItems}
                onSelect={(m) => setSelectedMedia(m)}
                onWatchTrailer={(m) => setTrailerMedia(m)}
                watchlistIds={watchlistIds}
                favoriteIds={favoriteIds}
                onToggleWatchlist={handleToggleWatchlist}
                onToggleFavorite={handleToggleFavorite}
              />

              {/* Trending Cinema Rail */}
              <MediaRail
                title="Trending Cinema"
                subtitle="High-impact feature films capturing critical discussion"
                items={trendingMovies}
                onSelect={(m) => setSelectedMedia(m)}
                onWatchTrailer={(m) => setTrailerMedia(m)}
                watchlistIds={watchlistIds}
                favoriteIds={favoriteIds}
                onToggleWatchlist={handleToggleWatchlist}
                onToggleFavorite={handleToggleFavorite}
                viewAllLink={() => handleNavigate('movies')}
              />

              {/* Prestige Television Rail */}
              <MediaRail
                title="Prestige Television"
                subtitle="Authored serialized storytelling and returning prestige series"
                items={tvSeries}
                onSelect={(m) => setSelectedMedia(m)}
                onWatchTrailer={(m) => setTrailerMedia(m)}
                watchlistIds={watchlistIds}
                favoriteIds={favoriteIds}
                onToggleWatchlist={handleToggleWatchlist}
                onToggleFavorite={handleToggleFavorite}
                viewAllLink={() => handleNavigate('tv')}
              />

              {/* Top Rated & Acclaimed Rail */}
              <MediaRail
                title="Highest Critical Consensus"
                subtitle="Consistently celebrated productions rated 8.0+ on TMDB"
                items={topRated}
                onSelect={(m) => setSelectedMedia(m)}
                onWatchTrailer={(m) => setTrailerMedia(m)}
                watchlistIds={watchlistIds}
                favoriteIds={favoriteIds}
                onToggleWatchlist={handleToggleWatchlist}
                onToggleFavorite={handleToggleFavorite}
              />

              {/* Latest Official Trailers Rail */}
              <section className="my-10" aria-label="Official Promotional Trailers">
                <div className="flex items-end justify-between mb-4 px-1">
                  <div>
                    <h2 className="text-xl md:text-2xl font-display font-semibold text-[#F8FAFC] tracking-tight">
                      Official Promotional Trailers
                    </h2>
                    <p className="text-xs text-[#858B9B] mt-0.5">
                      Verified 4K studio clips streamed directly from authorized studio distributors
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {titlesWithTrailers.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setTrailerMedia(item)}
                      className="group relative rounded-xl bg-[#111421] border border-[#272B3A] overflow-hidden hover:border-[#8B5CF6]/50 cursor-pointer transition-all"
                    >
                      <div className="aspect-video relative overflow-hidden bg-[#191D2B]">
                        <img
                          src={item.backdropPath || item.posterPath}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-[#F8FAFC]/90 text-[#080A12] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#38BDF8] truncate">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-[#858B9B] mt-0.5">
                          {item.videos?.[0]?.name || 'Official Studio Trailer'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Editorial Dispatches Preview */}
              <section className="my-12 p-6 sm:p-8 rounded-2xl bg-[#111421] border border-[#272B3A]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-[#8B5CF6]">
                      ASTREON Journal
                    </span>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-[#F8FAFC] tracking-tight mt-1">
                      Critical Editorial & Festival Dispatches
                    </h2>
                  </div>
                  <button
                    onClick={() => handleNavigate('news')}
                    className="text-xs font-medium text-[#38BDF8] hover:text-cyan-300 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    Read All Articles →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {newsArticles.slice(0, 3).map((art) => (
                    <div
                      key={art.id}
                      onClick={() => {
                        setSelectedArticle(art);
                        setCurrentView('news');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="group flex flex-col space-y-2 cursor-pointer"
                    >
                      <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#191D2B] border border-[#272B3A]">
                        <img
                          src={art.image}
                          alt={art.imageAlt}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <span className="text-[11px] font-mono text-[#38BDF8] uppercase">
                        {art.category} · {art.readTime}
                      </span>
                      <h3 className="text-sm font-semibold text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors line-clamp-2">
                        {art.title}
                      </h3>
                      <p className="text-xs text-[#858B9B] line-clamp-2">{art.excerpt}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* VIEW 2: MOVIES DISCOVERY */}
        {currentView === 'movies' && (
          <CatalogBrowser
            mediaType="movie"
            items={trendingMovies}
            onSelect={(m) => setSelectedMedia(m)}
            onWatchTrailer={(m) => setTrailerMedia(m)}
            watchlistIds={watchlistIds}
            favoriteIds={favoriteIds}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleFavorite={handleToggleFavorite}
            title="Cinema Exploration Catalog"
            subtitle="Explore groundbreaking feature films, theatrical masterworks, and international retrospectives"
          />
        )}

        {/* VIEW 3: TV SHOWS DISCOVERY */}
        {currentView === 'tv' && (
          <CatalogBrowser
            mediaType="tv"
            items={tvSeries}
            onSelect={(m) => setSelectedMedia(m)}
            onWatchTrailer={(m) => setTrailerMedia(m)}
            watchlistIds={watchlistIds}
            favoriteIds={favoriteIds}
            onToggleWatchlist={handleToggleWatchlist}
            onToggleFavorite={handleToggleFavorite}
            title="Prestige Television Series"
            subtitle="Serialized drama, speculative fiction, and authored episodic series"
          />
        )}

        {/* VIEW 4: EDITORIAL NEWS */}
        {currentView === 'news' && (
          <EditorialNewsView
            articles={newsArticles}
            selectedArticle={selectedArticle}
            onSelectArticle={setSelectedArticle}
          />
        )}

        {/* VIEW 5: USER ACCOUNT / WATCHLIST */}
        {currentView === 'account' && (
          currentUser ? (
            <AccountView
              currentUser={currentUser}
              activeSubTab={accountSubTab}
              onSubTabChange={setAccountSubTab}
              watchlist={watchlist}
              favorites={favorites}
              onRemoveWatchlist={(id) => {
                setWatchlist((prev) => prev.filter((w) => w.mediaId !== id));
                showToast('Removed title from Watchlist');
              }}
              onRemoveFavorite={(id) => {
                setFavorites((prev) => prev.filter((f) => f.mediaId !== id));
                showToast('Removed title from Favourites');
              }}
              onSelectMediaById={handleSelectMediaById}
              onUpdatePreferences={(updated) => {
                setCurrentUser((prev) => {
                  if (!prev) return null;
                  const merged = { ...prev, ...updated };
                  if (merged.uid) saveUserProfile(merged);
                  return merged;
                });
                showToast('Preferences updated in Firestore');
              }}
              onSignOut={() => {
                logoutUser();
                setCurrentUser(null);
                setCurrentView('discover');
                showToast('Signed out successfully');
              }}
            />
          ) : (
            <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
              <h2 className="text-xl font-display font-bold text-[#F8FAFC]">
                Sign In to Access Your Collections
              </h2>
              <p className="text-xs text-[#858B9B]">
                Organize your personalized watchlist, store favourite releases, and sync preferences across devices.
              </p>
              <button
                onClick={() => setAuthOpen(true)}
                className="px-6 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Sign In or Register
              </button>
            </div>
          )
        )}

        {/* VIEW 6: ADMIN CONSOLE */}
        {currentView === 'admin' && (
          currentUser?.isAdmin ? (
            <AdminConsole
              mediaList={mediaList}
              currentFeaturedId={featuredMedia.id}
              onFeaturedUpdated={(newId) => {
                const found = mediaList.find((m) => m.id === newId);
                if (found) {
                  setFeaturedMedia(found);
                  showToast(`Hero spotlight updated to "${found.title}"`);
                }
              }}
              onArticlePublished={(art) => {
                setNewsArticles((prev) => [art, ...prev]);
                showToast(`Published article "${art.title}"`);
              }}
              reviews={reviews}
              onReviewModerated={(id, status) => {
                setReviews((prev) =>
                  prev.map((r) => (r.id === id ? { ...r, status } : r))
                );
                showToast(`Review status updated to ${status}`);
              }}
            />
          ) : (
            <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
              <h2 className="text-xl font-display font-bold text-rose-400">
                Administrative Authorization Required
              </h2>
              <p className="text-xs text-[#858B9B]">
                This console is protected for authorized platform curators and administrators.
              </p>
              <button
                onClick={() => setAuthOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#191D2B] text-[#F8FAFC] text-xs font-medium border border-[#272B3A] cursor-pointer"
              >
                Sign In with Admin Account
              </button>
            </div>
          )
        )}
      </main>

      {/* Shared Footer */}
      <Footer
        onOpenLegal={handleOpenLegal}
        onNavigate={handleNavigate}
        onOpenShare={() => setShareOpen(true)}
      />

      {/* Global Interactive Modals */}
      <TitleDetailModal
        item={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        onWatchTrailer={(m) => setTrailerMedia(m)}
        isWatchlisted={selectedMedia ? watchlistIds.includes(selectedMedia.id) : false}
        isFavorite={selectedMedia ? favoriteIds.includes(selectedMedia.id) : false}
        onToggleWatchlist={handleToggleWatchlist}
        onToggleFavorite={handleToggleFavorite}
        currentUser={currentUser}
        onOpenAuth={() => setAuthOpen(true)}
      />

      <TrailerModal
        item={trailerMedia}
        onClose={() => setTrailerMedia(null)}
      />

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        mediaItems={mediaList}
        newsArticles={newsArticles}
        currentUserId={currentUser?.uid}
        onSelectMedia={(m) => setSelectedMedia(m)}
        onSelectArticle={(art) => {
          setSelectedArticle(art);
          setCurrentView('news');
        }}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome back, ${user.displayName}!`);
        }}
      />

      <LegalModal
        isOpen={legalOpen}
        activeTab={legalTab}
        onTabChange={setLegalTab}
        onClose={() => setLegalOpen(false)}
      />

      <ShareMobileModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      {/* Accessible Toast Notification Bar */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#191D2B] text-[#F8FAFC] border border-[#8B5CF6]/50 shadow-2xl animate-in slide-in-from-bottom-3 duration-200 text-xs font-medium"
        >
          <Check className="w-4 h-4 text-[#38BDF8] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
