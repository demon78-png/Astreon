export function normalizeNetlifyApiPath(rawPath: string): string {
  const input = (rawPath || '/').trim();
  const queryIndex = input.indexOf('?');
  const pathnamePart = queryIndex === -1 ? input : input.slice(0, queryIndex);
  const queryPart = queryIndex === -1 ? '' : input.slice(queryIndex);

  let normalizedPath = pathnamePart.replace(/^\/\.netlify\/functions\/api(?=\/|$)/, '');

  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`;
  }

  if (normalizedPath === '/') {
    normalizedPath = '/api';
  } else if (normalizedPath !== '/api' && !normalizedPath.startsWith('/api/')) {
    normalizedPath = `/api${normalizedPath}`;
  }

  return `${normalizedPath}${queryPart}`;
}
