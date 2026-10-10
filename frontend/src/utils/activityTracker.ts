/**
 * User activity & idle tracker.
 * Pauses background polling intervals when the user is idle or the tab is hidden,
 * preventing Cloudflare WAF bot rate-limiting (403 Forbidden).
 */

let lastActivityTime = Date.now();
const IDLE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes of zero user interaction considered idle

if (typeof window !== 'undefined') {
  const markActive = () => {
    lastActivityTime = Date.now();
  };

  window.addEventListener('mousemove', markActive, { passive: true });
  window.addEventListener('mousedown', markActive, { passive: true });
  window.addEventListener('keydown', markActive, { passive: true });
  window.addEventListener('touchstart', markActive, { passive: true });
  window.addEventListener('scroll', markActive, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      markActive();
    }
  });
}

export function isUserIdle(): boolean {
  if (typeof document !== 'undefined' && document.hidden) return true;
  return Date.now() - lastActivityTime > IDLE_TIMEOUT_MS;
}

export function recordUserActivity(): void {
  lastActivityTime = Date.now();
}
