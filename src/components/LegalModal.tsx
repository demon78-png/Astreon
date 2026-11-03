import React, { useEffect } from 'react';
import { X, Shield, BookOpen, HelpCircle, FileText } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

export type LegalTab = 'about' | 'privacy' | 'terms' | 'attribution' | 'help' | 'contact';

interface LegalModalProps {
  isOpen: boolean;
  activeTab: LegalTab;
  onTabChange: (tab: LegalTab) => void;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  activeTab,
  onTabChange,
  onClose
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div
        className="relative w-full max-w-3xl bg-[#111421] border border-[#272B3A] rounded-2xl overflow-hidden shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#272B3A] bg-[#080A12]">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span className="text-xs text-[#858B9B]">· Trust, Privacy & Legal Architecture</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#858B9B] hover:text-[#F8FAFC] rounded-lg bg-[#191D2B] border border-[#272B3A] transition-colors cursor-pointer"
            aria-label="Close legal modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-[#272B3A] bg-[#080A12]/60 overflow-x-auto text-xs">
          {[
            { id: 'about', label: 'About ASTREON' },
            { id: 'attribution', label: 'Content Attribution' },
            { id: 'privacy', label: 'Privacy Policy' },
            { id: 'terms', label: 'Terms of Service' },
            { id: 'help', label: 'Help & FAQ' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id as LegalTab)}
              className={`pb-2.5 px-3 font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#8B5CF6] text-[#F8FAFC]'
                  : 'border-transparent text-[#858B9B] hover:text-[#A1A1AA]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 max-h-[65vh] overflow-y-auto text-xs sm:text-sm text-[#A1A1AA] leading-relaxed space-y-4 custom-scrollbar">
          {activeTab === 'about' && (
            <div className="space-y-4">
              <h2 id="legal-modal-title" className="text-lg font-display font-bold text-[#F8FAFC]">
                About ASTREON: Discover Beyond the Screen
              </h2>
              <p>
                ASTREON is an independent, premium entertainment discovery platform crafted to elevate
                how audiences find, analyze, and appreciate cinema and television.
              </p>
              <p>
                Our core philosophy centers on <strong>discovery over clutter</strong>, <strong>accuracy over volume</strong>,
                and <strong>respect for artistic context</strong>. Rather than serving as an unauthorized repository or video host,
                ASTREON empowers visitors with verified metadata, curated editorial retrospectives, authorized studio trailers, and
                legitimate viewing options.
              </p>
            </div>
          )}

          {activeTab === 'attribution' && (
            <div className="space-y-4">
              <h2 id="legal-modal-title" className="text-lg font-display font-bold text-[#F8FAFC]">
                TMDB & Third-Party Content Attribution
              </h2>
              <div className="p-4 rounded-xl bg-[#080A12] border border-[#272B3A] space-y-2">
                <p className="text-[#F8FAFC] font-semibold">The Movie Database (TMDB)</p>
                <p>
                  This product uses the TMDB API but is not endorsed or certified by TMDB. All movie and television
                  metadata, cast listings, production crew data, poster artwork paths, and genre taxonomies are
                  supplied via the TMDB API under TMDB developer terms.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#080A12] border border-[#272B3A] space-y-2">
                <p className="text-[#F8FAFC] font-semibold">Promotional Video Materials</p>
                <p>
                  Official promotional trailers, clips, and featurettes are embedded via standard YouTube API players
                  pointing exclusively to verified studio and distributor channels. ASTREON does not store, host, or
                  distribute copyright-protected audio/video files.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h2 id="legal-modal-title" className="text-lg font-display font-bold text-[#F8FAFC]">
                Privacy & Data Governance
              </h2>
              <p>
                ASTREON operates under strict <strong>privacy by default</strong> principles.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#858B9B]">
                <li>We do not sell personal information or tracking profiles to third-party ad brokers.</li>
                <li>Account credentials and emails are handled via secure Firebase Authentication.</li>
                <li>Watchlists and personal favourites are private to each authenticated account.</li>
                <li>You can clear your search history or request complete account deletion at any time in Profile Preferences.</li>
              </ul>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <h2 id="legal-modal-title" className="text-lg font-display font-bold text-[#F8FAFC]">
                Terms of Service & Community Guidelines
              </h2>
              <p>
                By using ASTREON, you agree to respect our community discussion guidelines.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#858B9B]">
                <li>Community reviews must reflect genuine personal critique and refrain from hate speech or harassment.</li>
                <li>Flagged reviews are subject to administrative review and quarantine.</li>
                <li>All trademarks, logos, and brand names are property of their respective owners.</li>
              </ul>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="space-y-4">
              <h2 id="legal-modal-title" className="text-lg font-display font-bold text-[#F8FAFC]">
                Frequently Asked Questions (FAQ)
              </h2>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-[#080A12] border border-[#272B3A]">
                  <p className="font-semibold text-[#F8FAFC]">Can I watch full movies on ASTREON?</p>
                  <p className="mt-1 text-xs text-[#858B9B]">
                    No. ASTREON is a curated discovery and recommendation platform. We provide authorized promotional
                    trailers and direct links to legitimate licensed providers (e.g., Apple TV, Max, Prime Video, Netflix).
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#080A12] border border-[#272B3A]">
                  <p className="font-semibold text-[#F8FAFC]">Is an ASTREON account free?</p>
                  <p className="mt-1 text-xs text-[#858B9B]">
                    Yes! Free accounts allow you to create personal watchlists, mark favourites, and publish community reviews.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#272B3A] bg-[#080A12] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#191D2B] text-[#F8FAFC] hover:bg-[#272B3A] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
