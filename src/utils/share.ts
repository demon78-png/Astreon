import type { MediaItem } from '../types/entertainment.ts';
import { buildRouteUrl } from './routing.ts';

export interface TitleSharePayload {
  title: string;
  text: string;
  url: string;
}

export type ShareOutcomeStatus = 'shared' | 'copied' | 'cancelled' | 'fallback';

export interface ShareOutcome {
  status: ShareOutcomeStatus;
  url: string;
}

export interface ShareDependencies {
  canShareFn?: (data: ShareData) => boolean;
  shareFn?: (data: ShareData) => Promise<void>;
  writeClipboardFn?: (text: string) => Promise<void>;
}

/**
 * Generates an absolute (or relative if origin is empty) shareable deep-link URL
 * that resolves directly to the title's detail modal.
 */
export function buildTitleDeepLink(
  origin: string,
  item: Pick<MediaItem, 'id' | 'mediaType'>
): string {
  const relativePath = buildRouteUrl({
    view: 'discover',
    titleId: item.id,
    mediaType: item.mediaType
  });
  const cleanOrigin = (origin || '').trim().replace(/\/+$/, '');
  return cleanOrigin ? `${cleanOrigin}${relativePath}` : relativePath;
}

/**
 * Builds the Web Share API payload for a media title.
 */
export function buildTitleSharePayload(
  origin: string,
  item: Pick<MediaItem, 'id' | 'mediaType' | 'title' | 'tagline' | 'releaseDate' | 'firstAirDate'>
): TitleSharePayload {
  const dateStr = item.releaseDate || item.firstAirDate || '';
  const yearMatch = dateStr.match(/^(\d{4})/);
  const yearSuffix = yearMatch ? ` (${yearMatch[1]})` : '';
  const title = `${item.title}${yearSuffix} — ASTREON`;
  const text = item.tagline?.trim()
    ? `${item.title} — "${item.tagline.trim()}"`
    : `Discover ${item.title} on ASTREON.`;

  return {
    title,
    text,
    url: buildTitleDeepLink(origin, item)
  };
}

function getDefaultShareDependencies(): ShareDependencies {
  if (typeof navigator === 'undefined') {
    return {};
  }
  const nav = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
    share?: (data?: ShareData) => Promise<void>;
  };

  return {
    canShareFn: typeof nav.canShare === 'function' ? (d) => nav.canShare!(d) : undefined,
    shareFn: typeof nav.share === 'function' ? (d) => nav.share!(d) : undefined,
    writeClipboardFn:
      nav.clipboard && typeof nav.clipboard.writeText === 'function'
        ? (text) => nav.clipboard.writeText(text)
        : undefined
  };
}

/**
 * Shares a title via the native Web Share API if supported and permitted,
 * gracefully respecting user cancellation (AbortError) and falling back
 * to copying the generated deep-link URL when Web Share is unavailable.
 */
export async function shareTitleWithFallback(
  payload: TitleSharePayload,
  deps: ShareDependencies = getDefaultShareDependencies()
): Promise<ShareOutcome> {
  const { canShareFn, shareFn, writeClipboardFn } = deps;

  if (typeof shareFn === 'function') {
    const shareData: ShareData = {
      title: payload.title,
      text: payload.text,
      url: payload.url
    };

    const allowed = typeof canShareFn === 'function' ? canShareFn(shareData) : true;
    if (allowed) {
      try {
        await shareFn(shareData);
        return { status: 'shared', url: payload.url };
      } catch (err) {
        const errName = (err as { name?: string } | null)?.name;
        if (errName === 'AbortError') {
          return { status: 'cancelled', url: payload.url };
        }
        // Other errors (e.g. NotAllowedError in desktop iframe or unsupported platform)
        // fall through cleanly to clipboard copy / inline link fallback.
      }
    }
  }

  if (typeof writeClipboardFn === 'function') {
    try {
      await writeClipboardFn(payload.url);
      return { status: 'copied', url: payload.url };
    } catch {
      // Clipboard blocked or unavailable; fall through to inline URL fallback.
    }
  }

  return { status: 'fallback', url: payload.url };
}
