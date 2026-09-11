import { useEffect } from 'react';

/**
 * Reads a query parameter from the current window URL
 */
export function getUrlParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

/**
 * Returns all query parameters as a key-value record
 */
export function getAllUrlParams(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};
  params.forEach((val, key) => {
    result[key] = val;
  });
  return result;
}

/**
 * Updates URL query parameters and pathname without page reload
 * Dispatches a custom 'app-url-changed' event so all listeners re-render
 */
export function setUrlParams(
  updates: Record<string, string | number | null | undefined>,
  options: { replace?: boolean; pathname?: string } = {}
) {
  if (typeof window === 'undefined') return;

  const currentSearch = new URLSearchParams(window.location.search);

  Object.entries(updates).forEach(([key, val]) => {
    if (val === null || val === undefined || val === '') {
      currentSearch.delete(key);
    } else {
      currentSearch.set(key, String(val));
    }
  });

  const queryString = currentSearch.toString();
  const targetPath = options.pathname || window.location.pathname;
  const newUrl = queryString ? `${targetPath}?${queryString}` : targetPath;
  const currentFullUrl = window.location.pathname + (window.location.search ? window.location.search : '');

  if (currentFullUrl !== newUrl) {
    if (options.replace) {
      window.history.replaceState({ url: newUrl }, '', newUrl);
    } else {
      window.history.pushState({ url: newUrl }, '', newUrl);
    }
    window.dispatchEvent(
      new CustomEvent('app-url-changed', {
        detail: { newUrl, pathname: targetPath, params: Object.fromEntries(currentSearch) },
      })
    );
  }
}

/**
 * React hook to listen to browser Back/Forward (popstate) and internal 'app-url-changed' events
 */
export function useUrlSync(callback: () => void) {
  useEffect(() => {
    const handleSync = () => {
      callback();
    };

    window.addEventListener('popstate', handleSync);
    window.addEventListener('app-url-changed', handleSync);

    return () => {
      window.removeEventListener('popstate', handleSync);
      window.removeEventListener('app-url-changed', handleSync);
    };
  }, [callback]);
}
