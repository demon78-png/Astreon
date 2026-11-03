import React, { useEffect } from 'react';
import { MediaItem } from '../types/entertainment';
import { X, ExternalLink } from 'lucide-react';

interface TrailerModalProps {
  item: MediaItem | null;
  onClose: () => void;
}

export const TrailerModal: React.FC<TrailerModalProps> = ({ item, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  // Find official trailer video
  const trailer = item.videos?.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    item.videos?.find((v) => v.site === 'YouTube') || null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trailer-modal-title"
    >
      <div
        className="relative w-full max-w-4xl bg-[#111421] border border-[#272B3A] rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#272B3A] bg-[#080A12]">
          <div>
            <h3 id="trailer-modal-title" className="text-sm sm:text-base font-display font-semibold text-[#F8FAFC]">
              {item.title} — Official Trailer
            </h3>
            <p className="text-xs text-[#858B9B]">
              Authorized promotional material via official studio distribution
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#191D2B] text-[#A1A1AA] hover:text-[#F8FAFC] border border-[#272B3A] transition-colors cursor-pointer"
            aria-label="Close trailer dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Embed Frame */}
        <div className="relative aspect-video w-full bg-black">
          {trailer ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=1`}
              title={`${item.title} Official Trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
              <p className="text-sm text-[#A1A1AA]">
                Official video stream is currently unavailable for this title.
              </p>
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(item.title + ' official trailer')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors"
              >
                <span>Search Authorized Studio Clips</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="px-6 py-3 bg-[#080A12] border-t border-[#272B3A] flex items-center justify-between text-[11px] text-[#858B9B]">
          <span>ASTREON Discovery Player</span>
          <span className="font-mono">YouTube Verified Embed</span>
        </div>
      </div>
    </div>
  );
};
