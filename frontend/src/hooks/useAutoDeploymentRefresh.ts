import { useEffect } from 'react';
import { showToast } from '../components/Toast';

/**
 * Hook to detect new deployments on Vercel/Web and auto-refresh smoothly.
 */
export function useAutoDeploymentRefresh() {
  useEffect(() => {
    // 1. Catch Vite chunk preload errors (happens when dynamic chunks change hash after redeploy)
    const handlePreloadError = () => {
      console.warn('[AutoDeploy] Chunk loading error detected. Refreshing for new version...');
      window.location.reload();
    };

    window.addEventListener('vite:preloadError', handlePreloadError);

    // 2. Periodic version check & tab visibility check
    let isReloading = false;

    const checkNewVersion = async () => {
      if (isReloading) return;
      try {
        const res = await fetch(`/version.json?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (!res.ok) return;

        const data = await res.json();
        if (data && data.buildTime && typeof __APP_BUILD_TIME__ !== 'undefined') {
          if (String(data.buildTime) !== String(__APP_BUILD_TIME__)) {
            isReloading = true;
            showToast('Đã có bản cập nhật mới! Đang tự động làm mới...', 'success');
            setTimeout(() => {
              window.location.reload();
            }, 1200);
          }
        }
      } catch {
        // Silently ignore network errors
      }
    };

    // Check when user switches back to this browser tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkNewVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check periodically every 60 seconds
    const interval = setInterval(checkNewVersion, 60000);

    return () => {
      window.removeEventListener('vite:preloadError', handlePreloadError);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);
}
