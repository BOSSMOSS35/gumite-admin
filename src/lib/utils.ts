import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Rewrites image URLs to proxy through the backend /files endpoint.
 * MinIO URLs aren't publicly accessible, so we strip the origin + bucket
 * and route through our backend proxy instead.
 *
 * https://gumite-minio-sdsl.runixcloud.dev/gumite/products/abc/img.jpg
 *   → /files?key=products/abc/img.jpg
 *
 * Note: we do NOT use encodeURIComponent for the key because it encodes
 * slashes (/) to %2F which can break some proxy chains. The backend's
 * allowedKeyPattern (^[a-zA-Z0-9/_.-]+$) ensures keys are safe.
 */
const IMAGE_CDN_BASE = "https://gumite-image-cdn.bukhari-kibuka7.workers.dev/gumite/";

export function getImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  // Intercept any raw storage URLs (MinIO, R2 direct, R2 dev) and route to our edge CDN
  const cdnPrefixes = [
    "runixcloud.dev/gumite/",
    ".r2.cloudflarestorage.com/gumite/",
    ".r2.dev/gumite/",
    ".r2.dev/",
  ];

  for (const prefix of cdnPrefixes) {
    if (url.includes(prefix)) {
      const key = url.substring(url.indexOf(prefix) + prefix.length);
      const cleanKey = key.startsWith("gumite/") ? key.slice(7) : key;
      return `${IMAGE_CDN_BASE}${cleanKey}`;
    }
  }
  
  // Localhost fallback
  const MINIO_LOCALHOST_PREFIX = ":9000/gumite/";
  if (url.includes(MINIO_LOCALHOST_PREFIX)) {
    const key = url.substring(url.indexOf(MINIO_LOCALHOST_PREFIX) + MINIO_LOCALHOST_PREFIX.length);
    return `/files?key=${key}`;
  }

  // Other absolute URLs (Unsplash, etc.) — use directly
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Relative /files?key=... URLs — already correct for local dev
  if (url.startsWith("/files")) {
    return url;
  }

  // Bare key like "products/abc/img.jpg" — route to CDN
  return `${IMAGE_CDN_BASE}${url}`;
}
