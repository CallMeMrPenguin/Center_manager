/**
 * Utility to accurately distinguish physical mobile devices (phones/tablets)
 * from resized desktop windows (e.g. snapping Windows browser windows).
 */
export function isRealMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  // Allow quick override via URL parameter (e.g. ?mobile=true or ?view=mobile)
  try {
    const params = new URLSearchParams(window.location.search);
    const mobileParam = params.get('mobile') || params.get('view');
    if (mobileParam === 'true' || mobileParam === 'mobile' || mobileParam === '1') {
      return true;
    }
    if (mobileParam === 'false' || mobileParam === 'desktop' || mobileParam === '0') {
      return false;
    }
  } catch {}
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  // Check for common mobile OS identifiers in User-Agent
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Check primary pointer: desktops typically use fine pointers (mouse/trackpad), phones use coarse touch
  const isCoarseTouch =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches &&
    navigator.maxTouchPoints > 0;

  // Only consider as mobile if mobile UA is present or coarse touch on narrow viewport
  return isMobileUA || (isCoarseTouch && window.innerWidth <= 768);
}
