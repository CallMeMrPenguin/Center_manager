import { dataCache } from '../utils/dataCache';
import { getAuthToken } from '../utils/authUtils';
import { recordUserActivity } from '../utils/activityTracker';

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
              if (freshData) {
                dataCache.set(cacheKey, freshData, tags, options?.ttlMs);
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('data-changed', { detail: { tags, key: cacheKey } }));
                }
              }
            })
            .catch(() => {});
        }
      }
      return cached.data;
    }
  }

  recordUserActivity();
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 403) {
      const isCloudflareBlocked =
        errText.includes('<!DOCTYPE') ||
        errText.includes('<html') ||
        errText.includes('cf-mitigated') ||
        errText.includes('challenge') ||
        errText.includes('Just a moment');

      if (isCloudflareBlocked) {
        if (typeof window !== 'undefined' && !(window as any).__reloading403) {
          (window as any).__reloading403 = true;
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
        throw new Error('Phiên kết nối tạm thời gián đoạn do không hoạt động (Mã 403). Đang tự động làm mới để kết nối lại...');
      }
      throw new Error(errText || 'Quyền truy cập bị từ chối (403)');
    }

    if (errText.trim().startsWith('<') || errText.includes('<!DOCTYPE') || errText.includes('<html')) {
      if (response.status === 502 || response.status === 503 || response.status === 504) {
        throw new Error('Máy chủ đang khởi động lại hoặc tạm thời gián đoạn (Mã ' + response.status + '). Vui lòng thử lại sau giây lát.');
      }
      throw new Error(`Lỗi kết nối máy chủ (${response.status}: ${response.statusText || 'Lỗi mạng'})`);
    }
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
