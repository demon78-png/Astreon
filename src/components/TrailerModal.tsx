import React, { useRef } from 'react';
import { MediaItem } from '../types/entertainment';
import { X, ExternalLink } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface TrailerModalProps {
  item: MediaItem | null;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ item, onClose }) => {
  const { t } = useI18n();
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, Boolean(item), onClose);

  if (!item) return null;

  // Find official trailer video
  const trailer = item.videos?.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    item.videos?.find((v) => v.site === 'YouTube') || null;

  const watchHref = trailer
    ? `https://www.youtube.com/watch?v=${encodeURIComponent(trailer.key)}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(item.title + ' official trailer')}`;

  return (
    <div
      className="fixed inset-0 z-[65] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trailer-modal-title"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="relative w-full md:max-w-4xl bg-[#111421] border-t md:border border-[#272B3A] rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile bottom-sheet drag handle */}
        <div className="md:hidden flex justify-center pt-2.5 pb-1 bg-[#080A12]">
          <div className="w-10 h-1.5 rounded-full bg-[#272B3A]" aria-hidden="true" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 sm:py-4 border-b border-[#272B3A] bg-[#080A12]">
          <div className="min-w-0">
            <h3 id="trailer-modal-title" className="text-sm sm:text-base font-display font-semibold text-[#F8FAFC] truncate">
              {item.title} — {t('trailer.official')}
            </h3>
            <p className="text-xs text-[#858B9B] truncate">
              {t('trailer.authorizedNote')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] md:min-w-0 md:min-h-0 flex items-center justify-center p-1.5 rounded-lg bg-[#191D2B] text-[#A1A1AA] hover:text-[#F8FAFC] border border-[#272B3A] transition-colors cursor-pointer shrink-0"
            aria-label="Close trailer dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Embed Frame */}
        <div className="relative aspect-video w-full bg-black">
          {trailer ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.key)}?autoplay=1&rel=0&modestbranding=1`}
              title={`${item.title} ${t('trailer.official')}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
              <p className="text-sm text-[#A1A1AA]">
                {t('trailer.unavailable')}
              </p>
              <a
                href={watchHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors"
              >
                <span>{t('trailer.watchYoutube')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Footer info note + Watch on YouTube fallback */}
        <div className="px-6 py-3 bg-[#080A12] border-t border-[#272B3A] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#858B9B]">
          <span>ASTREON Discovery Player</span>
          <a
            href={watchHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[#38BDF8] hover:text-cyan-300 transition-colors"
          >
            <span>{t('trailer.watchYoutube')}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
