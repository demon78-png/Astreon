import React, { useState, useRef, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, X } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface OfflineBannerProps {
  isOnline: boolean;
  wasOffline: boolean;
  onRetry: () => Promise<boolean>;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  wasOffline,
  onRetry
}) => {
  const { t } = useI18n();
  const [retrying, setRetrying] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      retryTimerRef.current = setTimeout(() => {
        setRetrying(false);
        retryTimerRef.current = null;
      }, 600);
    }
  };

  // Re-enable banner if offline status toggles
  useEffect(() => {
    if (!isOnline) {
      setDismissed(false);
    }
  }, [isOnline]);

  // Just reconnected notification banner
  if (isOnline && wasOffline) {
    return (
      <aside
        aria-label="Network status notification"
        className="sticky top-14 md:top-16 z-30 w-full bg-emerald-950/90 backdrop-blur-md border-b border-emerald-500/40 px-4 py-2.5 text-xs text-emerald-200 animate-in fade-in slide-in-from-top-2 duration-300"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">
              {t('offline.restored')}
            </span>
          </div>
        </div>
      </aside>
    );
  }

  // Not offline, nothing to render
  if (isOnline) {
    return null;
  }

  // If dismissed, show a subtle floating badge in the bottom left above bottom tab bar
  if (dismissed) {
    return (
      <button
        onClick={() => setDismissed(false)}
        className="fixed bottom-20 md:bottom-5 left-4 md:left-5 z-40 flex items-center gap-2 px-3 py-2 rounded-full bg-[#18130B]/90 border border-amber-500/40 text-amber-300 shadow-xl backdrop-blur-md text-[11px] font-mono cursor-pointer hover:bg-[#20180E] transition-all"
        title="Offline Mode Active — Click to view details"
        aria-label="Offline Mode Active — Click to expand"
      >
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        <span>{t('offline.badge')}</span>
      </button>
    );
  }

  // Full prominent warning banner
  return (
    <aside
      aria-label="Offline connection warning banner"
      className="sticky top-14 md:top-16 z-30 w-full bg-[#18130B]/95 backdrop-blur-md border-b border-amber-500/40 px-4 py-2.5 sm:py-3 text-xs text-amber-200 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
            <WifiOff className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-amber-300 flex items-center gap-2">
              <span>{t('offline.title')}</span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {t('offline.badge')}
              </span>
            </p>
            <p className="text-[11px] text-amber-200/80 leading-relaxed mt-0.5">
              {t('offline.description')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
            <span>{retrying ? t('offline.retrying') : t('offline.retry')}</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 rounded-lg text-amber-400/80 hover:text-amber-200 hover:bg-amber-500/20 transition-colors cursor-pointer"
            aria-label="Dismiss offline banner"
            title="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
