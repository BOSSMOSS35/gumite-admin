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
const MINIO_URL_PATTERN = /^https?:\/\/[^/]*runixcloud\.dev\/gumite\//;
const MINIO_LOCALHOST_PATTERN = /^https?:\/\/(?:localhost|minio):9000\/gumite\//;

export function getImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  // Rewrite MinIO URLs to backend proxy
  if (MINIO_URL_PATTERN.test(url)) {
    const key = url.replace(MINIO_URL_PATTERN, "");
    return `/files?key=${key}`;
  }
  if (MINIO_LOCALHOST_PATTERN.test(url)) {
    const key = url.replace(MINIO_LOCALHOST_PATTERN, "");
    return `/files?key=${key}`;
  }

  // Other absolute URLs (Unsplash, etc.) — use directly
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Relative /files?key=... URLs — already correct
  if (url.startsWith("/files")) {
    return url;
  }

  // Bare key like "products/abc/img.jpg" — proxy it
  return `/files?key=${url}`;
}
