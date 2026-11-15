import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { I18nProvider } from './contexts/I18nContext.tsx';
import './index.css';

// Register PWA service worker for offline caching and fallback
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[ASTREON] Service Worker note:', err?.message || err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <I18nProvider>
    <App />
  </I18nProvider>
);
