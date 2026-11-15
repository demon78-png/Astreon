const TMDB_IMAGE_URL_REGEX = /^(https:\/\/image\.tmdb\.org\/t\/p\/)([^/]+)(\/.+)$/i;

export type ImageVariant = 'poster' | 'backdrop' | 'still' | 'profile';

/**
 * Generate a responsive srcSet attribute only for canonical TMDB image URLs.
 * Leaves Unsplash or local asset paths untouched.
 */
export function buildTmdbImageSrcSet(
  url?: string | null,
  variant: ImageVariant = 'poster'
): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const match = url.trim().match(TMDB_IMAGE_URL_REGEX);
  if (!match) return undefined;

  const [, base, , assetPath] = match;

  if (variant === 'poster') {
    return `${base}w342${assetPath} 342w, ${base}w500${assetPath} 500w, ${base}w780${assetPath} 780w`;
  }
  if (variant === 'backdrop') {
    return `${base}w780${assetPath} 780w, ${base}w1280${assetPath} 1280w`;
  }
  if (variant === 'still') {
    return `${base}w300${assetPath} 300w, ${base}w500${assetPath} 500w`;
  }
  return `${base}w185${assetPath} 185w, ${base}w300${assetPath} 300w`;
}
