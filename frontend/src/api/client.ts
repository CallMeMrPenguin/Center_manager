import { dataCache } from '../utils/dataCache';
import { getAuthToken } from '../utils/authUtils';

export const API_BASE = import.meta.env.VITE_API_URL ?? '';

export interface RequestOptions extends RequestInit {
  tags?: string[];
  ttlMs?: number;
  forceRefresh?: boolean;
}

const revalidateTracker = new Map<string, number>();
const REVALIDATE_THROTTLE_MS = 15000; // 15 seconds revalidation throttle

export async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const isGet = !options?.method || options.method.toUpperCase() === 'GET';
  const cacheKey = path;
  const tags = options?.tags || [];

  const token = getAuthToken();
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  const mergedHeaders = {
    ...defaultHeaders,
    ...((options?.headers as Record<string, string>) || {}),
  };

  // In-memory SWR caching for GET requests
  if (isGet && !options?.forceRefresh) {
    const cached = dataCache.get<T>(cacheKey);
    if (cached) {
      // If stale, revalidate in background with 15s debounce/throttle
      if (cached.isStale) {
        const now = Date.now();
        const lastReval = revalidateTracker.get(cacheKey) || 0;
        if (now - lastReval > REVALIDATE_THROTTLE_MS) {
          revalidateTracker.set(cacheKey, now);
          fetch(`${API_BASE}${path}`, {
            ...options,
            headers: mergedHeaders,
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((freshData) => {
              if (freshData) dataCache.set(cacheKey, freshData, tags, options?.ttlMs);
            })
            .catch(() => {});
        }
      }
      return cached.data;
    }
  }

  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || response.statusText);
  }

  const data: T = await response.json();

  // Save to cache on successful GET
  if (isGet) {
    dataCache.set(cacheKey, data, tags, options?.ttlMs);
  } else if (tags.length > 0) {
    // Invalidate related tags on mutations (POST/PUT/DELETE)
    dataCache.invalidateTags(tags);
  }

  return data;
}

export function invalidateCache(tags: string[]): void {
  revalidateTracker.clear();
  dataCache.invalidateTags(tags);
}
