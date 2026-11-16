import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from 'react';
import {
  MediaItem,
  NewsArticle,
  UserProfile,
  WatchlistItem,
  FavoriteItem,
  WatchHistoryItem,
  CustomCollection,
  UserReview
} from './types/entertainment';
import { SEED_MEDIA, SEED_NEWS, SEED_REVIEWS } from './data/seedData';
import {
  getFeaturedMedia,
  getDiscoverMedia,
  fetchTrendingMedia,
  getUpcomingMedia,
  getMediaDetails,
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
  fetchUserWatchHistory,
  recordUserWatchHistory,
  removeUserWatchHistoryItem,
  clearUserWatchHistory,
  fetchUserCustomCollections,
  fetchPublicCustomCollection,
  saveCustomCollection,
  deleteCustomCollection,
  saveUserProfile,
  getUserProfile,
  logoutUser
} from './services/firebase';
import {
  getPersonalizedRecommendations,
  getScopedStorageKey,
  resolveAutoplayTrailersPreference,
  getUpcomingMediaItems,
  watchHistoryToMediaItems,
  getMediaKey,
  hasMediaEntry
} from './utils/entertainment';
import {
  createWatchHistoryEntry,
  recordWatchHistoryEntry,
  removeWatchHistoryEntry,
  mergeWatchHistoryEntries
} from './utils/watchHistory';
import {
  createCustomCollection,
  toggleItemInCollection,
  MAX_CUSTOM_COLLECTIONS
} from './utils/collections';
import { detectDefaultRegion, normalizeProviderRegion } from './utils/providers';
import { aggregateStarRatingsByMedia } from './utils/ratings';
import { updateDocumentMeta } from './utils/meta';
import { trackTitleInteraction, trackUserSession } from './utils/analytics';
import { parseRoute, buildRouteUrl, AppView, AccountSubTab, CatalogFilterParams } from './utils/routing';
import { useI18n } from './contexts/I18nContext';
import {
  getSeedLocalizedArticleSync,
  getSeedLocalizedMediaSync,
  localizeMediaItem,
  localizeNewsArticle
} from './services/translator';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HeroBanner } from './components/HeroBanner';
import { MediaRail } from './components/MediaRail';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/AuthModal';
import { OfflineBanner } from './components/OfflineBanner';
import {
  DiscoverSkeleton,
  CatalogGridSkeleton,
  EditorialSkeleton,
  AccountSkeleton
} from './components/Skeletons';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import type { LegalTab } from './components/LegalModal';
import type { PersonSelection } from './components/PersonProfileModal';
import { Play, Check, Film, Newspaper } from 'lucide-react';

// Lazy-loaded routes and secondary modals for faster initial bundle load
const CatalogBrowser = lazy(() =>
  import('./components/CatalogBrowser').then((m) => ({ default: m.CatalogBrowser }))
);
const EditorialNewsView = lazy(() =>
  import('./components/EditorialNewsView').then((m) => ({ default: m.EditorialNewsView }))
);
const AccountView = lazy(() =>
  import('./components/AccountView').then((m) => ({ default: m.AccountView }))
);
const AdminConsole = lazy(() =>
  import('./components/AdminConsole').then((m) => ({ default: m.AdminConsole }))
);
const SharedCollectionView = lazy(() =>
  import('./components/SharedCollectionView').then((m) => ({ default: m.SharedCollectionView }))
);
const TitleDetailModal = lazy(() =>
  import('./components/TitleDetailModal').then((m) => ({ default: m.TitleDetailModal }))
);
const PersonProfileModal = lazy(() =>
  import('./components/PersonProfileModal').then((m) => ({ default: m.PersonProfileModal }))
);
const TrailerModal = lazy(() =>
  import('./components/TrailerModal').then((m) => ({ default: m.TrailerModal }))
);
const LegalModal = lazy(() =>
  import('./components/LegalModal').then((m) => ({ default: m.LegalModal }))
);
const ShareMobileModal = lazy(() =>
  import('./components/ShareMobileModal').then((m) => ({ default: m.ShareMobileModal }))
);
const KeyboardShortcutsModal = lazy(() =>
  import('./components/KeyboardShortcutsModal').then((m) => ({ default: m.KeyboardShortcutsModal }))
);

function loadScopedJson<T>(baseKey: string, uid: string | undefined, fallback: T): T {
  try {
    const scopedKey = getScopedStorageKey(baseKey, uid);
    const saved = localStorage.getItem(scopedKey);
    if (saved) return JSON.parse(saved);
    return fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  // Internationalization & Browser-Based Localization Context
  const { locale, tmdbLanguage, t, tGenre, setIsTranslating } = useI18n();

  // Online/Offline Network Status tracking
  const { isOnline, wasOffline, checkConnection } = useOnlineStatus();

  // Initial URL route parsing
  const initialRoute = useMemo(
    () =>
      typeof window !== 'undefined'
        ? parseRoute(window.location.pathname, window.location.search)
        : { view: 'discover' as AppView },
    []
  );

  // Navigation & View state
  const [currentView, setCurrentView] = useState<AppView>(initialRoute.view);
  const [accountSubTab, setAccountSubTab] = useState<AccountSubTab>(
    initialRoute.accountTab || 'watchlist'
  );
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilterParams>({
    genre: initialRoute.genre,
    year: initialRoute.year,
    minRating: initialRoute.minRating,
    sort: initialRoute.sort,
    q: initialRoute.q
  });
  const [catalogPagination, setCatalogPagination] = useState<{
    moviePage: number;
    movieTotalPages: number;
    tvPage: number;
    tvTotalPages: number;
    loadingMore: boolean;
  }>({
    moviePage: 1,
    movieTotalPages: 5,
    tvPage: 1,
    tvTotalPages: 5,
    loadingMore: false
  });

  // Media & Editorial Data state
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(true);
  const [isFilteringCatalog, setIsFilteringCatalog] = useState<boolean>(false);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(true);
  const [mediaList, setMediaList] = useState<MediaItem[]>(() =>
    SEED_MEDIA.map((m) => getSeedLocalizedMediaSync(m, locale))
  );
  const [featuredMedia, setFeaturedMedia] = useState<MediaItem>(() =>
    getSeedLocalizedMediaSync(SEED_MEDIA[0], locale)
  );
  const [baseNewsArticles, setBaseNewsArticles] = useState<NewsArticle[]>(SEED_NEWS);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>(() =>
    SEED_NEWS.map((a) => getSeedLocalizedArticleSync(a, locale))
  );
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [reviews, setReviews] = useState<UserReview[]>(SEED_REVIEWS);
  const [upcomingMedia, setUpcomingMedia] = useState<MediaItem[]>(() =>
    getUpcomingMediaItems(SEED_MEDIA).map((m) => getSeedLocalizedMediaSync(m, locale))
  );

  // Per-locale catalog cache so switching en <-> localized restores native titles cleanly
  const localeMediaCacheRef = useRef<Record<string, MediaItem[]>>({});
  const localeUpcomingCacheRef = useRef<Record<string, MediaItem[]>>({});
  const featuredIdRef = useRef<number>(SEED_MEDIA[0].id);

  // Active Modals state
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<PersonSelection | null>(null);
  const [trailerMedia, setTrailerMedia] = useState<MediaItem | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('about');

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const catalogSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterRequestIdRef = useRef<number>(0);
  const [failedHomeImages, setFailedHomeImages] = useState<Record<string, boolean>>({});

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
      if (catalogSearchTimerRef.current) {
        clearTimeout(catalogSearchTimerRef.current);
      }
    };
  }, []);

  // User Authentication State (Persisted)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('astreon_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Streaming Availability Region (auto-detected or user-selected)
  const [watchRegion, setWatchRegion] = useState<string>(() => {
    if (currentUser?.watchRegion) return normalizeProviderRegion(currentUser.watchRegion);
    try {
      const savedRegion = localStorage.getItem('astreon_watch_region');
      if (savedRegion) return normalizeProviderRegion(savedRegion);
    } catch {}
    return detectDefaultRegion();
  });

  // Watchlist State (User-scoped LocalStorage + Firestore sync)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() =>
    loadScopedJson<WatchlistItem[]>('astreon_watchlist', currentUser?.uid, [])
  );

  // Favourites State (User-scoped LocalStorage + Firestore sync)
  const [favorites, setFavorites] = useState<FavoriteItem[]>(() =>
    loadScopedJson<FavoriteItem[]>('astreon_favorites', currentUser?.uid, [])
  );

  // Watch History State (User-scoped LocalStorage + Firestore sync)
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>(() =>
    loadScopedJson<WatchHistoryItem[]>('astreon_watch_history', currentUser?.uid, [])
  );

  // Custom User Collections State (User-scoped LocalStorage + Firestore sync)
  const [customCollections, setCustomCollections] = useState<CustomCollection[]>(() =>
    loadScopedJson<CustomCollection[]>('astreon_collections', currentUser?.uid, [])
  );

  // Public Shared Collection Route state (/list?id=...)
  const [sharedCollectionId, setSharedCollectionId] = useState<string | null>(
    initialRoute.view === 'list' ? initialRoute.collectionId || null : null
  );
  const [sharedCollectionData, setSharedCollectionData] = useState<CustomCollection | null>(null);
  const [loadingSharedCollection, setLoadingSharedCollection] = useState<boolean>(false);

  const currentUserUidRef = useRef<string | undefined>(currentUser?.uid);
  currentUserUidRef.current = currentUser?.uid;
  const initialDeepLinkRecordedRef = useRef<boolean>(false);

  // Sync URL cleanly whenever navigation / modal deep-link changes
  const pushUrl = useCallback(
    (
      next: {
        view: AppView;
        accountTab?: AccountSubTab;
        collectionId?: string;
        titleId?: number;
        mediaType?: 'movie' | 'tv';
        articleSlug?: string;
      } & CatalogFilterParams,
      replace: boolean = false
    ) => {
      if (typeof window === 'undefined') return;
      const nextUrl = buildRouteUrl(next);
      const currentUrl = window.location.pathname + window.location.search;
      if (nextUrl !== currentUrl) {
        if (replace) {
          window.history.replaceState(null, '', nextUrl);
        } else {
          window.history.pushState(null, '', nextUrl);
        }
      }
    },
    []
  );

  // Dynamic localized OpenGraph & Document Metadata per active view, article, list, or selected title
  useEffect(() => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '/';
    if (selectedMedia) {
      updateDocumentMeta({
        title: `${selectedMedia.title} — ASTREON`,
        description: selectedMedia.overview?.slice(0, 160),
        image: selectedMedia.backdropPath || selectedMedia.posterPath,
        url: currentUrl
      });
    } else if (currentView === 'news' && selectedArticle) {
      updateDocumentMeta({
        title: `${selectedArticle.title} — ASTREON Journal`,
        description: selectedArticle.excerpt?.slice(0, 160),
        image: selectedArticle.image,
        url: currentUrl
      });
    } else if (currentView === 'list' && sharedCollectionData) {
      updateDocumentMeta({
        title: `${sharedCollectionData.name} — ASTREON`,
        description: sharedCollectionData.description || t('account.collectionsSubtitle'),
        image: sharedCollectionData.items[0]?.backdropPath || sharedCollectionData.items[0]?.posterPath,
        url: currentUrl
      });
    } else {
      const titles: Record<AppView, string> = {
        discover: t('title.discover'),
        movies: t('title.movies'),
        tv: t('title.tv'),
        news: t('title.news'),
        account: t('title.account'),
        admin: t('title.admin'),
        list: `${t('account.collections')} — ASTREON`
      };
      updateDocumentMeta({
        title: titles[currentView] || t('title.discover'),
        url: currentUrl
      });
    }
  }, [currentView, selectedMedia, selectedArticle, sharedCollectionData, t]);

  const recordViewedMedia = useCallback((item: MediaItem) => {
    if (!item || !Number.isFinite(item.id) || item.id <= 0) return;
    const viewedAt = new Date().toISOString();
    setWatchHistory((prev) => recordWatchHistoryEntry(prev, item, viewedAt));
    const uid = currentUserUidRef.current;
    if (uid) {
      recordUserWatchHistory(uid, createWatchHistoryEntry(item, viewedAt));
    }
  }, []);

  const openMediaDetail = useCallback(
    (item: MediaItem) => {
      trackTitleInteraction(item, 'detail_view');
      recordViewedMedia(item);
      setSelectedMedia(item);
      // Merge into mediaList if discovered via live TMDB search
      setMediaList((prev) =>
        prev.some((m) => m.id === item.id && m.mediaType === item.mediaType)
          ? prev
          : [...prev, item]
      );
      pushUrl({
        view: currentView,
        accountTab: currentView === 'account' ? accountSubTab : undefined,
        titleId: item.id,
        mediaType: item.mediaType,
        articleSlug: currentView === 'news' ? selectedArticle?.slug : undefined,
        ...(currentView === 'movies' || currentView === 'tv' ? catalogFilters : {})
      });
    },
    [currentView, accountSubTab, selectedArticle?.slug, catalogFilters, pushUrl, recordViewedMedia]
  );

  const openTrailerModal = useCallback((item: MediaItem) => {
    trackTitleInteraction(item, 'trailer_play');
    setTrailerMedia(item);
  }, []);

  const closeMediaDetail = useCallback(() => {
    setSelectedMedia(null);
    pushUrl({
      view: currentView,
      accountTab: currentView === 'account' ? accountSubTab : undefined,
      articleSlug: currentView === 'news' ? selectedArticle?.slug : undefined,
      ...(currentView === 'movies' || currentView === 'tv' ? catalogFilters : {})
    });
  }, [currentView, accountSubTab, selectedArticle?.slug, catalogFilters, pushUrl]);

  // Reload scoped watchlist/favorites/history/collections & track user session when signed-in account changes
  useEffect(() => {
    setWatchlist(loadScopedJson<WatchlistItem[]>('astreon_watchlist', currentUser?.uid, []));
    setFavorites(loadScopedJson<FavoriteItem[]>('astreon_favorites', currentUser?.uid, []));
    setWatchHistory(loadScopedJson<WatchHistoryItem[]>('astreon_watch_history', currentUser?.uid, []));
    setCustomCollections(loadScopedJson<CustomCollection[]>('astreon_collections', currentUser?.uid, []));
    if (currentUser?.uid) {
      trackUserSession(currentUser.uid);
    }
  }, [currentUser?.uid]);

  // Centralized global keyboard shortcut manager ('/' search toggle, '1-6' section nav, '?' help)
  useKeyboardShortcuts({
    searchOpen,
    shortcutsOpen,
    hasBlockingModalOpen: Boolean(
      authOpen || legalOpen || shareOpen || selectedMedia || selectedPerson || trailerMedia
    ),
    onToggleSearch: () => setSearchOpen((prev) => !prev),
    onToggleHelp: () => setShortcutsOpen((prev) => !prev),
    onNavigate: (view) => handleNavigate(view)
  });

  // Browser Back / Forward history listener
  useEffect(() => {
    const handlePopState = () => {
      const route = parseRoute(window.location.pathname, window.location.search);
      setCurrentView(route.view);
      if (route.view === 'account') {
        setAccountSubTab(route.accountTab || 'watchlist');
      }
      setSharedCollectionId(route.view === 'list' ? route.collectionId || null : null);
      setCatalogFilters({
        genre: route.genre,
        year: route.year,
        minRating: route.minRating,
        sort: route.sort,
        q: route.q
      });

      if (route.titleId) {
        const existing = mediaList.find(
          (m) => m.id === route.titleId && (!route.mediaType || m.mediaType === route.mediaType)
        );
        if (existing) {
          setSelectedMedia(existing);
        } else if (route.mediaType) {
          getMediaDetails(route.mediaType, route.titleId, tmdbLanguage, watchRegion).then(async (fetched) => {
            if (fetched) setSelectedMedia(await localizeMediaItem(fetched, locale));
          });
        }
      } else {
        setSelectedMedia(null);
      }

      if (route.view === 'news' && route.articleSlug) {
        const art = newsArticles.find((a) => a.slug === route.articleSlug) || null;
        setSelectedArticle(art);
      } else if (route.view !== 'news' || !route.articleSlug) {
        setSelectedArticle(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [mediaList, newsArticles, locale, tmdbLanguage, watchRegion]);

  // One-time startup: Firestore connection check, base news/reviews, deep-link media, and Firebase Auth subscription
  useEffect(() => {
    let active = true;
    testFirestoreConnection();

    Promise.all([
      getNewsArticles().catch(() => SEED_NEWS),
      getReviews().catch(() => SEED_REVIEWS)
    ]).then(([articlesRes, reviewsRes]) => {
      if (!active) return;

      if (articlesRes && articlesRes.length > 0) {
        setBaseNewsArticles(articlesRes);
        if (initialRoute.view === 'news' && initialRoute.articleSlug) {
          const matchedArt = articlesRes.find((a) => a.slug === initialRoute.articleSlug);
          if (matchedArt) {
            setSelectedArticle(getSeedLocalizedArticleSync(matchedArt, locale));
          }
        }
      }

      if (reviewsRes && reviewsRes.length > 0) {
        setReviews(reviewsRes);
      }
    }).finally(() => {
      if (active) {
        setIsLoadingNews(false);
      }
    });

    // Subscribe to Firebase Auth state
    const unsubscribe = subscribeToAuthState(async (fbUser) => {
      if (fbUser) {
        const isVerifiedAdmin =
          fbUser.email === 'danny2010qwert@gmail.com' && fbUser.emailVerified;
        const profile = await getUserProfile(fbUser.uid);
        if (profile) {
          let localAutoplay: string | null = null;
          try {
            localAutoplay = localStorage.getItem(
              getScopedStorageKey('astreon_autoplay_trailers', fbUser.uid)
            );
          } catch {}
          if (profile.watchRegion) {
            const normRegion = normalizeProviderRegion(profile.watchRegion);
            setWatchRegion(normRegion);
            try {
              localStorage.setItem('astreon_watch_region', normRegion);
            } catch {}
          }
          setCurrentUser({
            ...profile,
            playbackPreferences: profile.playbackPreferences ?? {
              autoplayTrailers: resolveAutoplayTrailersPreference(null, localAutoplay)
            },
            isAdmin: isVerifiedAdmin
          });
        } else {
          setCurrentUser({
            uid: fbUser.uid,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Cinema Admirer',
            email: fbUser.email || '',
            avatar: fbUser.photoURL || undefined,
            preferredGenres: ['Science Fiction', 'Drama'],
            notificationPreferences: {
              emailAlerts: true,
              newReleases: true,
              curatedWeekly: false
            },
            playbackPreferences: {
              autoplayTrailers: true
            },
            watchRegion,
            createdAt: new Date().toISOString(),
            isAdmin: isVerifiedAdmin
          });
        }
        // Sync remote watchlist from Firestore (only overwrite when fetch succeeds)
        fetchUserWatchlist(fbUser.uid).then((remoteWl) => {
          if (remoteWl !== null) {
            setWatchlist(remoteWl);
          }
        });
        // Sync remote favorites from Firestore (only overwrite when fetch succeeds)
        fetchUserFavorites(fbUser.uid).then((remoteFav) => {
          if (remoteFav !== null) {
            setFavorites(remoteFav);
          }
        });
        // Sync remote watch history from Firestore and merge with local uid-scoped cache
        fetchUserWatchHistory(fbUser.uid).then((remoteHistory) => {
          if (remoteHistory !== null) {
            setWatchHistory((prev) => {
              const localUid = loadScopedJson<WatchHistoryItem[]>(
                'astreon_watch_history',
                fbUser.uid,
                prev
              );
              return mergeWatchHistoryEntries(remoteHistory, localUid);
            });
          }
        });
        // Sync remote custom collections from Firestore
        fetchUserCustomCollections(fbUser.uid).then((remoteCols) => {
          if (remoteCols !== null) {
            setCustomCollections(remoteCols);
          }
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [initialRoute]);

  // Fetch public shared collection whenever viewing /list?id=...
  useEffect(() => {
    if (currentView !== 'list') return;
    if (!sharedCollectionId) {
      setSharedCollectionData(null);
      setLoadingSharedCollection(false);
      return;
    }
    const ownedLocal = customCollections.find((c) => c.id === sharedCollectionId);
    if (ownedLocal) {
      setSharedCollectionData(ownedLocal);
      setLoadingSharedCollection(false);
      return;
    }
    let active = true;
    setLoadingSharedCollection(true);
    fetchPublicCustomCollection(sharedCollectionId)
      .then((col) => {
        if (active) setSharedCollectionData(col);
      })
      .finally(() => {
        if (active) setLoadingSharedCollection(false);
      });
    return () => {
      active = false;
    };
  }, [currentView, sharedCollectionId, customCollections]);

  // Reactive TMDB catalog localization & hydration whenever locale changes
  useEffect(() => {
    let active = true;

    const cachedCatalog = localeMediaCacheRef.current[tmdbLanguage];
    const cachedUpcoming = localeUpcomingCacheRef.current[tmdbLanguage];
    if (cachedCatalog && cachedCatalog.length > 0) {
      setMediaList(cachedCatalog);
      if (cachedUpcoming) {
        setUpcomingMedia(cachedUpcoming);
      }
      const cachedFeat = cachedCatalog.find((m) => m.id === featuredIdRef.current) || cachedCatalog[0];
      if (cachedFeat) {
        setFeaturedMedia(cachedFeat);
      }
      setSelectedMedia((prev) => {
        if (!prev) return null;
        return (
          cachedCatalog.find((m) => m.id === prev.id && m.mediaType === prev.mediaType) ||
          getSeedLocalizedMediaSync(prev, locale)
        );
      });
      setIsLoadingCatalog(false);
    } else {
      // Display main skeletal loading state while live localized catalog items are fetched
      setIsLoadingCatalog(true);
      const syncSeed = SEED_MEDIA.map((m) => getSeedLocalizedMediaSync(m, locale));
      const syncSeedFeat = syncSeed.find((m) => m.id === featuredIdRef.current) || syncSeed[0];
      if (syncSeedFeat) {
        setFeaturedMedia(syncSeedFeat);
      }
      setUpcomingMedia(getUpcomingMediaItems(syncSeed));

      if (locale !== 'en') {
        setIsTranslating(true);
      }

      Promise.all([
        getDiscoverMedia({}, 1, tmdbLanguage).catch(() => ({
          results: SEED_MEDIA,
          total: SEED_MEDIA.length,
          page: 1,
          totalPages: 1
        })),
        fetchTrendingMedia('all', tmdbLanguage).catch(() => []),
        getUpcomingMedia(tmdbLanguage).catch(() => getUpcomingMediaItems(SEED_MEDIA))
      ])
        .then(async ([discoverRes, trendingRes, upcomingRes]) => {
          if (!active) return;

          const byId = new Map<string, MediaItem>();
          for (const m of [...(discoverRes.results || []), ...(trendingRes || [])]) {
            byId.set(`${m.mediaType}:${m.id}`, m);
          }
          const mergedCatalog = byId.size > 0 ? Array.from(byId.values()) : SEED_MEDIA;
          const [localizedCatalog, localizedUpcoming] = await Promise.all([
            Promise.all(mergedCatalog.map((m) => localizeMediaItem(m, locale))),
            Promise.all((upcomingRes || []).map((m) => localizeMediaItem(m, locale)))
          ]);

          if (!active) return;

          localeMediaCacheRef.current[tmdbLanguage] = localizedCatalog;
          localeUpcomingCacheRef.current[tmdbLanguage] = localizedUpcoming;
          setMediaList(localizedCatalog);
          setUpcomingMedia(localizedUpcoming);
          setCatalogPagination((prev) => ({
            ...prev,
            movieTotalPages: Math.max(discoverRes.totalPages || 1, 1),
            tvTotalPages: Math.max(discoverRes.totalPages || 1, 1)
          }));

          const feat = await getFeaturedMedia(localizedCatalog);
          if (active && feat) {
            featuredIdRef.current = feat.id;
            setFeaturedMedia(await localizeMediaItem(feat, locale));
          }

          if (initialRoute.titleId) {
            const localHit = localizedCatalog.find(
              (m) =>
                m.id === initialRoute.titleId &&
                (!initialRoute.mediaType || m.mediaType === initialRoute.mediaType)
            );
            if (localHit) {
              setSelectedMedia((prev) => prev || localHit);
              if (!initialDeepLinkRecordedRef.current) {
                initialDeepLinkRecordedRef.current = true;
                recordViewedMedia(localHit);
              }
            } else {
              const fetched = await getMediaDetails(
                initialRoute.mediaType || 'movie',
                initialRoute.titleId,
                tmdbLanguage,
                watchRegion
              );
              if (active && fetched) {
                const localizedDetail = await localizeMediaItem(fetched, locale);
                setSelectedMedia((prev) => prev || localizedDetail);
                if (!initialDeepLinkRecordedRef.current) {
                  initialDeepLinkRecordedRef.current = true;
                  recordViewedMedia(localizedDetail);
                }
              }
            }
          }
        })
        .finally(() => {
          if (active) {
            setIsLoadingCatalog(false);
            setIsTranslating(false);
          }
        });
    }

    return () => {
      active = false;
    };
  }, [locale, tmdbLanguage, initialRoute, setIsTranslating]);

  // Localize editorial dispatches cleanly from canonical baseNewsArticles
  useEffect(() => {
    let active = true;
    setNewsArticles(baseNewsArticles.map((a) => getSeedLocalizedArticleSync(a, locale)));
    Promise.all(baseNewsArticles.map((a) => localizeNewsArticle(a, locale))).then((localizedArts) => {
      if (!active) return;
      setNewsArticles(localizedArts);
      setSelectedArticle((prev) => {
        if (!prev) return null;
        return localizedArts.find((a) => a.id === prev.id || a.slug === prev.slug) || prev;
      });
    });
    return () => {
      active = false;
    };
  }, [locale, baseNewsArticles]);

  // Sync Watchlist and Favorites to user-scoped LocalStorage
  useEffect(() => {
    try {
      const key = getScopedStorageKey('astreon_watchlist', currentUser?.uid);
      localStorage.setItem(key, JSON.stringify(watchlist));
    } catch {}
  }, [watchlist, currentUser?.uid]);

  useEffect(() => {
    try {
      const key = getScopedStorageKey('astreon_favorites', currentUser?.uid);
      localStorage.setItem(key, JSON.stringify(favorites));
    } catch {}
  }, [favorites, currentUser?.uid]);

  useEffect(() => {
    try {
      const key = getScopedStorageKey('astreon_watch_history', currentUser?.uid);
      localStorage.setItem(key, JSON.stringify(watchHistory));
    } catch {}
  }, [watchHistory, currentUser?.uid]);

  useEffect(() => {
    try {
      const key = getScopedStorageKey('astreon_collections', currentUser?.uid);
      localStorage.setItem(key, JSON.stringify(customCollections));
    } catch {}
  }, [customCollections, currentUser?.uid]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('astreon_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('astreon_user');
      }
    } catch {}
  }, [currentUser]);

  // Derived Watchlist and Favorites ID & composite key arrays for fast collision-safe checks
  const watchlistIds = useMemo(() => watchlist.map((w) => w.mediaId), [watchlist]);
  const favoriteIds = useMemo(() => favorites.map((f) => f.mediaId), [favorites]);
  const watchlistKeys = useMemo(
    () => watchlist.map((w) => getMediaKey(w.mediaId, w.mediaType)),
    [watchlist]
  );
  const favoriteKeys = useMemo(
    () => favorites.map((f) => getMediaKey(f.mediaId, f.mediaType)),
    [favorites]
  );

  const autoplayTrailers = useMemo(() => {
    let localPref: string | null = null;
    try {
      localPref = localStorage.getItem(
        getScopedStorageKey('astreon_autoplay_trailers', currentUser?.uid)
      );
    } catch {}
    return resolveAutoplayTrailersPreference(currentUser, localPref);
  }, [currentUser]);

  // Recently Viewed media items converted from persistent Watch History
  const recentlyViewedItems = useMemo(
    () => watchHistoryToMediaItems(watchHistory),
    [watchHistory]
  );

  // Dynamic personalized recommendations based on user genre affinity, watchlist, and viewing history
  const recommendedItems = useMemo(() => {
    const userPreferred = currentUser?.preferredGenres || ['Science Fiction', 'Drama'];
    return getPersonalizedRecommendations(mediaList, userPreferred, watchlist, watchHistory);
  }, [mediaList, currentUser, watchlist, watchHistory]);

  // Published editorial articles for public feeds
  const publishedArticles = useMemo(
    () => newsArticles.filter((a) => a.status !== 'draft'),
    [newsArticles]
  );

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

  // Community 1-5 star average ratings keyed by "movie:id" / "tv:id"
  const communityRatingsByMedia = useMemo(
    () => aggregateStarRatingsByMedia(reviews),
    [reviews]
  );

  // Toggle Watchlist handler with Firestore persistence
  const handleToggleWatchlist = (item: MediaItem) => {
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }
    if (hasMediaEntry(watchlist, item.id, item.mediaType)) {
      setWatchlist((prev) =>
        prev.filter((w) => !(w.mediaId === item.id && w.mediaType === item.mediaType))
      );
      if (currentUser.uid) {
        removeFromUserWatchlist(currentUser.uid, item.id, item.mediaType);
      }
      showToast(`Removed "${item.title}" from your Watchlist`);
    } else {
      const newEntry: WatchlistItem = {
        id: `wl-${item.mediaType}-${item.id}-${Date.now()}`,
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
    if (hasMediaEntry(favorites, item.id, item.mediaType)) {
      setFavorites((prev) =>
        prev.filter((f) => !(f.mediaId === item.id && f.mediaType === item.mediaType))
      );
      if (currentUser.uid) {
        removeFromUserFavorites(currentUser.uid, item.id, item.mediaType);
      }
      showToast(`Removed "${item.title}" from Favourites`);
    } else {
      const newEntry: FavoriteItem = {
        id: `fav-${item.mediaType}-${item.id}-${Date.now()}`,
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

  const handleWatchRegionChange = useCallback((nextRegion: string) => {
    const normalized = normalizeProviderRegion(nextRegion);
    setWatchRegion(normalized);
    try {
      localStorage.setItem('astreon_watch_region', normalized);
    } catch {}
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, watchRegion: normalized };
      if (updated.uid) saveUserProfile(updated);
      return updated;
    });
    showToast(`Streaming region set to ${normalized}`);
  }, [showToast]);

  const handleCreateCollection = (name: string, description: string, isPublic: boolean) => {
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }
    if (customCollections.length >= MAX_CUSTOM_COLLECTIONS) {
      showToast(`Collection limit reached (${MAX_CUSTOM_COLLECTIONS})`);
      return;
    }
    const created = createCustomCollection({
      ownerId: currentUser.uid,
      ownerName: currentUser.displayName || 'ASTREON Curator',
      name,
      description,
      isPublic
    });
    setCustomCollections((prev) => [created, ...prev]);
    saveCustomCollection(created);
    showToast(`Created list "${created.name}"`);
  };

  const handleCreateCollectionWithItem = (name: string, item: MediaItem) => {
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }
    if (customCollections.length >= MAX_CUSTOM_COLLECTIONS) {
      showToast(`Collection limit reached (${MAX_CUSTOM_COLLECTIONS})`);
      return;
    }
    const created = createCustomCollection({
      ownerId: currentUser.uid,
      ownerName: currentUser.displayName || 'ASTREON Curator',
      name,
      isPublic: true,
      initialItem: item
    });
    setCustomCollections((prev) => [created, ...prev]);
    saveCustomCollection(created);
    showToast(`Added "${item.title}" to "${created.name}"`);
  };

  const handleToggleCollectionItem = (collectionId: string, item: MediaItem) => {
    if (!currentUser) {
      setAuthOpen(true);
      return;
    }
    setCustomCollections((prev) =>
      prev.map((col) => {
        if (col.id !== collectionId) return col;
        const updated = toggleItemInCollection(col, item);
        saveCustomCollection(updated);
        const nowHas = updated.items.some(
          (e) => e.mediaId === item.id && e.mediaType === item.mediaType
        );
        showToast(
          nowHas
            ? `Added "${item.title}" to "${updated.name}"`
            : `Removed "${item.title}" from "${updated.name}"`
        );
        return updated;
      })
    );
  };

  const handleToggleCollectionPublic = (collectionId: string) => {
    setCustomCollections((prev) =>
      prev.map((col) => {
        if (col.id !== collectionId) return col;
        const updated = { ...col, isPublic: !col.isPublic, updatedAt: new Date().toISOString() };
        saveCustomCollection(updated);
        showToast(
          updated.isPublic
            ? `"${updated.name}" is now public and shareable`
            : `"${updated.name}" is now private`
        );
        return updated;
      })
    );
  };

  const handleRemoveFromCollection = (
    collectionId: string,
    mediaId: number,
    mediaType: 'movie' | 'tv'
  ) => {
    setCustomCollections((prev) =>
      prev.map((col) => {
        if (col.id !== collectionId) return col;
        const updated = {
          ...col,
          items: col.items.filter((e) => !(e.mediaId === mediaId && e.mediaType === mediaType)),
          updatedAt: new Date().toISOString()
        };
        saveCustomCollection(updated);
        return updated;
      })
    );
    showToast('Removed title from list');
  };

  const handleDeleteCollection = (collectionId: string) => {
    setCustomCollections((prev) => prev.filter((c) => c.id !== collectionId));
    deleteCustomCollection(collectionId);
    showToast('Deleted custom list');
  };

  const handleNavigate = (view: string) => {
    let targetView: AppView = 'discover';
    let targetAccountTab: AccountSubTab | undefined;
    if (view === 'watchlist') {
      targetView = 'account';
      targetAccountTab = 'watchlist';
      setAccountSubTab('watchlist');
    } else if (view === 'favorites') {
      targetView = 'account';
      targetAccountTab = 'favorites';
      setAccountSubTab('favorites');
    } else if (view === 'history') {
      targetView = 'account';
      targetAccountTab = 'history';
      setAccountSubTab('history');
    } else if (view === 'collections') {
      targetView = 'account';
      targetAccountTab = 'collections';
      setAccountSubTab('collections');
    } else if (view === 'profile') {
      targetView = 'account';
      targetAccountTab = 'profile';
      setAccountSubTab('profile');
    } else if (
      view === 'discover' ||
      view === 'movies' ||
      view === 'tv' ||
      view === 'news' ||
      view === 'account' ||
      view === 'admin'
    ) {
      targetView = view;
    }

    setCurrentView(targetView);
    setSharedCollectionId(null);
    if (targetView !== 'news') {
      setSelectedArticle(null);
    }
    if (targetView === 'movies' || targetView === 'tv') {
      setCatalogFilters({});
    }
    setSelectedMedia(null);
    setSelectedPerson(null);
    pushUrl({ view: targetView, ...(targetAccountTab ? { accountTab: targetAccountTab } : {}) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCatalogFiltersChange = useCallback(
    (type: 'movie' | 'tv', next: CatalogFilterParams) => {
      setCatalogFilters(next);
      pushUrl({ view: type === 'movie' ? 'movies' : 'tv', ...next }, true);

      const fetchAndMergeCatalog = (filtersToFetch: CatalogFilterParams) => {
        const requestId = ++filterRequestIdRef.current;
        setIsFilteringCatalog(true);
        getDiscoverMedia(
          {
            type,
            genre: filtersToFetch.genre,
            year: filtersToFetch.year,
            minRating: filtersToFetch.minRating,
            sortBy: filtersToFetch.sort,
            searchQuery: filtersToFetch.q
          },
          1,
          tmdbLanguage
        )
          .then(async (res) => {
            if (res.results && res.results.length > 0) {
              const localizedResults = await Promise.all(
                res.results.map((item) => localizeMediaItem(item, locale))
              );
              setMediaList((prev) => {
                const byId = new Map(prev.map((m) => [`${m.mediaType}:${m.id}`, m]));
                for (const item of localizedResults) {
                  const k = `${item.mediaType}:${item.id}`;
                  if (!byId.has(k)) byId.set(k, item);
                }
                const nextList = Array.from(byId.values());
                localeMediaCacheRef.current[tmdbLanguage] = nextList;
                return nextList;
              });
            }
          })
          .catch(() => {})
          .finally(() => {
            if (filterRequestIdRef.current === requestId) {
              setIsFilteringCatalog(false);
            }
          });
      };

      if (catalogSearchTimerRef.current) {
        clearTimeout(catalogSearchTimerRef.current);
        catalogSearchTimerRef.current = null;
      }

      if (next.genre || next.year || next.minRating || next.sort) {
        fetchAndMergeCatalog(next);
      } else if (next.q && next.q.trim().length >= 2) {
        const snapshot = { ...next, q: next.q.trim() };
        catalogSearchTimerRef.current = setTimeout(() => {
          catalogSearchTimerRef.current = null;
          fetchAndMergeCatalog(snapshot);
        }, 350);
      }
    },
    [pushUrl, locale, tmdbLanguage]
  );

  const handleLoadMoreCatalog = useCallback(
    async (type: 'movie' | 'tv', activeFilters: CatalogFilterParams) => {
      const currentPage =
        type === 'movie' ? catalogPagination.moviePage : catalogPagination.tvPage;
      const nextPage = currentPage + 1;

      setCatalogPagination((prev) => ({ ...prev, loadingMore: true }));
      try {
        const res = await getDiscoverMedia(
          {
            type,
            genre: activeFilters.genre,
            year: activeFilters.year,
            minRating: activeFilters.minRating,
            sortBy: activeFilters.sort,
            searchQuery: activeFilters.q
          },
          nextPage,
          tmdbLanguage
        );
        if (res.results && res.results.length > 0) {
          const localizedResults = await Promise.all(
            res.results.map((item) => localizeMediaItem(item, locale))
          );
          setMediaList((prev) => {
            const byId = new Map(prev.map((m) => [`${m.mediaType}:${m.id}`, m]));
            for (const item of localizedResults) {
              const k = `${item.mediaType}:${item.id}`;
              if (!byId.has(k)) byId.set(k, item);
            }
            const nextList = Array.from(byId.values());
            localeMediaCacheRef.current[tmdbLanguage] = nextList;
            return nextList;
          });
        }
        setCatalogPagination((prev) => ({
          ...prev,
          loadingMore: false,
          ...(type === 'movie'
            ? { moviePage: nextPage, movieTotalPages: res.totalPages || nextPage }
            : { tvPage: nextPage, tvTotalPages: res.totalPages || nextPage })
        }));
      } catch {
        setCatalogPagination((prev) => ({ ...prev, loadingMore: false }));
      }
    },
    [catalogPagination.moviePage, catalogPagination.tvPage, locale, tmdbLanguage]
  );

  const handleSelectArticle = (article: NewsArticle | null) => {
    setSelectedArticle(article);
    setCurrentView('news');
    pushUrl({ view: 'news', articleSlug: article?.slug });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLegal = (tab: LegalTab) => {
    setLegalTab(tab);
    setLegalOpen(true);
  };

  const handleSelectMediaById = (id: number, type: 'movie' | 'tv') => {
    const match = mediaList.find((m) => m.id === id && m.mediaType === type);
    if (match) {
      openMediaDetail(match);
    } else {
      getMediaDetails(type, id, tmdbLanguage, watchRegion).then(async (fetched) => {
        if (fetched) openMediaDetail(await localizeMediaItem(fetched, locale));
      });
    }
  };

  const refreshReviews = useCallback(() => {
    getReviews().then((revs) => {
      if (revs && revs.length > 0) {
        setReviews(revs);
      }
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#080A12] text-[#F8FAFC]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#8B5CF6] focus:text-white focus:text-xs focus:font-semibold"
      >
        {t('nav.skipToContent')}
      </a>

      {/* Top Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenShare={() => setShareOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => setAuthOpen(true)}
        onSignOut={() => {
          logoutUser();
          setCurrentUser(null);
          showToast('Signed out of ASTREON account');
        }}
        watchlistCount={watchlist.length}
      />

      {/* Offline Connectivity Status Banner */}
      <OfflineBanner
        isOnline={isOnline}
        wasOffline={wasOffline}
        onRetry={checkConnection}
      />

      {/* Main View Router */}
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {/* VIEW 1: DISCOVER / HOMEPAGE */}
        {currentView === 'discover' && (
          isLoadingCatalog ? (
            <DiscoverSkeleton />
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Hero Banner */}
                <HeroBanner
                  item={featuredMedia}
                  onSelect={openMediaDetail}
                  onWatchTrailer={openTrailerModal}
                  isWatchlisted={hasMediaEntry(watchlist, featuredMedia.id, featuredMedia.mediaType)}
                  onToggleWatchlist={handleToggleWatchlist}
                />

                {/* Content Rails */}
                <div className="space-y-4">
                  {/* Recommended For You (Personalized) */}
                  <MediaRail
                    title={t('rail.recommended.title')}
                    subtitle={
                      currentUser && currentUser.preferredGenres?.length
                        ? t('rail.recommended.subtitleUser', {
                            genres: currentUser.preferredGenres.map(tGenre).join(', ')
                          })
                        : t('rail.recommended.subtitleDefault')
                    }
                    items={recommendedItems}
                    onSelect={openMediaDetail}
                    onWatchTrailer={openTrailerModal}
                    watchlistIds={watchlistIds}
                    favoriteIds={favoriteIds}
                    watchlistKeys={watchlistKeys}
                    favoriteKeys={favoriteKeys}
                    onToggleWatchlist={handleToggleWatchlist}
                    onToggleFavorite={handleToggleFavorite}
                    autoplayTrailers={autoplayTrailers}
                    isOnline={isOnline}
                    communityRatings={communityRatingsByMedia}
                  />

                  {/* Recently Viewed Rail (Shown once user has opened any title) */}
                  {recentlyViewedItems.length > 0 && (
                    <MediaRail
                      title={t('rail.recentlyViewed.title')}
                      subtitle={t('rail.recentlyViewed.subtitle')}
                      items={recentlyViewedItems}
                      onSelect={openMediaDetail}
                      onWatchTrailer={openTrailerModal}
                      watchlistIds={watchlistIds}
                      favoriteIds={favoriteIds}
                      watchlistKeys={watchlistKeys}
                      favoriteKeys={favoriteKeys}
                      onToggleWatchlist={handleToggleWatchlist}
                      onToggleFavorite={handleToggleFavorite}
                      autoplayTrailers={autoplayTrailers}
                      isOnline={isOnline}
                      communityRatings={communityRatingsByMedia}
                      testId="recently-viewed-rail"
                    />
                  )}

                  {/* Coming Soon (Upcoming Movies & Series) */}
                  <MediaRail
                    title={t('rail.comingSoon.title')}
                    subtitle={t('rail.comingSoon.subtitle')}
                    items={upcomingMedia}
                    onSelect={openMediaDetail}
                    onWatchTrailer={openTrailerModal}
                    watchlistIds={watchlistIds}
                    favoriteIds={favoriteIds}
                    watchlistKeys={watchlistKeys}
                    favoriteKeys={favoriteKeys}
                    onToggleWatchlist={handleToggleWatchlist}
                    onToggleFavorite={handleToggleFavorite}
                    autoplayTrailers={autoplayTrailers}
                    isOnline={isOnline}
                    showReleaseDate
                    communityRatings={communityRatingsByMedia}
                    testId="coming-soon-rail"
                  />

                  {/* Trending Cinema Rail */}
                  <MediaRail
                    title={t('rail.trendingMovies.title')}
                    subtitle={t('rail.trendingMovies.subtitle')}
                    items={trendingMovies}
                    onSelect={openMediaDetail}
                    onWatchTrailer={openTrailerModal}
                    watchlistIds={watchlistIds}
                    favoriteIds={favoriteIds}
                    watchlistKeys={watchlistKeys}
                    favoriteKeys={favoriteKeys}
                    onToggleWatchlist={handleToggleWatchlist}
                    onToggleFavorite={handleToggleFavorite}
                    autoplayTrailers={autoplayTrailers}
                    isOnline={isOnline}
                    communityRatings={communityRatingsByMedia}
                    viewAllLink={() => handleNavigate('movies')}
                  />

                  {/* Prestige Television Rail */}
                  <MediaRail
                    title={t('rail.tvSeries.title')}
                    subtitle={t('rail.tvSeries.subtitle')}
                    items={tvSeries}
                    onSelect={openMediaDetail}
                    onWatchTrailer={openTrailerModal}
                    watchlistIds={watchlistIds}
                    favoriteIds={favoriteIds}
                    watchlistKeys={watchlistKeys}
                    favoriteKeys={favoriteKeys}
                    onToggleWatchlist={handleToggleWatchlist}
                    onToggleFavorite={handleToggleFavorite}
                    autoplayTrailers={autoplayTrailers}
                    isOnline={isOnline}
                    communityRatings={communityRatingsByMedia}
                    viewAllLink={() => handleNavigate('tv')}
                  />

                  {/* Top Rated & Acclaimed Rail */}
                  <MediaRail
                    title={t('rail.topRated.title')}
                    subtitle={t('rail.topRated.subtitle')}
                    items={topRated}
                    onSelect={openMediaDetail}
                    onWatchTrailer={openTrailerModal}
                    watchlistIds={watchlistIds}
                    favoriteIds={favoriteIds}
                    watchlistKeys={watchlistKeys}
                    favoriteKeys={favoriteKeys}
                    onToggleWatchlist={handleToggleWatchlist}
                    onToggleFavorite={handleToggleFavorite}
                    autoplayTrailers={autoplayTrailers}
                    isOnline={isOnline}
                    communityRatings={communityRatingsByMedia}
                  />

                  {/* Latest Official Trailers Rail */}
                  <section className="my-10" aria-label={t('rail.trailers.title')}>
                    <div className="flex items-end justify-between mb-4 px-1">
                      <div>
                        <h2 className="text-xl md:text-2xl font-display font-semibold text-[#F8FAFC] tracking-tight">
                          {t('rail.trailers.title')}
                        </h2>
                        <p className="text-xs text-[#858B9B] mt-0.5">
                          {t('rail.trailers.subtitle')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                      {titlesWithTrailers.slice(0, 4).map((item) => {
                        const trailerKey = `trailer-${item.mediaType}-${item.id}`;
                        return (
                        <button
                          type="button"
                          key={`${item.mediaType}-${item.id}`}
                          onClick={() => openTrailerModal(item)}
                          className="text-left group relative rounded-xl bg-[#111421] border border-[#272B3A] overflow-hidden hover:border-[#8B5CF6]/50 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                        >
                          <div className="aspect-video relative overflow-hidden bg-[#191D2B]">
                            {(item.backdropPath || item.posterPath) &&
                            !failedHomeImages[trailerKey] ? (
                              <img
                                src={item.backdropPath || item.posterPath}
                                alt={item.title}
                                referrerPolicy="no-referrer"
                                onError={() =>
                                  setFailedHomeImages((prev) => ({
                                    ...prev,
                                    [trailerKey]: true
                                  }))
                                }
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#858B9B]">
                                <Film className="w-7 h-7 opacity-60" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <div className="w-11 h-11 rounded-full bg-[#F8FAFC]/90 text-[#080A12] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              </div>
                            </div>
                          </div>
                          <div className="p-3">
                            <h3 className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#38BDF8] truncate">
                              {item.title}
                            </h3>
                            <p className="text-[11px] text-[#858B9B] mt-0.5 truncate">
                              {item.videos?.[0]?.name || t('rail.trailers.defaultClip')}
                            </p>
                          </div>
                        </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* Editorial Dispatches Preview */}
                  <section className="my-10 sm:my-12 p-5 sm:p-8 rounded-2xl bg-[#111421] border border-[#272B3A]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
                      <div>
                        <span className="text-xs font-mono uppercase tracking-widest text-[#8B5CF6]">
                          {t('home.journalLabel')}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-display font-bold text-[#F8FAFC] tracking-tight mt-1">
                          {t('home.journalHeading')}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleNavigate('news')}
                        className="min-h-[40px] md:min-h-0 flex items-center text-xs font-medium text-[#38BDF8] hover:text-cyan-300 transition-colors cursor-pointer self-start sm:self-auto"
                      >
                        {t('home.readAllArticles')}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                      {publishedArticles.slice(0, 3).map((art, idx) => (
                        <button
                          type="button"
                          key={art.id}
                          onClick={() => handleSelectArticle(art)}
                          className={`text-left group flex flex-col space-y-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded-xl ${
                            idx === 0 ? 'sm:col-span-2 lg:col-span-1' : ''
                          }`}
                        >
                          <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#191D2B] border border-[#272B3A]">
                            {art.image && !failedHomeImages[`news-${art.id}`] ? (
                              <img
                                src={art.image}
                                alt={art.imageAlt}
                                referrerPolicy="no-referrer"
                                onError={() =>
                                  setFailedHomeImages((prev) => ({
                                    ...prev,
                                    [`news-${art.id}`]: true
                                  }))
                                }
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-[#858B9B] p-4 text-center">
                                <Newspaper className="w-7 h-7 mb-1.5 opacity-60 text-[#38BDF8]" />
                                <span className="text-[11px] font-mono uppercase tracking-wider line-clamp-1">
                                  {art.category}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-[#38BDF8] uppercase">
                            {art.category} · {art.readTime}
                          </span>
                          <h3 className="text-sm font-semibold text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors line-clamp-2">
                            {art.title}
                          </h3>
                          <p className="text-xs text-[#858B9B] line-clamp-2">{art.excerpt}</p>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
            </div>
          )
        )}

        {/* Data-Loading Skeletons for Secondary Routes (kept outside Suspense to avoid double-mounting) */}
        {(currentView === 'movies' || currentView === 'tv') && isLoadingCatalog && (
          <CatalogGridSkeleton />
        )}
        {currentView === 'news' && isLoadingNews && (
          <EditorialSkeleton />
        )}

        {/* Lazy-Loaded Secondary Routes */}
        <Suspense
          fallback={
            currentView === 'movies' || currentView === 'tv' ? (
              <CatalogGridSkeleton />
            ) : currentView === 'news' ? (
              <EditorialSkeleton />
            ) : (
              <AccountSkeleton />
            )
          }
        >
          {/* VIEW 2: MOVIES DISCOVERY */}
          {currentView === 'movies' && !isLoadingCatalog && (
            <CatalogBrowser
              mediaType="movie"
              items={trendingMovies}
              onSelect={openMediaDetail}
              onWatchTrailer={openTrailerModal}
              watchlistIds={watchlistIds}
              favoriteIds={favoriteIds}
              watchlistKeys={watchlistKeys}
              favoriteKeys={favoriteKeys}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleFavorite={handleToggleFavorite}
              title={t('catalog.moviesTitle')}
              subtitle={t('catalog.moviesSubtitle')}
              initialFilters={catalogFilters}
              onFiltersChange={(next) => handleCatalogFiltersChange('movie', next)}
              hasMore={catalogPagination.moviePage < catalogPagination.movieTotalPages}
              loadingMore={catalogPagination.loadingMore}
              isLoading={isFilteringCatalog}
              onLoadMore={(filters) => handleLoadMoreCatalog('movie', filters)}
              autoplayTrailers={autoplayTrailers}
              isOnline={isOnline}
              communityRatings={communityRatingsByMedia}
            />
          )}

          {/* VIEW 3: TV SHOWS DISCOVERY */}
          {currentView === 'tv' && !isLoadingCatalog && (
            <CatalogBrowser
              mediaType="tv"
              items={tvSeries}
              onSelect={openMediaDetail}
              onWatchTrailer={openTrailerModal}
              watchlistIds={watchlistIds}
              favoriteIds={favoriteIds}
              watchlistKeys={watchlistKeys}
              favoriteKeys={favoriteKeys}
              onToggleWatchlist={handleToggleWatchlist}
              onToggleFavorite={handleToggleFavorite}
              title={t('catalog.tvTitle')}
              subtitle={t('catalog.tvSubtitle')}
              initialFilters={catalogFilters}
              onFiltersChange={(next) => handleCatalogFiltersChange('tv', next)}
              hasMore={catalogPagination.tvPage < catalogPagination.tvTotalPages}
              loadingMore={catalogPagination.loadingMore}
              isLoading={isFilteringCatalog}
              onLoadMore={(filters) => handleLoadMoreCatalog('tv', filters)}
              autoplayTrailers={autoplayTrailers}
              isOnline={isOnline}
              communityRatings={communityRatingsByMedia}
            />
          )}

          {/* VIEW 4: EDITORIAL NEWS */}
          {currentView === 'news' && !isLoadingNews && (
            <EditorialNewsView
              articles={publishedArticles}
              selectedArticle={selectedArticle}
              onSelectArticle={handleSelectArticle}
            />
          )}

          {/* VIEW 5: USER ACCOUNT / WATCHLIST */}
          {currentView === 'account' && (
            currentUser ? (
              <AccountView
                currentUser={currentUser}
                activeSubTab={accountSubTab}
                onSubTabChange={(tab) => {
                  setAccountSubTab(tab);
                  pushUrl({ view: 'account', accountTab: tab }, true);
                }}
                watchlist={watchlist}
                favorites={favorites}
                watchHistory={watchHistory}
                customCollections={customCollections}
                watchRegion={watchRegion}
                onWatchRegionChange={handleWatchRegionChange}
                onCreateCollection={handleCreateCollection}
                onToggleCollectionPublic={handleToggleCollectionPublic}
                onRemoveFromCollection={handleRemoveFromCollection}
                onDeleteCollection={handleDeleteCollection}
                onRemoveWatchlist={(id, mediaType) => {
                  setWatchlist((prev) =>
                    prev.filter((w) => !(w.mediaId === id && w.mediaType === mediaType))
                  );
                  if (currentUser.uid) removeFromUserWatchlist(currentUser.uid, id, mediaType);
                  showToast('Removed title from Watchlist');
                }}
                onRemoveFavorite={(id, mediaType) => {
                  setFavorites((prev) =>
                    prev.filter((f) => !(f.mediaId === id && f.mediaType === mediaType))
                  );
                  if (currentUser.uid) removeFromUserFavorites(currentUser.uid, id, mediaType);
                  showToast('Removed title from Favourites');
                }}
                onRemoveWatchHistory={(entryId) => {
                  setWatchHistory((prev) => removeWatchHistoryEntry(prev, entryId));
                  if (currentUser.uid) removeUserWatchHistoryItem(currentUser.uid, entryId);
                  showToast('Removed title from Watch History');
                }}
                onClearWatchHistory={() => {
                  setWatchHistory([]);
                  if (currentUser.uid) clearUserWatchHistory(currentUser.uid);
                  showToast('Cleared Watch History');
                }}
                onSelectMediaById={handleSelectMediaById}
                onUpdatePreferences={(updated) => {
                  setCurrentUser((prev) => {
                    if (!prev) return null;
                    const merged = { ...prev, ...updated };
                    if (typeof merged.playbackPreferences?.autoplayTrailers === 'boolean') {
                      try {
                        localStorage.setItem(
                          getScopedStorageKey('astreon_autoplay_trailers', merged.uid),
                          String(merged.playbackPreferences.autoplayTrailers)
                        );
                      } catch {}
                    }
                    if (merged.watchRegion) {
                      const norm = normalizeProviderRegion(merged.watchRegion);
                      setWatchRegion(norm);
                      try {
                        localStorage.setItem('astreon_watch_region', norm);
                      } catch {}
                    }
                    if (merged.uid) saveUserProfile(merged);
                    return merged;
                  });
                  showToast('Preferences updated in Firestore');
                }}
                onSignOut={() => {
                  logoutUser();
                  setCurrentUser(null);
                  handleNavigate('discover');
                  showToast('Signed out successfully');
                }}
              />
            ) : (
              <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
                <h2 className="text-xl font-display font-bold text-[#F8FAFC]">
                  {t('account.signInTitle')}
                </h2>
                <p className="text-xs text-[#858B9B]">
                  {t('account.signInSubtitle')}
                </p>
                <button
                  onClick={() => setAuthOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {t('account.signInButton')}
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
                adminEmail={currentUser.email}
                onFeaturedUpdated={(newId) => {
                  const found = mediaList.find((m) => m.id === newId);
                  if (found) {
                    featuredIdRef.current = found.id;
                    setFeaturedMedia(found);
                    showToast(`Hero spotlight updated to "${found.title}"`);
                  }
                }}
                articles={baseNewsArticles}
                onArticlePublished={(art) => {
                  setBaseNewsArticles((prev) => [art, ...prev]);
                  showToast(`Published article "${art.title}"`);
                }}
                onArticleUpdated={(updated) => {
                  setBaseNewsArticles((prev) =>
                    prev.map((a) => (a.id === updated.id ? updated : a))
                  );
                  showToast(`Updated dispatch "${updated.title}"`);
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
          {/* VIEW 7: PUBLIC SHARED COLLECTION */}
          {currentView === 'list' && (
            <SharedCollectionView
              collection={sharedCollectionData}
              loading={loadingSharedCollection}
              onSelectMediaById={handleSelectMediaById}
              onBackHome={() => handleNavigate('discover')}
            />
          )}
        </Suspense>
      </main>

      {/* Shared Footer */}
      <Footer
        onOpenLegal={handleOpenLegal}
        onNavigate={handleNavigate}
        onOpenShare={() => setShareOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      {/* Global Interactive Modals */}
      <Suspense fallback={null}>
        <TitleDetailModal
          item={selectedMedia}
          catalog={mediaList}
          onClose={closeMediaDetail}
          onWatchTrailer={openTrailerModal}
          isWatchlisted={
            selectedMedia
              ? hasMediaEntry(watchlist, selectedMedia.id, selectedMedia.mediaType)
              : false
          }
          isFavorite={
            selectedMedia
              ? hasMediaEntry(favorites, selectedMedia.id, selectedMedia.mediaType)
              : false
          }
          onToggleWatchlist={handleToggleWatchlist}
          onToggleFavorite={handleToggleFavorite}
          currentUser={currentUser}
          onOpenAuth={() => setAuthOpen(true)}
          onSelectSimilar={(sim) => openMediaDetail(sim)}
          onReviewsChanged={refreshReviews}
          onReviewUpserted={(upserted) =>
            setReviews((prev) => [upserted, ...prev.filter((r) => r.id !== upserted.id)])
          }
          onReviewDeleted={(deletedId) =>
            setReviews((prev) => prev.filter((r) => r.id !== deletedId))
          }
          watchRegion={watchRegion}
          onRegionChange={handleWatchRegionChange}
          onSelectPerson={(person) => setSelectedPerson(person)}
          customCollections={customCollections}
          onToggleCollectionItem={handleToggleCollectionItem}
          onCreateCollectionWithItem={handleCreateCollectionWithItem}
        />

        <PersonProfileModal
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
          onSelectCredit={(mediaId, mediaType) => {
            setSelectedPerson(null);
            handleSelectMediaById(mediaId, mediaType);
          }}
        />

        <TrailerModal
          item={trailerMedia}
          onClose={() => setTrailerMedia(null)}
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

        <KeyboardShortcutsModal
          isOpen={shortcutsOpen}
          onClose={() => setShortcutsOpen(false)}
          onNavigate={handleNavigate}
          onOpenSearch={() => setSearchOpen(true)}
        />
      </Suspense>

      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        mediaItems={mediaList}
        newsArticles={publishedArticles}
        currentUserId={currentUser?.uid}
        onSelectMedia={openMediaDetail}
        onSelectArticle={(art) => handleSelectArticle(art)}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome back, ${user.displayName}!`);
        }}
      />

      {/* Accessible Toast Notification Bar */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 md:bottom-6 z-50 flex items-center gap-2.5 px-4 py-3 sm:py-2.5 rounded-xl bg-[#191D2B] text-[#F8FAFC] border border-[#8B5CF6]/50 shadow-2xl animate-in slide-in-from-bottom-3 duration-200 text-xs font-medium"
        >
          <Check className="w-4 h-4 text-[#38BDF8] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
