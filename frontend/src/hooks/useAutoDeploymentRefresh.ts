import { useEffect } from 'react';
import { showToast } from '../components/Toast';
import { isUserIdle } from '../utils/activityTracker';

/**
 * Hook to detect new deployments on Web/VPS and auto-refresh smoothly.
 * Includes throttling and error backoff to prevent triggering Cloudflare WAF rate limits.
 */
export function useAutoDeploymentRefresh() {
  useEffect(() => {
    // 1. Catch Vite chunk preload errors (happens when dynamic chunks change hash after redeploy)
    const handlePreloadError = () => {
      console.warn('[AutoDeploy] Chunk loading error detected. Refreshing for new version...');
      window.location.reload();
    };

    window.addEventListener('vite:preloadError', handlePreloadError);

    // 2. Periodic version check with strict throttling to prevent 403 Rate Limiting
    let isReloading = false;
    let lastCheckTime = 0;
    let errorCooldownUntil = 0;
    const MIN_INTERVAL_MS = 45000; // Cooldown 45s between version checks

    const checkNewVersion = async () => {
      const now = Date.now();
      if (isReloading || isUserIdle() || now < errorCooldownUntil || now - lastCheckTime < MIN_INTERVAL_MS) {
        return;
      }
      lastCheckTime = now;

      try {
        const res = await fetch(`/version.json?_t=${now}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
        });

        if (res.status === 403) {
          // If server or Cloudflare WAF returns 403, back off for 2 minutes
          errorCooldownUntil = Date.now() + 120000;
          return;
        }

        if (!res.ok) return;

        const data = await res.json();
        if (data && data.buildTime && typeof __APP_BUILD_TIME__ !== 'undefined') {
          if (String(data.buildTime) !== String(__APP_BUILD_TIME__)) {
            isReloading = true;
            showToast('Đã có bản cập nhật mới! Đang tự động làm mới...', 'success');
            setTimeout(() => {
              window.location.reload();
            }, 800);
          }
        }
      } catch {
        // Silently ignore network errors and back off 30s
        errorCooldownUntil = Date.now() + 30000;
      }
    };

    // Check when user switches back to this browser tab (throttled)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkNewVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial check after 3 seconds
    const initTimer = setTimeout(checkNewVersion, 3000);

    // Periodic check every 60 seconds (safe interval avoiding Cloudflare WAF rate-limiting)
    const interval = setInterval(checkNewVersion, 60000);

    return () => {
      window.removeEventListener('vite:preloadError', handlePreloadError);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, []);
}
