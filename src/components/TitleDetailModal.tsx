import React, { useState, useEffect } from 'react';
import { MediaItem, UserProfile, UserReview } from '../types/entertainment';
import { formatRating, formatReleaseYear, formatRuntime, calculateCommunityRating } from '../utils/entertainment';
import { getReviews, submitReview, submitContentReport } from '../services/api';
import { X, Star, Bookmark, Heart, Play, ExternalLink, Flag, MessageSquare, Check, AlertCircle } from 'lucide-react';

interface TitleDetailModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onWatchTrailer?: (item: MediaItem) => void;
  isWatchlisted?: boolean;
  isFavorite?: boolean;
  onToggleWatchlist?: (item: MediaItem) => void;
  onToggleFavorite?: (item: MediaItem) => void;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onSelectSimilar?: (item: MediaItem) => void;
}

export const TitleDetailModal: React.FC<TitleDetailModalProps> = ({
  item,
  onClose,
  onWatchTrailer,
  isWatchlisted = false,
  isFavorite = false,
  onToggleWatchlist,
  onToggleFavorite,
  currentUser,
  onOpenAuth,
}) => {
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [userRating, setUserRating] = useState<number>(8);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reportedIds, setReportedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'cast' | 'reviews'>('overview');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!item) return;
    let mounted = true;
    setLoadingReviews(true);
    getReviews(item.id).then((res) => {
      if (mounted) {
        setReviews(res);
        setLoadingReviews(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [item?.id]);

  if (!item) return null;

  const year = formatReleaseYear(item.releaseDate || item.firstAirDate);
  const tmdbScore = formatRating(item.voteAverage);
  const runtime = formatRuntime(item.runtime);
  const communityStats = calculateCommunityRating(reviews);
  const hasTrailer = item.videos && item.videos.some((v) => v.site === 'YouTube' && v.key);

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
      mediaId: item.id,
      mediaType: item.mediaType,
      rating: userRating,
      reviewText: reviewText.trim()
    });

    setSubmittingReview(false);
    if (res) {
      setReviewSuccess('Your review has been published to the ASTREON community.');
      setReviewText('');
      setReviews((prev) => [res, ...prev.filter((r) => r.id !== res.id)]);
    } else {
      setReviewError('Failed to submit review. Please try again.');
    }
  };

  const handleReport = async (reviewId: string) => {
    if (reportedIds.includes(reviewId)) return;
    await submitContentReport({
      targetType: 'review',
      targetId: reviewId,
      reason: 'User flagged community review for moderation audit',
      reporterId: currentUser?.uid
    });
    setReportedIds((prev) => [...prev, reviewId]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="title-detail-heading"
    >
      <div
        className="relative w-full max-w-4xl bg-[#111421] border border-[#272B3A] rounded-2xl overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero Backdrop Header with Close Button */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-[#080A12]">
          <img
            src={item.backdropPath || item.posterPath}
            alt={item.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111421] via-[#111421]/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-[#080A12]/80 hover:bg-[#080A12] text-[#A1A1AA] hover:text-[#F8FAFC] border border-[#272B3A] transition-colors cursor-pointer"
            aria-label="Close detail modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Backdrop Floating Metadata */}
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#38BDF8] mb-1">
                <span>{item.mediaType === 'movie' ? 'Film' : 'Television'}</span>
                <span>·</span>
                <span>{year}</span>
              </div>
              <h1 id="title-detail-heading" className="text-2xl sm:text-4xl font-display font-bold text-[#F8FAFC] tracking-tight">
                {item.title}
              </h1>
              {item.tagline && (
                <p className="text-xs sm:text-sm text-[#A1A1AA] italic mt-1 max-w-xl">
                  "{item.tagline}"
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Quick Metrics Bar & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#272B3A]">
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
              {/* TMDB Source Rating */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#191D2B] border border-[#272B3A]">
                <Star className="w-3.5 h-3.5 fill-[#38BDF8] text-[#38BDF8]" />
                <span className="font-mono font-semibold text-[#F8FAFC]">{tmdbScore}</span>
                <span className="text-[10px] text-[#858B9B]">TMDB ({item.voteCount.toLocaleString()} votes)</span>
              </div>

              {/* ASTREON Community Rating */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#191D2B] border border-[#272B3A]">
                <MessageSquare className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span className="font-mono font-semibold text-[#F8FAFC]">{communityStats.formatted}</span>
                <span className="text-[10px] text-[#858B9B]">ASTREON Community</span>
              </div>

              {item.runtime ? (
                <span className="text-[#A1A1AA]">{runtime}</span>
              ) : item.numberOfSeasons ? (
                <span className="text-[#A1A1AA]">
                  {item.numberOfSeasons} Seasons ({item.numberOfEpisodes || 0} Episodes)
                </span>
              ) : null}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {hasTrailer && onWatchTrailer && (
                <button
                  onClick={() => onWatchTrailer(item)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#F8FAFC] text-[#080A12] hover:bg-white transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Trailer</span>
                </button>
              )}

              {onToggleWatchlist && (
                <button
                  onClick={() => onToggleWatchlist(item)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                    isWatchlisted
                      ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]'
                      : 'bg-[#191D2B] text-[#A1A1AA] hover:text-[#F8FAFC] border-[#272B3A]'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" fill={isWatchlisted ? 'currentColor' : 'none'} />
                  <span>{isWatchlisted ? 'Watchlisted' : 'Watchlist'}</span>
                </button>
              )}

              {onToggleFavorite && (
                <button
                  onClick={() => onToggleFavorite(item)}
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    isFavorite
                      ? 'bg-rose-600 text-white border-rose-500'
                      : 'bg-[#191D2B] text-[#A1A1AA] hover:text-rose-400 border-[#272B3A]'
                  }`}
                  aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                >
                  <Heart className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              )}
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-[#272B3A] text-xs font-medium text-[#858B9B]">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'overview' ? 'border-[#8B5CF6] text-[#F8FAFC]' : 'border-transparent hover:text-[#A1A1AA]'
              }`}
            >
              Overview & Context
            </button>
            <button
              onClick={() => setActiveTab('cast')}
              className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'cast' ? 'border-[#8B5CF6] text-[#F8FAFC]' : 'border-transparent hover:text-[#A1A1AA]'
              }`}
            >
              Cast & Production ({item.cast?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-2.5 px-1 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'reviews' ? 'border-[#8B5CF6] text-[#F8FAFC]' : 'border-transparent hover:text-[#A1A1AA]'
              }`}
            >
              Community Reviews ({reviews.length})
            </button>
          </div>

          {/* TAB 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs uppercase font-semibold text-[#858B9B] tracking-wider mb-2">
                  Synopsis
                </h3>
                <p className="text-sm text-[#F8FAFC] leading-relaxed">
                  {item.overview || 'Synopsis unavailable.'}
                </p>
              </div>

              {/* Genres */}
              {item.genres && item.genres.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase font-semibold text-[#858B9B] tracking-wider mb-2">
                    Genres
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs text-[#A1A1AA]">
                    {item.genres.map((g, idx) => (
                      <span key={g}>
                        {g}
                        {idx < item.genres.length - 1 && <span className="ml-2 text-[#272B3A]">·</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Legitimate Watch Providers */}
              {item.providers && item.providers.length > 0 && (
                <div className="p-4 rounded-xl bg-[#080A12] border border-[#272B3A]">
                  <h3 className="text-xs font-semibold text-[#38BDF8] uppercase tracking-wider mb-2">
                    Legitimate Viewing Options
                  </h3>
                  <p className="text-xs text-[#858B9B] mb-3">
                    Available on licensed platforms in verified territories:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {item.providers.map((p) => (
                      <a
                        key={p.providerId}
                        href={p.link || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#191D2B] hover:bg-[#272B3A] border border-[#272B3A] text-xs text-[#F8FAFC] transition-colors"
                      >
                        <span className="font-medium">{p.providerName}</span>
                        <ExternalLink className="w-3 h-3 text-[#858B9B]" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Cast & Production */}
          {activeTab === 'cast' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs uppercase font-semibold text-[#858B9B] tracking-wider mb-3">
                  Featured Cast
                </h3>
                {item.cast && item.cast.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {item.cast.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-[#080A12] border border-[#272B3A] flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#191D2B] flex items-center justify-center text-xs font-semibold text-[#38BDF8] shrink-0 overflow-hidden">
                          {c.profilePath ? (
                            <img
                              src={c.profilePath}
                              alt={c.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            c.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#F8FAFC] truncate">{c.name}</p>
                          <p className="text-[11px] text-[#858B9B] truncate">{c.character}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#858B9B]">Cast information unavailable.</p>
                )}
              </div>

              {item.crew && item.crew.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase font-semibold text-[#858B9B] tracking-wider mb-3">
                    Key Crew
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {item.crew.map((cr) => (
                      <div key={cr.id} className="p-3 rounded-xl bg-[#080A12] border border-[#272B3A]">
                        <p className="text-xs font-semibold text-[#F8FAFC]">{cr.name}</p>
                        <p className="text-[11px] text-[#858B9B]">{cr.job} ({cr.department})</p>
                      </div>
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
                  Write an ASTREON Community Review
                </h3>

                {currentUser ? (
                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    <div className="flex items-center gap-4">
                      <label htmlFor="user-rating-select" className="text-xs text-[#A1A1AA]">
                        Your Score (1 to 10):
                      </label>
                      <select
                        id="user-rating-select"
                        value={userRating}
                        onChange={(e) => setUserRating(Number(e.target.value))}
                        className="bg-[#191D2B] text-[#F8FAFC] border border-[#272B3A] rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-[#8B5CF6]"
                      >
                        {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n}/10
                          </option>
                        ))}
                      </select>
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
                        {submittingReview ? 'Publishing...' : 'Submit Review'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[#191D2B] text-xs">
                    <span className="text-[#A1A1AA]">
                      Join ASTREON or sign in to contribute personal ratings and reviews.
                    </span>
                    <button
                      onClick={onOpenAuth}
                      className="px-3 py-1 rounded-md bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                )}
              </div>

              {/* Existing Reviews List */}
              <div className="space-y-3">
                {loadingReviews ? (
                  <p className="text-xs text-[#858B9B]">Loading reviews...</p>
                ) : reviews.length > 0 ? (
                  reviews.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl bg-[#080A12] border border-[#272B3A] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center text-xs font-bold text-[#38BDF8]">
                            {r.userName.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-semibold text-[#F8FAFC]">{r.userName}</span>
                          <span className="text-[11px] text-[#858B9B]">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-semibold text-[#38BDF8] px-2 py-0.5 rounded bg-[#191D2B]">
                            {r.rating}/10
                          </span>
                          <button
                            onClick={() => handleReport(r.id)}
                            disabled={reportedIds.includes(r.id)}
                            className="p-1 text-[#858B9B] hover:text-amber-400 disabled:text-[#272B3A] transition-colors cursor-pointer"
                            title="Report review"
                            aria-label={`Report review by ${r.userName}`}
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-[#A1A1AA] leading-relaxed">{r.reviewText}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#858B9B]">No community reviews yet. Be the first to review!</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
