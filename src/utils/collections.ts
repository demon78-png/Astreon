import type {
  CustomCollection,
  CollectionMediaEntry,
  MediaItem
} from '../types/entertainment.ts';

export const MAX_CUSTOM_COLLECTION_ITEMS = 50;
export const MAX_CUSTOM_COLLECTIONS = 30;

export function createCollectionEntryFromMedia(
  item: MediaItem,
  addedAt: string = new Date().toISOString()
): CollectionMediaEntry {
  return {
    mediaId: item.id,
    mediaType: item.mediaType,
    title: (item.title || 'Untitled').slice(0, 200),
    posterPath: (item.posterPath || '').slice(0, 500),
    ...(item.backdropPath ? { backdropPath: item.backdropPath.slice(0, 500) } : {}),
    voteAverage: Number.isFinite(item.voteAverage) ? Number(item.voteAverage) : 0,
    ...(item.releaseDate || item.firstAirDate
      ? { releaseDate: (item.releaseDate || item.firstAirDate || '').slice(0, 50) }
      : {}),
    genres: Array.isArray(item.genres) ? item.genres.slice(0, 10) : [],
    addedAt
  };
}

export function sanitizeCustomCollection(collection: CustomCollection): CustomCollection {
  const safeId = (collection.id || `col_${Date.now()}`)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 128);

  const items: CollectionMediaEntry[] = Array.isArray(collection.items)
    ? collection.items.slice(0, MAX_CUSTOM_COLLECTION_ITEMS).map((entry) => ({
        mediaId: Number(entry.mediaId),
        mediaType: entry.mediaType === 'tv' ? 'tv' : 'movie',
        title: (entry.title || 'Untitled').slice(0, 200),
        posterPath: (entry.posterPath || '').slice(0, 500),
        ...(entry.backdropPath ? { backdropPath: entry.backdropPath.slice(0, 500) } : {}),
        voteAverage: Number.isFinite(entry.voteAverage) ? Number(entry.voteAverage) : 0,
        ...(entry.releaseDate ? { releaseDate: entry.releaseDate.slice(0, 50) } : {}),
        genres: Array.isArray(entry.genres) ? entry.genres.slice(0, 10) : [],
        addedAt: (entry.addedAt || new Date().toISOString()).slice(0, 64)
      }))
    : [];

  return {
    id: safeId,
    ownerId: (collection.ownerId || '').slice(0, 128),
    ownerName: (collection.ownerName || 'ASTREON Curator').slice(0, 100),
    name: (collection.name || 'Untitled Collection').trim().slice(0, 80),
    description: (collection.description || '').trim().slice(0, 400),
    isPublic: Boolean(collection.isPublic),
    items,
    createdAt: (collection.createdAt || new Date().toISOString()).slice(0, 64),
    updatedAt: (collection.updatedAt || new Date().toISOString()).slice(0, 64)
  };
}

export function createCustomCollection(params: {
  ownerId: string;
  ownerName: string;
  name: string;
  description?: string;
  isPublic?: boolean;
  initialItem?: MediaItem;
  nowIso?: string;
}): CustomCollection {
  const timestamp = params.nowIso || new Date().toISOString();
  const suffix = Math.random().toString(36).slice(2, 7);
  return sanitizeCustomCollection({
    id: `col_${Date.now()}_${suffix}`,
    ownerId: params.ownerId,
    ownerName: params.ownerName,
    name: params.name.trim() || 'Curated Collection',
    description: params.description?.trim() || '',
    isPublic: params.isPublic !== false,
    items: params.initialItem ? [createCollectionEntryFromMedia(params.initialItem, timestamp)] : [],
    createdAt: timestamp,
    updatedAt: timestamp
  });
}

export function toggleItemInCollection(
  collection: CustomCollection,
  item: MediaItem,
  nowIso: string = new Date().toISOString()
): CustomCollection {
  const exists = collection.items.some(
    (entry) => entry.mediaId === item.id && entry.mediaType === item.mediaType
  );
  const nextItems = exists
    ? collection.items.filter(
        (entry) => !(entry.mediaId === item.id && entry.mediaType === item.mediaType)
      )
    : [createCollectionEntryFromMedia(item, nowIso), ...collection.items].slice(
        0,
        MAX_CUSTOM_COLLECTION_ITEMS
      );

  return sanitizeCustomCollection({
    ...collection,
    items: nextItems,
    updatedAt: nowIso
  });
}

export function isItemInCollection(
  collection: CustomCollection,
  mediaId: number,
  mediaType: 'movie' | 'tv'
): boolean {
  return collection.items.some(
    (entry) => entry.mediaId === mediaId && entry.mediaType === mediaType
  );
}

export function buildCollectionShareUrl(origin: string, collectionId: string): string {
  const cleanOrigin = (origin || '').replace(/\/+$/, '');
  const path = `/list?id=${encodeURIComponent(collectionId)}`;
  return cleanOrigin ? `${cleanOrigin}${path}` : path;
}
