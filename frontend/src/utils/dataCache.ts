/**
 * High-Performance In-Memory Data Cache & Stale-While-Revalidate Engine
 * Designed for zero-lag tab switching (0ms) and smart tag invalidation.
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttlMs: number;
  tags: string[];
};

class DataCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 4 * 60 * 1000; // 4 minutes

  /**
   * Generates a unique cache key from an endpoint and params
   */
  public makeKey(endpoint: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) return endpoint;
    const sorted = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .sort(([a], [b]) => a.localeCompare(b));
    return `${endpoint}?${new URLSearchParams(sorted as any).toString()}`;
  }

  /**
   * Retrieves data from cache if not expired
   */
  public get<T>(key: string): { data: T; isStale: boolean } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const isExpired = now - entry.timestamp > entry.ttlMs;
    // Stale if older than half TTL
    const isStale = now - entry.timestamp > entry.ttlMs / 2;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return { data: entry.data as T, isStale };
  }

  /**
   * Sets data in cache with associated tags and optional custom TTL
   */
  public set<T>(key: string, data: T, tags: string[] = [], customTtlMs?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs: customTtlMs ?? this.defaultTTL,
      tags,
    });
  }

  /**
   * Invalidates all cache entries matching any of the specified tags
   */
  public invalidateTags(tags: string[]): void {
    if (!tags || tags.length === 0) return;
    const tagSet = new Set(tags);
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some((t) => tagSet.has(t))) {
        this.cache.delete(key);
      }
    }
    // Dispatch global data-invalidated event for listening components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('data-invalidated', { detail: { tags } }));
    }
  }

  /**
   * Clears the entire cache
   */
  public clearAll(): void {
    this.cache.clear();
  }
}

export const dataCache = new DataCacheManager();
