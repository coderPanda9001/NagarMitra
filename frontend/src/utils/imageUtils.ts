export const DEFAULT_ISSUE_IMAGE =
  'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop';

export const FALLBACK_SVG_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" fill="%23f1f5f9"><rect width="100%" height="100%" fill="%23f8fafc"/><path d="M220 170L280 240L340 170L440 290H160Z" fill="%23cbd5e1"/><circle cx="210" cy="140" r="22" fill="%2394a3b8"/><text x="50%" y="85%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="600" fill="%2364748b">Municipal Field Photo</text></svg>';

/**
 * Returns full image URL, converting relative backend uploads paths like /uploads/...
 * to point to backend server port (http://127.0.0.1:8000 or http://localhost:8000).
 */
export function getImageUrl(urlInput?: string | { url?: string; fallbackUrl?: string } | null): string {
  if (!urlInput) {
    return FALLBACK_SVG_IMAGE;
  }
  let url = typeof urlInput === 'string' ? urlInput : (urlInput.fallbackUrl || urlInput.url || '');
  if (!url || typeof url !== 'string' || !url.trim()) {
    return FALLBACK_SVG_IMAGE;
  }
  let cleanUrl = url.trim();

  // Translate localhost to 127.0.0.1 for reliable local connection
  if (cleanUrl.includes('localhost:8000')) {
    cleanUrl = cleanUrl.replace('localhost:8000', '127.0.0.1:8000');
  }

  if (
    cleanUrl.startsWith('http://') ||
    cleanUrl.startsWith('https://') ||
    cleanUrl.startsWith('data:') ||
    cleanUrl.startsWith('blob:')
  ) {
    return cleanUrl;
  }
  if (cleanUrl.startsWith('/uploads')) {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
    const origin = apiBase.replace(/\/api\/v1\/?$/, '');
    return `${origin}${cleanUrl}`;
  }
  return cleanUrl;
}

/**
 * Image onError handler to prevent broken image icons
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
  const target = e.currentTarget;
  const fallback = target.getAttribute('data-fallback');
  if (fallback && target.src !== fallback) {
    target.src = fallback;
    return;
  }
  if (target.src !== FALLBACK_SVG_IMAGE) {
    target.src = FALLBACK_SVG_IMAGE;
  }
}
