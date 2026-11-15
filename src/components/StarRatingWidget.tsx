import React, { useState, useEffect } from 'react';
import { Star, Check, AlertCircle, Loader2 } from 'lucide-react';
import type { UserProfile, UserReview } from '../types/entertainment';
import type { MediaStarStats } from '../utils/ratings';
import { getReviewStarValue } from '../utils/ratings';
import { useI18n } from '../contexts/I18nContext';

interface StarRatingWidgetProps {
  mediaId: number;
  mediaTitle: string;
  currentUser: UserProfile | null;
  existingReview: UserReview | null;
  communityStats: MediaStarStats;
  onOpenAuth: () => void;
  onSubmitRating: (stars: number, note: string) => Promise<boolean>;
}

const STAR_LABELS: Record<number, string> = {
  1: '1/5',
  2: '2/5',
  3: '3/5',
  4: '4/5',
  5: '5/5'
};

export const StarRatingWidget: React.FC<StarRatingWidgetProps> = ({
  mediaId,
  mediaTitle,
  currentUser,
  existingReview,
  communityStats,
  onOpenAuth,
  onSubmitRating
}) => {
  const { t } = useI18n();
  const existingStars = existingReview
    ? Math.min(5, Math.max(1, Math.round(getReviewStarValue(existingReview))))
    : 0;

  const [selectedStars, setSelectedStars] = useState<number>(existingStars);
  const [hoverStars, setHoverStars] = useState<number>(0);
  const [note, setNote] = useState<string>(existingReview?.reviewText || '');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setSelectedStars(existingStars);
    setNote(existingReview?.reviewText || '');
    setHoverStars(0);
    setFeedback(null);
  }, [mediaId, existingReview?.id, existingStars, existingReview?.reviewText]);

  const activeStars = hoverStars || selectedStars;

  const handleStarClick = (starValue: number) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setSelectedStars(starValue);
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (selectedStars < 1 || selectedStars > 5) {
      setFeedback({ type: 'error', text: t('detail.selectStarPrompt') });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    const ok = await onSubmitRating(selectedStars, note.trim());
    setSubmitting(false);

    if (ok) {
      setFeedback({
        type: 'success',
        text: t('detail.ratingSaved', { stars: selectedStars })
      });
    } else {
      setFeedback({
        type: 'error',
        text: t('detail.ratingError')
      });
    }
  };

  return (
    <section
      data-testid="star-rating-widget"
      aria-label={t('detail.rateThisTitle')}
      className="p-4 sm:p-5 rounded-xl bg-[#080A12] border border-[#272B3A] space-y-3.5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="text-xs font-semibold text-[#F8FAFC] uppercase tracking-wider">
            {t('detail.rateThisTitle')}
          </h3>
          <div className="flex items-center gap-2 text-xs text-[#858B9B]">
            <span className="inline-flex items-center gap-1 font-mono font-semibold text-amber-400 tabular-nums">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{communityStats.count > 0 ? `${communityStats.formatted}/5` : 'NR'}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {communityStats.count > 0
                ? t('detail.communityRatingCount', { count: communityStats.count })
                : t('detail.noRatingsYet')}
            </span>
          </div>
        </div>

        {currentUser && existingStars > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <Check className="w-3.5 h-3.5" />
            <span className="tabular-nums">
              {t('detail.yourRating', { stars: existingStars })}
            </span>
          </div>
        )}
      </div>

      {currentUser ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="group"
              aria-label={`Rate ${mediaTitle} from 1 to 5 stars`}
              onMouseLeave={() => setHoverStars(0)}
              className="flex items-center gap-1"
            >
              {[1, 2, 3, 4, 5].map((starValue) => {
                const isFilled = starValue <= activeStars;
                return (
                  <button
                    key={starValue}
                    type="button"
                    data-testid={`star-rating-btn-${starValue}`}
                    aria-label={`Rate ${starValue} out of 5 stars`}
                    aria-pressed={selectedStars === starValue}
                    onMouseEnter={() => setHoverStars(starValue)}
                    onFocus={() => setHoverStars(starValue)}
                    onBlur={() => setHoverStars(0)}
                    onClick={() => handleStarClick(starValue)}
                    className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-[#191D2B] transition-transform duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors duration-150 ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-[#475569] hover:text-amber-300'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <span
              className={`text-xs font-mono tabular-nums ${
                activeStars > 0 ? 'text-amber-400 font-semibold' : 'text-[#858B9B]'
              }`}
            >
              {activeStars > 0 ? STAR_LABELS[activeStars] : t('detail.selectStarPrompt')}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
              aria-label={t('detail.ratingNoteLabel')}
              placeholder={t('detail.ratingNotePlaceholder')}
              data-testid="star-rating-note-input"
              className="flex-1 min-h-[40px] bg-[#191D2B] text-[#F8FAFC] placeholder-[#858B9B] border border-[#272B3A] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#38BDF8]"
            />
            <button
              type="submit"
              disabled={submitting || selectedStars < 1}
              data-testid="submit-star-rating-btn"
              className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {submitting
                  ? t('detail.savingRating')
                  : existingReview
                    ? t('detail.updateRating')
                    : t('detail.submitRating')}
              </span>
            </button>
          </div>

          {feedback && (
            <p
              role={feedback.type === 'error' ? 'alert' : 'status'}
              data-testid="star-rating-feedback"
              className={`text-xs flex items-center gap-1.5 ${
                feedback.type === 'error' ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {feedback.type === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Check className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{feedback.text}</span>
            </p>
          )}
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div
            role="group"
            aria-label={`Sign in to rate ${mediaTitle}`}
            onMouseLeave={() => setHoverStars(0)}
            className="flex items-center gap-1"
          >
            {[1, 2, 3, 4, 5].map((starValue) => (
              <button
                key={starValue}
                type="button"
                data-testid={`star-rating-btn-${starValue}`}
                aria-label={`Sign in to rate ${starValue} out of 5 stars`}
                onMouseEnter={() => setHoverStars(starValue)}
                onClick={onOpenAuth}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-[#191D2B] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] cursor-pointer"
              >
                <Star
                  className={`w-6 h-6 transition-colors duration-150 ${
                    starValue <= hoverStars ? 'text-amber-400 fill-amber-400' : 'text-[#475569]'
                  }`}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenAuth}
            data-testid="star-rating-signin-btn"
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {t('detail.signInToRate')}
          </button>
        </div>
      )}
    </section>
  );
};
