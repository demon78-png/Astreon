import { useState, useEffect, useCallback, useRef } from 'react';

export interface OnlineStatusState {
  isOnline: boolean;
  wasOffline: boolean;
  checkConnection: () => Promise<boolean>;
}

export function useOnlineStatus(): OnlineStatusState {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      return false;
    }

    try {
      // Fast HEAD/GET ping with cache busting and a 3s timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`/api/health?_t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const online = res.ok;
      setIsOnline(online);
      return online;
    } catch {
      // If the ping fails or times out, consider offline
      const online = typeof navigator !== 'undefined' ? navigator.onLine : false;
      setIsOnline(online);
      return online;
    }
  }, []);

  useEffect(() => {
    const clearPendingTimer = () => {
      if (clearTimerRef.current) {
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      clearPendingTimer();
      // Auto-clear wasOffline after 4 seconds
      clearTimerRef.current = setTimeout(() => {
        setWasOffline(false);
        clearTimerRef.current = null;
      }, 4000);
    };

    const handleOffline = () => {
      clearPendingTimer();
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearPendingTimer();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline, checkConnection };
}
