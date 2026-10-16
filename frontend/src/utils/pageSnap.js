// Page Snap & Boundary Protection Engine
// Enforces that the zone Z between hero and stage (2px < scrollY < stageTop - 2px)
// is never a resting place, coordinates eased scrolls to 0 / stageTop, and shares
// input locking with PortalTransition.

const EASED_SCROLL_DURATION_MS = 750;
const COOLDOWN_MS = 500;
const IDLE_SNAP_DEBOUNCE_MS = 120;

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

class PageSnapController {
  constructor() {
    this.isEasedScrollRunning = false;
    this.isPortalRunning = false;
    this.isCooldown = false;
    this.cooldownTimer = null;
    this.idleTimer = null;
    this.lastScrollDirection = 'down'; // 'up' | 'down'
    this.lastScrollY = 0;
    this.rafId = null;
    this.getStageTop = () => window.innerHeight;
    this.onSnapComplete = null;
    this.isInitialized = false;
  }

  init({ getStageTop, onSnapComplete }) {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;
    this.getStageTop = getStageTop || (() => window.innerHeight);
    this.onSnapComplete = onSnapComplete || null;
    this.lastScrollY = window.scrollY;

    this.bindEvents();
  }

  isLocked() {
    return this.isEasedScrollRunning || this.isPortalRunning || this.isCooldown;
  }

  setPortalRunning(running) {
    this.isPortalRunning = running;
    if (running) {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.isEasedScrollRunning = false;
      if (this.idleTimer) clearTimeout(this.idleTimer);
    }
  }

  startEasedScroll(targetY, durationMs = EASED_SCROLL_DURATION_MS) {
    if (this.isLocked()) return;

    const isReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (isReduced) {
      window.scrollTo({ top: targetY, behavior: 'instant' });
      this.onSnapComplete?.(targetY);
      return;
    }

    const startY = window.scrollY;
    if (Math.abs(startY - targetY) < 1) return;

    this.isEasedScrollRunning = true;
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.cooldownTimer) clearTimeout(this.cooldownTimer);

    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const easedT = easeInOutCubic(progress);

      const currentY = startY + (targetY - startY) * easedT;
      window.scrollTo({ top: currentY, behavior: 'instant' });

      if (progress < 1) {
        this.rafId = requestAnimationFrame(step);
      } else {
        window.scrollTo({ top: targetY, behavior: 'instant' });
        this.isEasedScrollRunning = false;
        this.rafId = null;

        // 500ms cooldown after completion
        this.isCooldown = true;
        this.cooldownTimer = setTimeout(() => {
          this.isCooldown = false;
        }, COOLDOWN_MS);

        this.onSnapComplete?.(targetY);
      }
    };

    this.rafId = requestAnimationFrame(step);
  }

  bindEvents() {
    // 1. Wheel listener: capture input lock & upward intent at stage top
    const onWheel = (e) => {
      if (this.isLocked()) {
        if (e.cancelable) e.preventDefault();
        return;
      }

      const scrollY = window.scrollY;
      const stageTop = this.getStageTop();

      if (e.deltaY > 0) this.lastScrollDirection = 'down';
      else if (e.deltaY < 0) this.lastScrollDirection = 'up';

      // At top of stage (scrollY <= stageTop + 2) and in zone Z: upward intent (deltaY <= -8) glides to hero (0)
      if (scrollY <= stageTop + 2 && scrollY > 2 && e.deltaY <= -8) {
        if (e.cancelable) e.preventDefault();
        this.startEasedScroll(0);
        return;
      }

      this.scheduleIdleSnap();
    };

    // 2. Touch listeners: capture input lock & swipe down at stage top
    let touchStartY = 0;
    const onTouchStart = (e) => {
      if (e.touches && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (this.isLocked()) {
        if (e.cancelable) e.preventDefault();
      }
    };

    const onTouchEnd = (e) => {
      if (this.isLocked() || !e.changedTouches || e.changedTouches.length === 0) return;

      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY - touchEndY; // deltaY < 0 is swipe down (upward intent)
      const scrollY = window.scrollY;
      const stageTop = this.getStageTop();

      if (deltaY > 0) this.lastScrollDirection = 'down';
      else if (deltaY < 0) this.lastScrollDirection = 'up';

      // At top of stage: swipe down >= 12px glides to hero (0)
      if (scrollY <= stageTop + 2 && scrollY > 2 && deltaY <= -12) {
        this.startEasedScroll(0);
        return;
      }

      this.scheduleIdleSnap();
    };

    // 3. Keydown listener: capture input lock & scroll keys
    const onKeyDown = (e) => {
      const scrollKeys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];

      if (this.isLocked() && scrollKeys.includes(e.key)) {
        e.preventDefault();
        return;
      }

      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const scrollY = window.scrollY;
      const stageTop = this.getStageTop();
      const upwardKeys = ['ArrowUp', 'PageUp', 'Home'];

      if (scrollY <= stageTop + 2 && scrollY > 2 && upwardKeys.includes(e.key)) {
        e.preventDefault();
        this.startEasedScroll(0);
        return;
      }

      if (scrollKeys.includes(e.key)) {
        if (['ArrowDown', 'PageDown', ' '].includes(e.key)) this.lastScrollDirection = 'down';
        else if (['ArrowUp', 'PageUp'].includes(e.key)) this.lastScrollDirection = 'up';
        this.scheduleIdleSnap();
      }
    };

    // 4. Native scroll tracking (captures scrollbar drags and momentum)
    const onScroll = () => {
      if (this.isEasedScrollRunning || this.isPortalRunning) return;

      const currentY = window.scrollY;
      if (currentY > this.lastScrollY) this.lastScrollDirection = 'down';
      else if (currentY < this.lastScrollY) this.lastScrollDirection = 'up';
      this.lastScrollY = currentY;

      this.scheduleIdleSnap();
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, { passive: true });

    this.cleanup = () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll);
      if (this.idleTimer) clearTimeout(this.idleTimer);
      if (this.cooldownTimer) clearTimeout(this.cooldownTimer);
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.isInitialized = false;
    };
  }

  scheduleIdleSnap() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.isLocked()) return;

    this.idleTimer = setTimeout(() => {
      const scrollY = window.scrollY;
      const stageTop = this.getStageTop();

      // Check if scrollY is strictly inside Zone Z (2px < scrollY < stageTop - 2px)
      if (scrollY > 2 && scrollY < stageTop - 2) {
        if (this.lastScrollDirection === 'up') {
          this.startEasedScroll(0);
        } else {
          this.startEasedScroll(stageTop);
        }
      }
    }, IDLE_SNAP_DEBOUNCE_MS);
  }

  destroy() {
    this.cleanup?.();
  }
}

export const pageSnap = new PageSnapController();
