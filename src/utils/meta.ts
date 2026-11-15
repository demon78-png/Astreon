export interface MetaUpdatePayload {
  title: string;
  description?: string;
  image?: string;
  url?: string;
}

function upsertMetaTag(
  selector: string,
  attrName: 'name' | 'property',
  attrValue: string,
  content: string
) {
  if (typeof document === 'undefined') return;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export function updateDocumentMeta(payload: MetaUpdatePayload): void {
  if (typeof document === 'undefined') return;
  document.title = payload.title;

  const safeUrl =
    payload.url || (typeof window !== 'undefined' ? window.location.href : '');
  const safeDescription =
    payload.description ||
    'ASTREON is a curated digital entertainment discovery platform for films, television series, trailers, and editorial criticism.';

  upsertMetaTag('meta[name="description"]', 'name', 'description', safeDescription);
  upsertMetaTag('meta[property="og:title"]', 'property', 'og:title', payload.title);
  upsertMetaTag(
    'meta[property="og:description"]',
    'property',
    'og:description',
    safeDescription
  );
  upsertMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', payload.title);
  upsertMetaTag(
    'meta[name="twitter:description"]',
    'name',
    'twitter:description',
    safeDescription
  );

  if (safeUrl) {
    upsertMetaTag('meta[property="og:url"]', 'property', 'og:url', safeUrl);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', safeUrl);
  }

  if (payload.image) {
    upsertMetaTag('meta[property="og:image"]', 'property', 'og:image', payload.image);
    upsertMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', payload.image);
  }
}
