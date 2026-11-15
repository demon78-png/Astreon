import React, { useState, useEffect } from 'react';
import { Download, Check, Share2, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'compact', className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (!showIOSGuide) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowIOSGuide(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIOSGuide]);

  if (isInstalled) {
    if (variant === 'full') {
      return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium ${className}`}>
          <Check className="w-3.5 h-3.5" />
          <span>Installed as App</span>
        </div>
      );
    }
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`${
          variant === 'full'
            ? 'flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-lg bg-[#38BDF8] hover:bg-cyan-300 text-[#080A12] text-xs font-semibold transition-colors cursor-pointer shadow-sm'
            : 'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#080A12] bg-[#38BDF8] hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer'
        } ${className}`}
        aria-label="Install ASTREON App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS || variant === 'full') {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`${
            variant === 'full'
              ? 'flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#191D2B] hover:bg-[#272B3A] border border-[#272B3A] text-[#38BDF8] text-xs font-semibold transition-colors cursor-pointer'
              : 'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#38BDF8] bg-[#111421] hover:bg-[#191D2B] border border-[#272B3A] rounded-lg transition-colors cursor-pointer'
          } ${className}`}
          aria-label="How to install ASTREON on your device"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isIOS ? 'Install on iOS' : 'Install Guide'}</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-guide-title"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              className="w-full max-w-sm rounded-2xl bg-[#111421] border border-[#272B3A] p-6 shadow-2xl space-y-4 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 id="pwa-install-guide-title" className="text-base font-display font-bold text-[#F8FAFC]">
                  Install ASTREON App
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-[#858B9B] hover:text-white rounded-lg cursor-pointer"
                  aria-label="Close install instructions"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2.5 text-xs text-[#A1A1AA] leading-relaxed">
                <p className="flex items-start gap-2">
                  <Share2 className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#F8FAFC]">iPhone / iPad (Safari):</strong> Tap the{' '}
                    <strong className="text-white">Share</strong> button in the browser toolbar, then select{' '}
                    <strong className="text-white">Add to Home Screen</strong>.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <Download className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#F8FAFC]">Android / Desktop (Chrome):</strong> Open the browser menu{' '}
                    <strong className="text-white">⋮</strong> and select{' '}
                    <strong className="text-white">Install app</strong> or <strong className="text-white">Add to Home screen</strong>.
                  </span>
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
