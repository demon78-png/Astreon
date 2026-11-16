import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MediaItem,
  UserProfile,
  UserReview,
  TvSeasonDetails,
  CustomCollection
} from '../types/entertainment';
import {
  formatRating,
  formatReleaseYear,
  formatRuntime,
  calculateCommunityRating,
  sortReviews,
  findSimilarMedia,
  ReviewSortOption
} from '../utils/entertainment';
import {
  getReviews,
  getMediaDetails,
  getTvSeasonDetails,
  submitReview,
  updateReview,
  deleteReview,
  toggleReviewHelpful,
  submitContentReport
} from '../services/api';
import { fetchUserHelpfulVoteIds } from '../services/firebase';
import { useI18n } from '../contexts/I18nContext';
import { getSeedLocalizedMediaSync, localizeMediaItem } from '../services/translator';
import {
  buildTitleDeepLink,
  buildTitleSharePayload,
  shareTitleWithFallback
} from '../utils/share';
import {
  SUPPORTED_PROVIDER_REGIONS,
  buildProviderSearchOrWatchUrl,
  groupProvidersByAvailability
} from '../utils/providers';
import { isItemInCollection } from '../utils/collections';
import {
  calculateMediaStarStats,
  getReviewStarValue,
  clampStarRating
} from '../utils/ratings';
import { StarRatingWidget } from './StarRatingWidget';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  X,
  Star,
  Bookmark,
  Heart,
  Play,
  ExternalLink,
  Flag,
  MessageSquare,
  Check,
  AlertCircle,
  ThumbsUp,
  Edit2,
  Trash2,
  Share2,
  Copy,
  Link2,
  Globe,
  Tv,
  ListPlus,
  Loader2,
  Plus
} from 'lucide-react';

interface TitleDetailModalProps {
  item: MediaItem | null;
  catalog?: MediaItem[];
  onClose: () => void;
  onWatchTrailer?: (item: MediaItem) => void;
  isWatchlisted?: boolean;
  isFavorite?: boolean;
  onToggleWatchlist?: (item: MediaItem) => void;
  onToggleFavorite?: (item: MediaItem) => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSelectSimilar?: (item: MediaItem) => void;
  onReviewsChanged?: () => void;
  onReviewUpserted?: (review: UserReview) => void;
  onReviewDeleted?: (reviewId: string) => void;
  watchRegion?: string;
  onRegionChange?: (region: string) => void;
  onSelectPerson?: (person: { id: number; name: string; profilePath?: string }) => void;
  customCollections?: CustomCollection[];
  onToggleCollectionItem?: (collectionId: string, item: MediaItem) => void;
  onCreateCollectionWithItem?: (name: string, item: MediaItem) => void;
}

export const TitleDetailModal: React.FC<TitleDetailModalProps> = ({
  item,
  catalog = [],
  onClose,
  onWatchTrailer,
  isWatchlisted = false,
  isFavorite = false,
  onToggleWatchlist,
  onToggleFavorite,
  currentUser,
  onOpenAuth,
  onSelectSimilar,
  onReviewsChanged,
  onReviewUpserted,
  onReviewDeleted,
  watchRegion = 'US',
  onRegionChange,
  onSelectPerson,
  customCollections = [],
  onToggleCollectionItem,
  onCreateCollectionWithItem
}) => {
  const { t, tGenre, locale, tmdbLanguage, formatDate } = useI18n();
  const modalRef = useRef<HTMLDivElement>(null);
  const [detailedItem, setDetailedItem] = useState<MediaItem | null>(item);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewSort, setReviewSort] = useState<ReviewSortOption>('newest');
  const [helpfulVotedIds, setHelpfulVotedIds] = useState<string[]>([]);

  const [userStars, setUserStars] = useState<number>(4);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Inline edit state for own reviews
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editStars, setEditStars] = useState<number>(4);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [reportNotice, setReportNotice] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'seasons' | 'cast' | 'reviews'>('overview');
  const [failedCastImages, setFailedCastImages] = useState<Record<number, boolean>>({});
  const [failedSimilarImages, setFailedSimilarImages] = useState<Record<string, boolean>>({});
  const [failedProviderLogos, setFailedProviderLogos] = useState<Record<number, boolean>>({});
  const [failedEpisodeStills, setFailedEpisodeStills] = useState<Record<number, boolean>>({});

  // TV Season & Episode state
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [seasonDetails, setSeasonDetails] = useState<TvSeasonDetails | null>(null);
  const [loadingSeason, setLoadingSeason] = useState(false);

  // Save to custom collection popover state
  const [collectionMenuOpen, setCollectionMenuOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  const [shareFeedback, setShareFeedback] = useState<'idle' | 'shared' | 'copied'>('idle');
  const [shareFallbackUrl, setShareFallbackUrl] = useState<string | null>(null);
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusTrap(modalRef, Boolean(item), onClose);

  const scheduleShareFeedbackReset = () => {
    if (shareTimerRef.current) {
      clearTimeout(shareTimerRef.current);
    }
    shareTimerRef.current = setTimeout(() => {
      setShareFeedback('idle');
      shareTimerRef.current = null;
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (shareTimerRef.current) {
        clearTimeout(shareTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!item) {
      setDetailedItem(null);
      return;
    }
    let mounted = true;
    setDetailedItem(getSeedLocalizedMediaSync(item, locale));
    setActiveTab('overview');
    setSelectedSeason(1);
    setSeasonDetails(null);
    setCollectionMenuOpen(false);
    setNewCollectionName('');
    setReviewSuccess('');
    setReviewError('');
    setEditingReviewId(null);
    setEditError('');
    setReportNotice('');
    setFailedCastImages({});
    setFailedSimilarImages({});
    setFailedProviderLogos({});
    setFailedEpisodeStills({});
    if (shareTimerRef.current) {
      clearTimeout(shareTimerRef.current);
      shareTimerRef.current = null;
    }
    setShareFeedback('idle');
    setShareFallbackUrl(null);

    // Hydrate full details (cast, videos, region providers, similarIds) in active language & region
    getMediaDetails(item.mediaType, item.id, tmdbLanguage, watchRegion).then(async (full) => {
      if (!mounted || !full) return;
      const localized = await localizeMediaItem(full, locale);
      if (mounted) {
        setDetailedItem((prev) => (prev && prev.id === localized.id ? { ...prev, ...localized } : localized));
      }
    });

    setLoadingReviews(true);
    getReviews(item.id, item.mediaType).then((res) => {
      if (mounted) {
        setReviews(res);
        setLoadingReviews(false);
        if (currentUser?.uid && res.length > 0) {
          fetchUserHelpfulVoteIds(currentUser.uid, res.map((r) => r.id)).then((voted) => {
            if (mounted) setHelpfulVotedIds(voted);
          });
        } else {
          setHelpfulVotedIds([]);
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [item?.id, item?.mediaType, currentUser?.uid, locale, tmdbLanguage, watchRegion]);

  // Fetch TV season & episodes on demand when viewing Seasons tab or switching season
  useEffect(() => {
    if (!item || item.mediaType !== 'tv' || activeTab !== 'seasons') return;
    let mounted = true;
    setLoadingSeason(true);
    setFailedEpisodeStills({});
    getTvSeasonDetails(item.id, selectedSeason, tmdbLanguage)
      .then((res) => {
        if (mounted) setSeasonDetails(res);
      })
      .finally(() => {
        if (mounted) setLoadingSeason(false);
      });
    return () => {
      mounted = false;
    };
  }, [item?.id, item?.mediaType, activeTab, selectedSeason, tmdbLanguage]);

  const activeItem = detailedItem || item;

  const providerGroups = useMemo(
    () => groupProvidersByAvailability(activeItem?.providers || []),
    [activeItem?.providers]
  );

  const sortedReviews = useMemo(
    () =>
      sortReviews(
        reviews.filter(
          (r) =>
            r.status !== 'flagged' &&
            (!r.mediaType || !activeItem?.mediaType || r.mediaType === activeItem.mediaType)
        ),
        reviewSort
      ),
    [reviews, reviewSort, activeItem?.mediaType]
  );

  const similarTitles = useMemo(() => {
    if (!activeItem) return [];
    return findSimilarMedia(activeItem, catalog, 4);
  }, [activeItem, catalog]);

  const starStats = useMemo(() => {
    if (!activeItem) return { average: 0, count: 0, formatted: 'NR' };
    return calculateMediaStarStats(reviews, activeItem.id, activeItem.mediaType);
  }, [reviews, activeItem?.id, activeItem?.mediaType]);

  const existingUserReview = useMemo(() => {
    if (!currentUser?.uid || !activeItem) return null;
    return (
      reviews.find(
        (r) =>
          r.userId === currentUser.uid &&
          r.mediaId === activeItem.id &&
          (!r.mediaType || r.mediaType === activeItem.mediaType)
      ) || null
    );
  }, [reviews, currentUser?.uid, activeItem?.id, activeItem?.mediaType]);

  if (!activeItem) return null;

  const year = formatReleaseYear(activeItem.releaseDate || activeItem.firstAirDate);
  const tmdbScore = formatRating(activeItem.voteAverage);
  const runtime = formatRuntime(activeItem.runtime);
  const communityStats = calculateCommunityRating(reviews, activeItem.mediaType);
  const hasTrailer = activeItem.videos && activeItem.videos.some((v) => v.site === 'YouTube' && v.key);

  const handleStarRatingSubmit = async (stars: number, note: string): Promise<boolean> => {
    if (!currentUser) {
      onOpenAuth();
      return false;
    }

    const res = await submitReview({
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userAvatar: currentUser.avatar,
      mediaId: activeItem.id,
      mediaType: activeItem.mediaType,
      starRating: clampStarRating(stars),
      reviewText: note,
      existingReview: existingUserReview
    });

    if (res) {
      setReviews((prev) => [res, ...prev.filter((r) => r.id !== res.id)]);
      onReviewUpserted?.(res);
      onReviewsChanged?.();
      return true;
    }
    return false;
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (reviewText.trim().length < 5) {
      setReviewError('Review must be at least 5 characters long.');
      return;
    }

    setSubmittingReview(true);
    setReviewError('');
    setReviewSuccess('');

    const res = await submitReview({
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userAvatar: currentUser.avatar,
      mediaId: activeItem.id,
      mediaType: activeItem.mediaType,
      starRating: clampStarRating(userStars),
      reviewText: reviewText.trim(),
      existingReview: existingUserReview
    });

    setSubmittingReview(false);
    if (res) {
      setReviewSuccess('Your review has been published to the ASTREON community.');
      setReviewText('');
      setReviews((prev) => [res, ...prev.filter((r) => r.id !== res.id)]);
      onReviewUpserted?.(res);
      onReviewsChanged?.();
    } else {
      setReviewError('Failed to submit review. Please try again.');
    }
  };

  const handleStartEdit = (rev: UserReview) => {
    setEditingReviewId(rev.id);
    setEditStars(clampStarRating(getReviewStarValue(rev)));
    setEditText(rev.reviewText);
    setEditError('');
  };

  const handleSaveEdit = async (rev: UserReview) => {
    if (editText.trim().length < 5 && !rev.starRating) {
      setEditError('Review must be at least 5 characters long.');
      return;
    }
    setEditError('');
    setSavingEdit(true);
    const updated = await updateReview(rev, {
      starRating: clampStarRating(editStars),
      reviewText: editText.trim()
    });
    setSavingEdit(false);
    if (updated) {
      setReviews((prev) => prev.map((r) => (r.id === rev.id ? updated : r)));
      setEditingReviewId(null);
      setEditError('');
      onReviewUpserted?.(updated);
      onReviewsChanged?.();
    } else {
      setEditError('Failed to save changes. Please try again.');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    const ok = await deleteReview(reviewId);
    if (ok) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      onReviewDeleted?.(reviewId);
      onReviewsChanged?.();
    }
  };

  const handleToggleHelpful = async (rev: UserReview) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const alreadyVoted = helpfulVotedIds.includes(rev.id);
    const prevVotedIds = helpfulVotedIds;
    const prevHelpfulCount = rev.helpfulCount || 0;
    // Optimistic update
    setHelpfulVotedIds((prev) =>
      alreadyVoted ? prev.filter((id) => id !== rev.id) : [...prev, rev.id]
    );
    setReviews((prev) =>
      prev.map((r) =>
        r.id === rev.id
          ? { ...r, helpfulCount: Math.max(0, prevHelpfulCount + (alreadyVoted ? -1 : 1)) }
          : r
      )
    );

    const res = await toggleReviewHelpful(rev.id, currentUser.uid, alreadyVoted);
    if (res) {
      setReviews((prev) =>
        prev.map((r) => (r.id === rev.id ? { ...r, helpfulCount: res.helpfulCount } : r))
      );
      setHelpfulVotedIds((prev) =>
        res.voted
          ? prev.includes(rev.id)
            ? prev
            : [...prev, rev.id]
          : prev.filter((id) => id !== rev.id)
      );
    } else {
      // Roll back optimistic state on failure
      setHelpfulVotedIds(prevVotedIds);
      setReviews((prev) =>
        prev.map((r) => (r.id === rev.id ? { ...r, helpfulCount: prevHelpfulCount } : r))
      );
    }
  };

  const handleReport = async (reviewId: string) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (reportedIds.includes(reviewId)) return;
    setReportNotice('');
    const ok = await submitContentReport({
      targetType: 'review',
      targetId: reviewId,
      reason: 'User flagged community review for moderation audit',
      reporterId: currentUser.uid
    });
    if (ok) {
      setReportedIds((prev) => (prev.includes(reviewId) ? prev : [...prev, reviewId]));
    } else {
      setReportNotice('Unable to submit report right now. Please try again.');
    }
  };

  const handleShareTitle = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const payload = buildTitleSharePayload(origin, activeItem);
    const outcome = await shareTitleWithFallback(payload);

    if (outcome.status === 'shared') {
      setShareFeedback('shared');
      setShareFallbackUrl(null);
      scheduleShareFeedbackReset();
    } else if (outcome.status === 'copied') {
      setShareFeedback('copied');
      setShareFallbackUrl(outcome.url);
      scheduleShareFeedbackReset();
    } else if (outcome.status === 'fallback') {
      setShareFallbackUrl(outcome.url);
    }
  };

  const handleCopyFallbackLink = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = shareFallbackUrl || buildTitleDeepLink(origin, activeItem);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        setShareFeedback('copied');
        scheduleShareFeedbackReset();
      } catch {
        // User can copy directly from the readonly input
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 bg-black/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="title-detail-heading"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full md:max-w-4xl max-h-[90dvh] md:max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#111421] border-t md:border border-[#272B3A] rounded-t-3xl md:rounded-2xl shadow-2xl md:my-auto animate-in fade-in slide-in-from-bottom-4 md:zoom-in-95 duration-200 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile bottom-sheet drag handle */}
        <div className="md:hidden sticky top-0 z-30 flex justify-center pt-2.5 pb-1 bg-[#111421]/90 backdrop-blur-sm">
          <div className="w-10 h-1.5 rounded-full bg-[#272B3A]" aria-hidden="true" />
        </div>

        {/* Hero Backdrop Header with Close Button */}
        <div className="relative h-56 sm:h-72 md:h-80 w-full overflow-hidden bg-[#080A12]">
          {(activeItem.backdropPath || activeItem.posterPath) && (
            <img
              src={activeItem.backdropPath || activeItem.posterPath}
              alt={activeItem.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover filter brightness-75"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111421] via-[#111421]/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 md:top-4 md:right-4 z-20 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center p-2 rounded-full bg-[#080A12]/85 hover:bg-[#080A12] text-[#A1A1AA] hover:text-[#F8FAFC] border border-[#272B3A] transition-colors cursor-pointer"
            aria-label="Close detail modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Backdrop Floating Metadata */}
          <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#38BDF8] mb-1">
                <span>{activeItem.mediaType === 'movie' ? t('detail.film') : t('detail.television')}</span>
                <span>·</span>
                <span className="tabular-nums">{year}</span>
              </div>
              <h1 id="title-detail-heading" className="text-2xl sm:text-4xl font-display font-bold text-[#F8FAFC] tracking-tight text-balance">
                {activeItem.title}
              </h1>
              {activeItem.tagline && (
                <p className="text-xs sm:text-sm text-[#A1A1AA] italic mt-1 max-w-xl line-clamp-2">
                  "{activeItem.tagline}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-8 space-y-6">
          {/* Quick Metrics Bar & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#272B3A]">
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
              {/* TMDB Source Rating */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#191D2B] border border-[#272B3A]">
                <Star className="w-3.5 h-3.5 fill-[#38BDF8] text-[#38BDF8]" />
                <span className="font-mono font-semibold text-[#F8FAFC]">{tmdbScore}</span>
                <span className="text-[10px] text-[#858B9B]">TMDB ({activeItem.voteCount.toLocaleString()} votes)</span>
              </div>

              {/* ASTREON Community Star Rating */}
              <div
                data-testid="modal-community-star-metric"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#191D2B] border border-[#272B3A]"
              >
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-mono font-semibold text-[#F8FAFC] tabular-nums">
                  {starStats.count > 0 ? `${starStats.formatted}/5` : communityStats.formatted}
                </span>
                <span className="text-[10px] text-[#858B9B] tabular-nums">
                  ASTREON Community{starStats.count > 0 ? ` (${starStats.count})` : ''}
                </span>
              </div>

              {activeItem.runtime ? (
                <span className="text-[#A1A1AA]">{runtime}</span>
              ) : activeItem.numberOfSeasons ? (
                <span className="text-[#A1A1AA]">
                  {activeItem.numberOfSeasons} Seasons ({activeItem.numberOfEpisodes || 0} Episodes)
                </span>
              ) : null}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {hasTrailer && onWatchTrailer && (
                <button
                  onClick={() => onWatchTrailer(activeItem)}
                  className="flex items-center justify-center gap-1.5 min-h-[42px] md:min-h-0 px-4 py-2 text-xs font-semibold rounded-lg bg-[#F8FAFC] text-[#080A12] hover:bg-white transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{t('detail.trailer')}</span>
                </button>
              )}

              {onToggleWatchlist && (
                <button
                  onClick={() => onToggleWatchlist(activeItem)}
                  className={`flex items-center justify-center gap-1.5 min-h-[42px] md:min-h-0 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    isWatchlisted
                      ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]'
                      : 'bg-[#191D2B] text-[#A1A1AA] hover:text-[#F8FAFC] border-[#272B3A]'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" fill={isWatchlisted ? 'currentColor' : 'none'} />
                  <span>{isWatchlisted ? t('hero.watchlisted') : t('hero.watchlist')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleShareTitle}
                data-testid="title-share-button"
                aria-label={`${t('detail.share')} ${activeItem.title}`}
                className={`flex items-center justify-center gap-1.5 min-h-[42px] md:min-h-0 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  shareFeedback !== 'idle'
                    ? 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/50'
                    : 'bg-[#191D2B] text-[#A1A1AA] hover:text-[#F8FAFC] border-[#272B3A]'
                }`}
              >
                {shareFeedback !== 'idle' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Share2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                )}
                <span>
                  {shareFeedback === 'shared'
                    ? t('detail.shared')
                    : shareFeedback === 'copied'
                      ? t('detail.linkCopied')
                      : t('detail.share')}
                </span>
              </button>

              {onToggleFavorite && (
                <button
                  onClick={() => onToggleFavorite(activeItem)}
                  className={`min-w-[42px] min-h-[42px] md:min-w-0 md:min-h-0 flex items-center justify-center p-2 rounded-lg border transition-colors cursor-pointer ${
                    isFavorite
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-[#191D2B] text-[#A1A1AA] hover:text-rose-400 border-[#272B3A]'
                  }`}
                  aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                >
                  <Heart className="w-4 h-4 md:w-3.5 md:h-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              )}

              {(onToggleCollectionItem || onCreateCollectionWithItem) && (
                <div className="relative">
                  <button
                    type="button"
                    data-testid="save-to-collection-btn"
                    onClick={() => {
                      if (!currentUser) {
                        onOpenAuth();
                        return;
                      }
                      setCollectionMenuOpen((prev) => !prev);
                    }}
                    className={`flex items-center justify-center gap-1.5 min-h-[42px] md:min-h-0 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      collectionMenuOpen
                        ? 'bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/50'
                        : 'bg-[#191D2B] text-[#A1A1AA] hover:text-[#F8FAFC] border-[#272B3A]'
                    }`}
                  >
                    <ListPlus className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>{t('detail.saveToCollection')}</span>
                  </button>

                  {collectionMenuOpen && currentUser && (
                    <div
                      data-testid="save-to-collection-popover"
                      className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-64 max-w-[calc(100vw-2.5rem)] rounded-xl bg-[#080A12] border border-[#272B3A] shadow-2xl p-3 z-40 space-y-2.5 animate-in fade-in duration-150"
                    >
                      {customCollections.length > 0 && (
                        <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                          {customCollections.map((col) => {
                            const saved = isItemInCollection(col, activeItem.id, activeItem.mediaType);
                            return (
                              <button
                                key={col.id}
                                type="button"
                                onClick={() => onToggleCollectionItem?.(col.id, activeItem)}
                                className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-xs hover:bg-[#191D2B] transition-colors cursor-pointer"
                              >
                                <span className="text-[#F8FAFC] truncate">{col.name}</span>
                                <span
                                  className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                                    saved
                                      ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white'
                                      : 'border-[#272B3A] text-transparent'
                                  }`}
                                >
                                  <Check className="w-3 h-3" />
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {onCreateCollectionWithItem && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const trimmed = newCollectionName.trim();
                            if (!trimmed) return;
                            onCreateCollectionWithItem(trimmed, activeItem);
                            setNewCollectionName('');
                          }}
                          className="pt-2 border-t border-[#272B3A] space-y-2"
                        >
                          <input
                            type="text"
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            placeholder={t('detail.newCollectionPlaceholder')}
                            maxLength={80}
                            className="w-full bg-[#111421] text-[#F8FAFC] placeholder-[#858B9B] border border-[#272B3A] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#8B5CF6]"
                          />
                          <button
                            type="submit"
                            className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-medium transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t('detail.createAndAdd')}</span>
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Shareable Deep-Link Strip (shown on desktop / clipboard fallback) */}
          {shareFallbackUrl && (
            <div
              data-testid="share-fallback-bar"
              className="flex flex-col sm:flex-row sm:items-center gap-2.5 p-3 rounded-xl bg-[#080A12] border border-[#272B3A] animate-in fade-in duration-150"
            >
              <div className="flex items-center gap-2 text-xs text-[#38BDF8] shrink-0">
                <Link2 className="w-3.5 h-3.5" />
                <span className="font-medium">{t('detail.shareUrlLabel')}</span>
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="text"
                  readOnly
                  value={shareFallbackUrl}
                  data-testid="share-deeplink-input"
                  aria-label={t('detail.shareUrlLabel')}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-[#111421] border border-[#272B3A] text-[11px] font-mono text-[#F8FAFC] focus:outline-none focus:border-[#38BDF8]"
                />
                <button
                  type="button"
                  onClick={handleCopyFallbackLink}
                  data-testid="copy-deeplink-button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#191D2B] hover:bg-[#272B3A] border border-[#272B3A] text-xs font-medium text-[#F8FAFC] transition-colors cursor-pointer shrink-0"
                >
                  {shareFeedback === 'copied' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t('detail.linkCopied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>{t('detail.copyLink')}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShareFallbackUrl(null)}
                  aria-label="Dismiss share link"
                  className="p-1.5 rounded-lg text-[#858B9B] hover:text-[#F8FAFC] hover:bg-[#191D2B] transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Interactive 1–5 Star User Rating Component */}
          <StarRatingWidget
            mediaId={activeItem.id}
            mediaTitle={activeItem.title}
            currentUser={currentUser}
            existingReview={existingUserReview}
            communityStats={starStats}
            onOpenAuth={onOpenAuth}
            onSubmitRating={handleStarRatingSubmit}
          />

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar border-b border-[#272B3A] text-xs font-medium text-[#858B9B]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`min-h-[40px] md:min-h-0 pb-2.5 px-1 border-b-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'overview' ? 'border-[#8B5CF6] text-[#F8FAFC]' : 'border-transparent hover:text-[#A1A1AA]'
              }`}
            >
              {t('detail.tabOverview')}
            </button>
            {activeItem.mediaType === 'tv' && (
              <button
                onClick={() => setActiveTab('seasons')}
                data-testid="detail-tab-seasons"
                className={`min-h-[40px] md:min-h-0 pb-2.5 px-1 border-b-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeTab === 'seasons' ? 'border-[#8B5CF6] text-[#F8FAFC]' : 'border-transparent hover:text-[#A1A1AA]'
                }`}
              >
                {t('detail.tabSeasons')} ({activeItem.numberOfSeasons || 1})
              </button>
            )}
            <button
              onClick={() => setActiveTab('cast')}
              className={`min-h-[40px] md:min-h-0 pb-2.5 px-1 border-b-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'cast' ? 'border-[#8B5CF6] text-[#F8FAFC]' : 'border-transparent hover:text-[#A1A1AA]'
              }`}
            >
              {t('detail.tabCast')} ({activeItem.cast?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`min-h-[40px] md:min-h-0 pb-2.5 px-1 border-b-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === 'reviews' ? 'border-[#8B5CF6] text-[#F8FAFC]' : 'border-transparent hover:text-[#A1A1AA]'
              }`}
            >
              {t('detail.tabReviews')} ({sortedReviews.length})
            </button>
          </div>

          {/* TAB 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs uppercase font-semibold text-[#858B9B] tracking-wider mb-2">
                  {t('detail.synopsis')}
                </h3>
                <p className="text-sm text-[#F8FAFC] leading-relaxed">
                  {activeItem.overview || 'Synopsis unavailable.'}
                </p>
              </div>

              {/* Genres */}
              {activeItem.genres && activeItem.genres.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase font-semibold text-[#858B9B] tracking-wider mb-2">
                    {t('detail.genres')}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs text-[#A1A1AA]">
                    {activeItem.genres.map((g, idx) => (
                      <span key={g}>
                        {tGenre(g)}
                        {idx < activeItem.genres.length - 1 && <span className="ml-2 text-[#272B3A]">·</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Legitimate Watch Providers (Grouped with Logos, Search URLs & Region Selector) */}
              {((activeItem.providers && activeItem.providers.length > 0) || onRegionChange) && (
                <div className="p-4 rounded-xl bg-[#080A12] border border-[#272B3A] space-y-3" data-testid="viewing-options-panel">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-semibold text-[#38BDF8] uppercase tracking-wider">
                        {t('detail.viewingOptions')}
                      </h3>
                      <p className="text-xs text-[#858B9B] mt-0.5">
                        {t('detail.viewingSub')}
                        {activeItem.providerRegion ? ` (${activeItem.providerRegion})` : ''}
                      </p>
                    </div>
                    {onRegionChange && (
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <label htmlFor="detail-watch-region" className="text-[11px] text-[#858B9B]">
                          {t('detail.regionLabel')}:
                        </label>
                        <select
                          id="detail-watch-region"
                          data-testid="detail-region-select"
                          value={watchRegion}
                          onChange={(e) => onRegionChange(e.target.value)}
                          className="bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A] rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#38BDF8] cursor-pointer"
                        >
                          {SUPPORTED_PROVIDER_REGIONS.map((reg) => (
                            <option key={reg.code} value={reg.code}>
                              {reg.code} · {reg.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {providerGroups.length > 0 ? (
                    <div className="space-y-3">
                      {providerGroups.map((group) => {
                        const groupTitleKey =
                          group.key === 'stream'
                            ? 'detail.groupStream'
                            : group.key === 'free'
                              ? 'detail.groupFree'
                              : group.key === 'rent'
                                ? 'detail.groupRent'
                                : 'detail.groupBuy';
                        return (
                          <div key={group.key} className="space-y-1.5">
                            <p className="text-[11px] font-mono uppercase tracking-wider text-[#858B9B]">
                              {t(groupTitleKey)}
                            </p>
                            <div className="flex flex-wrap gap-2.5">
                              {group.providers.map((p, idx) => {
                                const providerHref = buildProviderSearchOrWatchUrl(
                                  p,
                                  activeItem.title,
                                  activeItem.mediaType,
                                  activeItem.id,
                                  undefined,
                                  watchRegion
                                );
                                return (
                                  <a
                                    key={`${p.providerId}-${p.providerName}-${idx}`}
                                    href={providerHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    data-testid={`watch-provider-link-${p.providerId}`}
                                    className="inline-flex items-center gap-2 min-h-[38px] md:min-h-0 px-3 py-1.5 rounded-lg bg-[#191D2B] hover:bg-[#272B3A] border border-[#272B3A] hover:border-[#38BDF8]/50 text-xs text-[#F8FAFC] transition-colors"
                                  >
                                    {p.logoPath && !failedProviderLogos[p.providerId] && (
                                      <img
                                        src={p.logoPath}
                                        alt=""
                                        loading="lazy"
                                        referrerPolicy="no-referrer"
                                        onError={() =>
                                          setFailedProviderLogos((prev) => ({
                                            ...prev,
                                            [p.providerId]: true
                                          }))
                                        }
                                        className="w-5 h-5 rounded object-cover shrink-0"
                                      />
                                    )}
                                    <span className="font-medium">{p.providerName}</span>
                                    <ExternalLink className="w-3 h-3 text-[#38BDF8] shrink-0" />
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-[#858B9B]">
                      {t('detail.providersUnavailable')}
                    </p>
                  )}
                </div>
              )}

              {/* More Like This (Similar Titles) */}
              {similarTitles.length > 0 && (
                <div className="pt-2 border-t border-[#272B3A]">
                  <h3 className="text-xs uppercase font-semibold text-[#858B9B] tracking-wider mb-3">
                    {t('detail.moreLikeThis')}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {similarTitles.map((sim) => {
                      const simKey = `${sim.mediaType}-${sim.id}`;
                      return (
                      <button
                        key={simKey}
                        type="button"
                        onClick={() => onSelectSimilar?.(sim)}
                        className="group text-left rounded-xl bg-[#080A12] border border-[#272B3A] hover:border-[#8B5CF6]/50 overflow-hidden transition-all cursor-pointer"
                      >
                        <div className="aspect-[16/10] bg-[#191D2B] overflow-hidden flex items-center justify-center">
                          {(sim.backdropPath || sim.posterPath) && !failedSimilarImages[simKey] ? (
                            <img
                              src={sim.backdropPath || sim.posterPath}
                              alt={sim.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={() =>
                                setFailedSimilarImages((prev) => ({ ...prev, [simKey]: true }))
                              }
                            />
                          ) : (
                            <span className="text-[11px] font-medium text-[#858B9B] px-2 text-center line-clamp-2">
                              {sim.title}
                            </span>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#38BDF8] truncate">
                            {sim.title}
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-[#858B9B] mt-0.5">
                            <span>{formatReleaseYear(sim.releaseDate || sim.firstAirDate)}</span>
                            <span className="font-mono text-[#38BDF8]">{formatRating(sim.voteAverage)}</span>
                          </div>
                        </div>
                      </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 1.5: TV Seasons & Episodes */}
          {activeTab === 'seasons' && activeItem.mediaType === 'tv' && (
            <div className="space-y-4" data-testid="tv-seasons-panel">
              <div className="flex flex-wrap items-center gap-2">
                {Array.from(
                  { length: Math.max(activeItem.numberOfSeasons || 1, 1) },
                  (_, idx) => idx + 1
                ).map((seasonNum) => (
                  <button
                    key={seasonNum}
                    type="button"
                    data-testid={`season-selector-${seasonNum}`}
                    onClick={() => setSelectedSeason(seasonNum)}
                    className={`min-h-[38px] md:min-h-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      selectedSeason === seasonNum
                        ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]'
                        : 'bg-[#080A12] text-[#A1A1AA] border-[#272B3A] hover:text-[#F8FAFC]'
                    }`}
                  >
                    {t('detail.seasonLabel', { number: seasonNum })}
                  </button>
                ))}
              </div>

              {loadingSeason ? (
                <div className="flex items-center gap-2 py-8 text-xs text-[#858B9B]">
                  <Loader2 className="w-4 h-4 animate-spin text-[#38BDF8]" />
                  <span>{t('catalog.loadingMore')}</span>
                </div>
              ) : seasonDetails && seasonDetails.episodes.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#858B9B]">
                    <span className="font-semibold text-[#F8FAFC]">{seasonDetails.name}</span>
                    <span className="font-mono">
                      {t('detail.episodesCount', { count: seasonDetails.episodes.length })}
                    </span>
                  </div>
                  {seasonDetails.overview && (
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">{seasonDetails.overview}</p>
                  )}
                  <div className="space-y-2.5">
                    {seasonDetails.episodes.map((ep) => (
                      <div
                        key={ep.id}
                        data-testid={`episode-row-${ep.episodeNumber}`}
                        className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl bg-[#080A12] border border-[#272B3A]"
                      >
                        <div className="w-full sm:w-40 aspect-video rounded-lg bg-[#191D2B] overflow-hidden flex items-center justify-center shrink-0">
                          {ep.stillPath && !failedEpisodeStills[ep.id] ? (
                            <img
                              src={ep.stillPath}
                              alt={ep.name}
                              loading="lazy"
                              decoding="async"
                              referrerPolicy="no-referrer"
                              onError={() =>
                                setFailedEpisodeStills((prev) => ({ ...prev, [ep.id]: true }))
                              }
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Tv className="w-6 h-6 text-[#38BDF8] opacity-60" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-semibold text-[#F8FAFC]">
                              <span className="font-mono text-[#38BDF8] mr-1.5">
                                {t('detail.episodeLabel', { number: ep.episodeNumber })}
                              </span>
                              {ep.name}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] font-mono text-[#858B9B]">
                              {ep.airDate && <span>{formatDate(ep.airDate)}</span>}
                              {ep.runtime ? <span>· {formatRuntime(ep.runtime)}</span> : null}
                            </div>
                          </div>
                          {ep.overview && (
                            <p className="text-xs text-[#A1A1AA] leading-relaxed line-clamp-3">
                              {ep.overview}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#858B9B] py-4">{t('detail.noEpisodes')}</p>
              )}
            </div>
          )}

          {/* TAB 2: Cast & Production */}
          {activeTab === 'cast' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs uppercase font-semibold text-[#858B9B] tracking-wider mb-3">
                  {t('detail.featuredCast')}
                </h3>
                {activeItem.cast && activeItem.cast.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activeItem.cast.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        data-testid={`cast-member-btn-${c.id}`}
                        title={t('detail.viewPersonBio')}
                        onClick={() =>
                          onSelectPerson?.({
                            id: c.id,
                            name: c.name,
                            profilePath: c.profilePath || undefined
                          })
                        }
                        className="text-left p-3 rounded-xl bg-[#080A12] border border-[#272B3A] hover:border-[#38BDF8]/60 hover:bg-[#191D2B]/70 flex items-center gap-3 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#191D2B] flex items-center justify-center text-xs font-semibold text-[#38BDF8] shrink-0 overflow-hidden">
                          {c.profilePath && !failedCastImages[c.id] ? (
                            <img
                              src={c.profilePath}
                              alt={c.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={() =>
                                setFailedCastImages((prev) => ({ ...prev, [c.id]: true }))
                              }
                            />
                          ) : (
                            c.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#38BDF8] truncate">
                            {c.name}
                          </p>
                          <p className="text-[11px] text-[#858B9B] truncate">{c.character}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#858B9B]">{t('detail.castUnavailable')}</p>
                )}
              </div>

              {activeItem.crew && activeItem.crew.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase font-semibold text-[#858B9B] tracking-wider mb-3">
                    {t('detail.keyCrew')}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activeItem.crew.map((cr) => (
                      <button
                        key={`${cr.id}-${cr.job}`}
                        type="button"
                        data-testid={`crew-member-btn-${cr.id}`}
                        title={t('detail.viewPersonBio')}
                        onClick={() => onSelectPerson?.({ id: cr.id, name: cr.name })}
                        className="text-left p-3 rounded-xl bg-[#080A12] border border-[#272B3A] hover:border-[#38BDF8]/60 hover:bg-[#191D2B]/70 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                      >
                        <p className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#38BDF8]">
                          {cr.name}
                        </p>
                        <p className="text-[11px] text-[#858B9B]">{cr.job} ({cr.department})</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Community Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Review Submission Form */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#080A12] border border-[#272B3A] space-y-4">
                <h3 className="text-sm font-display font-semibold text-[#F8FAFC]">
                  {t('detail.writeReview')}
                </h3>

                {currentUser ? (
                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs text-[#A1A1AA]">Your Star Rating:</span>
                      <div className="flex items-center gap-1" role="group" aria-label="Select 1 to 5 stars for review">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setUserStars(n)}
                            aria-label={`Select ${n} out of 5 stars`}
                            aria-pressed={userStars === n}
                            className="p-1.5 rounded-lg hover:bg-[#191D2B] transition-colors cursor-pointer"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                n <= userStars ? 'text-amber-400 fill-amber-400' : 'text-[#475569]'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-mono font-semibold text-amber-400 tabular-nums">
                        {userStars}/5
                      </span>
                    </div>

                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your analytical critique, impressions of cinematography, narrative pace, and sound design..."
                      rows={3}
                      className="w-full bg-[#191D2B] text-[#F8FAFC] placeholder-[#858B9B] border border-[#272B3A] rounded-xl p-3 text-xs focus:outline-none focus:border-[#8B5CF6]"
                    />

                    {reviewError && (
                      <p className="text-xs text-rose-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{reviewError}</span>
                      </p>
                    )}

                    {reviewSuccess && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>{reviewSuccess}</span>
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-[#858B9B]">
                        {reviewText.length}/2000 characters
                      </span>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-4 py-1.5 text-xs font-medium text-white bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                      >
                        {submittingReview ? 'Publishing...' : t('detail.submitReview')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#191D2B] text-xs">
                    <span className="text-[#A1A1AA]">
                      {t('detail.signInToReview')}
                    </span>
                    <button
                      onClick={onOpenAuth}
                      className="px-3 py-1 rounded-md bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors cursor-pointer shrink-0"
                    >
                      {t('nav.signIn')}
                    </button>
                  </div>
                )}
              </div>

              {/* Reviews Sort & Count Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase font-semibold text-[#858B9B] tracking-wider">
                  {t('detail.memberCritiques')} ({sortedReviews.length})
                </h4>
                <select
                  aria-label="Sort community reviews"
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value as ReviewSortOption)}
                  className="bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A] rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-[#8B5CF6] cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="helpful">Most Helpful</option>
                  <option value="rating_desc">Highest Rated</option>
                </select>
              </div>

              {/* Existing Reviews List */}
              {reportNotice && (
                <p className="text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{reportNotice}</span>
                </p>
              )}
              <div className="space-y-3">
                {loadingReviews ? (
                  <p className="text-xs text-[#858B9B]">Loading reviews...</p>
                ) : sortedReviews.length > 0 ? (
                  sortedReviews.map((r) => {
                    const isOwn = currentUser?.uid === r.userId;
                    const isEditing = editingReviewId === r.id;
                    const hasVoted = helpfulVotedIds.includes(r.id);

                    return (
                      <div
                        key={r.id}
                        className="p-4 rounded-xl bg-[#080A12] border border-[#272B3A] space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-md bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-xs font-bold text-[#38BDF8] shrink-0">
                              {r.userName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-[#F8FAFC] truncate">{r.userName}</span>
                            <span className="text-[11px] text-[#858B9B] shrink-0">
                              {formatDate(r.createdAt)}
                              {r.updatedAt ? ' (edited)' : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-amber-400 tabular-nums">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{getReviewStarValue(r).toFixed(1)}/5</span>
                            </span>

                            {isOwn && !isEditing && (
                              <>
                                <button
                                  onClick={() => handleStartEdit(r)}
                                  className="p-1 text-[#858B9B] hover:text-[#38BDF8] transition-colors cursor-pointer"
                                  title="Edit review"
                                  aria-label="Edit your review"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteReview(r.id)}
                                  className="p-1 text-[#858B9B] hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Delete review"
                                  aria-label="Delete your review"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {!isOwn && (
                              <button
                                onClick={() => handleReport(r.id)}
                                disabled={reportedIds.includes(r.id)}
                                className="p-1 text-[#858B9B] hover:text-amber-400 disabled:text-[#272B3A] transition-colors cursor-pointer"
                                title="Report review"
                                aria-label={`Report review by ${r.userName}`}
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2.5 pt-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-[#A1A1AA]">Stars:</span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setEditStars(n)}
                                    aria-label={`Set ${n} out of 5 stars`}
                                    className="p-1 rounded hover:bg-[#191D2B] cursor-pointer"
                                  >
                                    <Star
                                      className={`w-4 h-4 ${
                                        n <= editStars ? 'text-amber-400 fill-amber-400' : 'text-[#475569]'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                              <span className="font-mono text-amber-400 tabular-nums">{editStars}/5</span>
                            </div>
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={3}
                              className="w-full bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#8B5CF6]"
                            />
                            {editError && (
                              <p className="text-xs text-rose-400 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{editError}</span>
                              </p>
                            )}
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingReviewId(null);
                                  setEditError('');
                                }}
                                className="px-3 py-1 text-xs text-[#A1A1AA] hover:text-[#F8FAFC] rounded-lg bg-[#191D2B] cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={savingEdit}
                                onClick={() => handleSaveEdit(r)}
                                className="px-3 py-1 text-xs font-medium text-white bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-lg cursor-pointer"
                              >
                                {savingEdit ? 'Saving...' : 'Save Changes'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {r.reviewText ? (
                              <p className="text-xs text-[#A1A1AA] leading-relaxed">{r.reviewText}</p>
                            ) : (
                              <p className="text-xs text-[#858B9B] italic">Submitted star rating</p>
                            )}
                            <div className="flex items-center justify-end pt-1">
                              <button
                                onClick={() => handleToggleHelpful(r)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition-colors cursor-pointer ${
                                  hasVoted
                                    ? 'bg-[#38BDF8]/15 border-[#38BDF8]/40 text-[#38BDF8]'
                                    : 'bg-[#111421] border-[#272B3A] text-[#858B9B] hover:text-[#F8FAFC]'
                                }`}
                              >
                                <ThumbsUp className="w-3 h-3" />
                                <span>{t('detail.helpful')} ({r.helpfulCount || 0})</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-[#858B9B]">{t('detail.noReviews')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
