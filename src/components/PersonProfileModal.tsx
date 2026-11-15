import React, { useEffect, useRef, useState } from 'react';
import { PersonDetails } from '../types/entertainment';
import { getPersonDetails } from '../services/api';
import { formatRating, formatReleaseYear } from '../utils/entertainment';
import { useI18n } from '../contexts/I18nContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { X, Film, Tv, Star, MapPin, Calendar, Loader2 } from 'lucide-react';

export interface PersonSelection {
  id: number;
  name: string;
  profilePath?: string;
}

interface PersonProfileModalProps {
  person: PersonSelection | null;
  onClose: () => void;
  onSelectCredit: (mediaId: number, mediaType: 'movie' | 'tv') => void;
}

export const PersonProfileModal: React.FC<PersonProfileModalProps> = ({
  person,
  onClose,
  onSelectCredit
}) => {
  const { t, tmdbLanguage, formatDate } = useI18n();
  const modalRef = useRef<HTMLDivElement>(null);
  const [details, setDetails] = useState<PersonDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [portraitFailed, setPortraitFailed] = useState(false);
  const [failedCredits, setFailedCredits] = useState<Record<string, boolean>>({});

  useFocusTrap(modalRef, Boolean(person), onClose);

  useEffect(() => {
    if (!person) {
      setDetails(null);
      return;
    }
    let mounted = true;
    setLoading(true);
    setPortraitFailed(false);
    setFailedCredits({});

    getPersonDetails(person.id, tmdbLanguage)
      .then((res) => {
        if (!mounted) return;
        setDetails(res);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [person?.id, tmdbLanguage]);

  if (!person) return null;

  const displayName = details?.name || person.name;
  const portraitSrc = details?.profilePath || person.profilePath;
  const credits = details?.credits || [];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="person-profile-heading"
      onClick={onClose}
      data-testid="person-profile-modal"
    >
      <div
        ref={modalRef}
        className="relative w-full md:max-w-3xl max-h-[90dvh] md:max-h-[88vh] overflow-y-auto custom-scrollbar bg-[#111421] border-t md:border border-[#272B3A] rounded-t-3xl md:rounded-2xl shadow-2xl pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="md:hidden sticky top-0 z-20 flex justify-center pt-2.5 pb-1 bg-[#111421]/90 backdrop-blur-sm">
          <div className="w-10 h-1.5 rounded-full bg-[#272B3A]" aria-hidden="true" />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center p-2 rounded-full bg-[#080A12]/85 hover:bg-[#080A12] text-[#A1A1AA] hover:text-[#F8FAFC] border border-[#272B3A] transition-colors cursor-pointer"
          aria-label="Close person profile modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-8 space-y-6">
          {/* Header Bio Lockup */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-24 h-32 sm:w-28 sm:h-36 rounded-xl bg-[#191D2B] border border-[#272B3A] overflow-hidden flex items-center justify-center shrink-0">
              {portraitSrc && !portraitFailed ? (
                <img
                  src={portraitSrc}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  onError={() => setPortraitFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-display font-bold text-[#38BDF8]">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-8 space-y-2">
              {details?.knownForDepartment && (
                <p className="text-[11px] font-mono uppercase tracking-wider text-[#38BDF8]">
                  {t('person.knownFor')} · {details.knownForDepartment}
                </p>
              )}
              <h2
                id="person-profile-heading"
                className="text-2xl sm:text-3xl font-display font-bold text-[#F8FAFC] tracking-tight"
              >
                {displayName}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#858B9B]">
                {details?.birthday && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>
                      {t('person.born')}: {formatDate(details.birthday)}
                    </span>
                  </span>
                )}
                {details?.placeOfBirth && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>{details.placeOfBirth}</span>
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-xs text-[#858B9B] pt-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#38BDF8]" />
                  <span>{t('person.loading')}</span>
                </div>
              ) : (
                <div className="pt-1 space-y-1.5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#858B9B]">
                    {t('person.biography')}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed line-clamp-6">
                    {details?.biography || t('person.biographyUnavailable')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Filmography */}
          <div className="pt-4 border-t border-[#272B3A] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase font-semibold text-[#858B9B] tracking-wider">
                {t('person.filmography')}
              </h3>
              <span className="text-[11px] font-mono text-[#858B9B]">
                {t('person.creditsCount', { count: credits.length })}
              </span>
            </div>

            {credits.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {credits.map((credit) => {
                  const key = `${credit.mediaType}-${credit.id}`;
                  return (
                    <button
                      key={key}
                      type="button"
                      data-testid={`person-credit-${credit.id}`}
                      onClick={() => {
                        onClose();
                        onSelectCredit(credit.id, credit.mediaType);
                      }}
                      className="group text-left rounded-xl bg-[#080A12] border border-[#272B3A] hover:border-[#8B5CF6]/60 overflow-hidden transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
                    >
                      <div className="aspect-[2/3] bg-[#191D2B] overflow-hidden flex items-center justify-center">
                        {credit.posterPath && !failedCredits[key] ? (
                          <img
                            src={credit.posterPath}
                            alt={credit.title}
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setFailedCredits((prev) => ({ ...prev, [key]: true }))
                            }
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : credit.mediaType === 'tv' ? (
                          <Tv className="w-6 h-6 text-[#38BDF8] opacity-60" />
                        ) : (
                          <Film className="w-6 h-6 text-[#8B5CF6] opacity-60" />
                        )}
                      </div>
                      <div className="p-2.5 space-y-1">
                        <p className="text-xs font-semibold text-[#F8FAFC] group-hover:text-[#38BDF8] truncate">
                          {credit.title}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-[#858B9B]">
                          <span className="tabular-nums">
                            {formatReleaseYear(credit.releaseDate)}
                          </span>
                          <span className="inline-flex items-center gap-0.5 font-mono text-[#38BDF8]">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            {formatRating(credit.voteAverage)}
                          </span>
                        </div>
                        {(credit.character || credit.job) && (
                          <p className="text-[10px] text-[#858B9B] truncate">
                            {credit.character || credit.job}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : !loading ? (
              <p className="text-xs text-[#858B9B] py-4">
                {t('person.biographyUnavailable')}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
