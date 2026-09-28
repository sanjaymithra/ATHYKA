// Adapted from Glyph Portal © 2026 Christian Katzmann, MIT (origin: ktzm.dk).

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle
} from 'react';
import { findEntryPatch } from '../utils/inkPatch';
import './PortalTransition.css';

const DURATION_MS = 2600;
const MOMENTUM_LOCK_MS = 700;
const FAILSAFE_TIMEOUT_MS = 5000;

// Mathematical easing helpers
const clamp01 = (v) => Math.max(0, Math.min(1, v));

const smooth = (min, max, val) => {
  const x = clamp01((val - min) / (max - min));
  return x * x * (3 - 2 * x);
};

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const PortalTransition = forwardRef((props, ref) => {
  const {
    techTextRef,
    stageRef,
    heroRef,
    onNavbarVisibilityChange,
    onTransitionStart,
    onTransitionEnd
  } = props;

  const [isActive, setIsActive] = useState(false);
  const [pState, setPState] = useState(0);
  const [layoutData, setLayoutData] = useState(null);
  const [inkPatch, setInkPatch] = useState(null);
  const layoutDataRef = useRef(null);
  const inkPatchRef = useRef(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [reducedCrossfade, setReducedCrossfade] = useState(false);

  // Animation timeline refs
  const pRef = useRef(0);
  const directionRef = useRef('forward'); // 'forward' | 'reverse'
  const isRunningRef = useRef(false);
  const rafIdRef = useRef(null);
  const startTimeRef = useRef(0);
  const hasCrossedScrollRef = useRef(false);
  const hasTriggeredEnterRef = useRef(false);
  const stageTopRef = useRef(0);
  const failsafeTimerRef = useRef(null);
  const momentumLockTimerRef = useRef(null);
  const isLockedRef = useRef(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(Boolean(mq?.matches));
    const onChange = (e) => setIsReducedMotion(e.matches);
    mq?.addEventListener?.('change', onChange);
    return () => mq?.removeEventListener?.('change', onChange);
  }, []);

  // Compute stageTop offset from document
  const getStageTop = useCallback(() => {
    const stageEl = document.querySelector('#stage');
    if (!stageEl) return window.innerHeight;
    const rect = stageEl.getBoundingClientRect();
    return window.scrollY + rect.top;
  }, []);

  // Set CSS variables for hero fade and ferrofluid opacity
  const applyVisualFades = useCallback((p) => {
    const heroEl = heroRef?.current || document.querySelector('.app-hero-container');
    if (heroEl) {
      // --hero-out: 0 -> 1 over p in [0, 0.22]
      const heroOut = smooth(0, 0.22, p);
      heroEl.style.setProperty('--hero-out', heroOut.toFixed(4));
    }

    // --ferro-opacity on :root: 1 -> 0.3 over p in [0.2, 0.7]
    const ferroProgress = smooth(0.2, 0.7, p);
    const ferroOpacity = 1 - 0.7 * ferroProgress;
    document.documentElement.style.setProperty('--ferro-opacity', ferroOpacity.toFixed(4));
  }, [heroRef]);

  // Clean end of transition
  const finishTransition = useCallback((finalP, direction) => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (failsafeTimerRef.current) clearTimeout(failsafeTimerRef.current);

    isRunningRef.current = false;
    pRef.current = finalP;
    setPState(finalP);
    applyVisualFades(finalP);

    if (direction === 'forward') {
      window.scrollTo({ top: stageTopRef.current, behavior: 'instant' });
      stageRef.current?.enter?.();
      onNavbarVisibilityChange?.(true);
      setIsActive(false);

      // Lock input for 700ms momentum rejection
      isLockedRef.current = true;
      if (momentumLockTimerRef.current) clearTimeout(momentumLockTimerRef.current);
      momentumLockTimerRef.current = setTimeout(() => {
        isLockedRef.current = false;
      }, MOMENTUM_LOCK_MS);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
      techTextRef.current?.setVisible?.(true);
      techTextRef.current?.resume?.();
      stageRef.current?.leave?.();
      onNavbarVisibilityChange?.(false);
      setIsActive(false);
      isLockedRef.current = false;
    }

    onTransitionEnd?.(direction);
  }, [applyVisualFades, onNavbarVisibilityChange, onTransitionEnd, stageRef, techTextRef]);

  // Pure frame render function for progress p in [0, 1]
  const renderFrame = useCallback((p, direction = directionRef.current) => {
    pRef.current = p;
    setPState(p);
    applyVisualFades(p);

    // p = 0.77 crossing side-effect
    if (direction === 'forward' && p >= 0.77 && !hasCrossedScrollRef.current) {
      hasCrossedScrollRef.current = true;
      window.scrollTo({ top: stageTopRef.current, behavior: 'instant' });
    } else if (direction === 'reverse' && p <= 0.77 && !hasCrossedScrollRef.current) {
      hasCrossedScrollRef.current = true;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Eclipse 25% radius hook (approx p = 0.80) -> stage.enter()
    if (direction === 'forward') {
      const tEclipse = smooth(0.78, 1.0, p);
      const rRatio = easeOutCubic(tEclipse);
      if (rRatio >= 0.25 && !hasTriggeredEnterRef.current) {
        hasTriggeredEnterRef.current = true;
        stageRef.current?.enter?.();
      }

      // Navbar appears after p >= 0.90
      if (p >= 0.90) {
        onNavbarVisibilityChange?.(true);
      }
    }
  }, [applyVisualFades, onNavbarVisibilityChange, stageRef]);

  // Main rAF animation step
  const step = useCallback((time) => {
    if (!isRunningRef.current) return;
    const elapsed = time - startTimeRef.current;
    const duration = DURATION_MS;
    const dir = directionRef.current;

    let progress = elapsed / duration;
    if (progress > 1) progress = 1;

    const currentP = dir === 'forward' ? progress : 1 - progress;
    renderFrame(currentP, dir);

    if (progress < 1) {
      rafIdRef.current = requestAnimationFrame(step);
    } else {
      finishTransition(dir === 'forward' ? 1 : 0, dir);
    }
  }, [finishTransition, renderFrame]);

  // Start transition in either direction
  const trigger = useCallback((direction = 'forward') => {
    if (isRunningRef.current || isLockedRef.current) return;

    stageTopRef.current = getStageTop();

    // Check prefers-reduced-motion fallback
    if (isReducedMotion) {
      isRunningRef.current = true;
      isLockedRef.current = true;
      setReducedCrossfade(true);
      setTimeout(() => {
        if (direction === 'forward') {
          window.scrollTo({ top: stageTopRef.current, behavior: 'instant' });
          stageRef.current?.enter?.();
          onNavbarVisibilityChange?.(true);
        } else {
          window.scrollTo({ top: 0, behavior: 'instant' });
          stageRef.current?.leave?.();
          onNavbarVisibilityChange?.(false);
        }
        setTimeout(() => {
          setReducedCrossfade(false);
          isRunningRef.current = false;
          isLockedRef.current = false;
        }, 150);
      }, 150);
      return;
    }

    const layout = techTextRef.current?.getLayout?.();
    if (!layout || !layout.containerRect || layout.glyphs.length === 0) {
      // Fallback smooth scroll if layout not ready
      window.scrollTo({
        top: direction === 'forward' ? stageTopRef.current : 0,
        behavior: 'smooth'
      });
      return;
    }

    layoutDataRef.current = layout;
    setLayoutData(layout);
    const patch = findEntryPatch(layout, 'H');
    inkPatchRef.current = patch;
    setInkPatch(patch);

    // Prepare state
    directionRef.current = direction;
    isRunningRef.current = true;
    isLockedRef.current = true;
    hasCrossedScrollRef.current = false;
    hasTriggeredEnterRef.current = false;

    if (direction === 'forward') {
      pRef.current = 0;
      setPState(0);
      techTextRef.current?.pause?.();
      techTextRef.current?.setVisible?.(false);
      stageRef.current?.prime?.();
      onNavbarVisibilityChange?.(false);
    } else {
      pRef.current = 1;
      setPState(1);
      stageRef.current?.leave?.();
      onNavbarVisibilityChange?.(false);
    }

    setIsActive(true);
    onTransitionStart?.(direction);

    // Start 5s failsafe
    if (failsafeTimerRef.current) clearTimeout(failsafeTimerRef.current);
    failsafeTimerRef.current = setTimeout(() => {
      finishTransition(direction === 'forward' ? 1 : 0, direction);
    }, FAILSAFE_TIMEOUT_MS);

    startTimeRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(step);
  }, [finishTransition, getStageTop, isReducedMotion, onNavbarVisibilityChange, onTransitionStart, stageRef, step, techTextRef]);

  // Window resize handler: immediately jump to destination state
  useEffect(() => {
    const handleResize = () => {
      if (isRunningRef.current) {
        finishTransition(directionRef.current === 'forward' ? 1 : 0, directionRef.current);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [finishTransition]);

  // Reset portal state back to pristine hero (used on router Back navigation to /)
  const resetToHero = useCallback(() => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (failsafeTimerRef.current) clearTimeout(failsafeTimerRef.current);
    if (momentumLockTimerRef.current) clearTimeout(momentumLockTimerRef.current);

    isRunningRef.current = false;
    isLockedRef.current = false;
    pRef.current = 0;
    setPState(0);
    setIsActive(false);

    // Reset visual fades
    const heroEl = heroRef?.current || document.querySelector('.app-hero-container');
    if (heroEl) {
      heroEl.style.setProperty('--hero-out', '0');
    }
    document.documentElement.style.setProperty('--ferro-opacity', '1');

    // Restore TechText
    techTextRef.current?.setVisible?.(true);
    techTextRef.current?.resume?.();

    // Ensure scroll is 0
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [heroRef, techTextRef]);

  // Dev seek hook for deterministic Playwright testing
  useImperativeHandle(ref, () => ({
    seek: (p) => {
      stageTopRef.current = getStageTop();
      if (techTextRef.current) {
        const layout = techTextRef.current.getLayout?.();
        if (layout) {
          layoutDataRef.current = layout;
          setLayoutData(layout);
          const patch = findEntryPatch(layout, 'H');
          inkPatchRef.current = patch;
          setInkPatch(patch);
        }
        techTextRef.current.setVisible?.(false);
      }
      setIsActive(true);
      window.scrollTo({
        top: p < 0.77 ? 0 : stageTopRef.current,
        behavior: 'instant'
      });
      renderFrame(p, p >= pRef.current ? 'forward' : 'reverse');
    },
    triggerForward: () => trigger('forward'),
    triggerReverse: () => trigger('reverse'),
    isRunning: () => isRunningRef.current,
    isLocked: () => isLockedRef.current,
    getP: () => pRef.current,
    reset: resetToHero
  }), [getStageTop, renderFrame, resetToHero, techTextRef, trigger]);

  // Global window.__portal hook for dev / verification automation
  useEffect(() => {
    window.__portal = {
      seek: (p) => {
        stageTopRef.current = getStageTop();
        if (techTextRef.current) {
          const layout = techTextRef.current.getLayout?.();
          if (layout) {
            layoutDataRef.current = layout;
            setLayoutData(layout);
            const patch = findEntryPatch(layout, 'H');
            inkPatchRef.current = patch;
            setInkPatch(patch);
          }
          techTextRef.current.setVisible?.(false);
        }
        setIsActive(true);
        window.scrollTo({
          top: p < 0.77 ? 0 : stageTopRef.current,
          behavior: 'instant'
        });
        renderFrame(p, p >= pRef.current ? 'forward' : 'reverse');
      },
      triggerForward: () => trigger('forward'),
      triggerReverse: () => trigger('reverse'),
      isRunning: () => isRunningRef.current,
      isLocked: () => isLockedRef.current,
      getP: () => pRef.current
    };

    return () => {
      delete window.__portal;
    };
  }, [getStageTop, renderFrame, techTextRef, trigger]);

  // Input locking during active transition:
  // preventDefault on wheel, touchmove, key navigation, and scroll correction
  useEffect(() => {
    if (!isActive && !isLockedRef.current) return;

    const blockEvent = (e) => {
      if (isRunningRef.current || isLockedRef.current) {
        if (e.cancelable) e.preventDefault();
      }
    };

    const blockKeys = (e) => {
      if (!isRunningRef.current && !isLockedRef.current) return;
      const lockedKeys = [
        ' ',
        'Space',
        'ArrowUp',
        'ArrowDown',
        'PageUp',
        'PageDown',
        'Home',
        'End'
      ];
      if (lockedKeys.includes(e.key)) {
        if (e.cancelable) e.preventDefault();
      }
    };

    const handleScrollLock = () => {
      if (!isRunningRef.current) return;
      // Guard scrollY from moving during the transition
      const expectedY = pRef.current < 0.77 ? 0 : stageTopRef.current;
      if (Math.abs(window.scrollY - expectedY) > 2) {
        window.scrollTo({ top: expectedY, behavior: 'instant' });
      }
    };

    window.addEventListener('wheel', blockEvent, { passive: false });
    window.addEventListener('touchmove', blockEvent, { passive: false });
    window.addEventListener('keydown', blockKeys, { capture: true });
    window.addEventListener('scroll', handleScrollLock, { passive: true });

    return () => {
      window.removeEventListener('wheel', blockEvent);
      window.removeEventListener('touchmove', blockEvent);
      window.removeEventListener('keydown', blockKeys, { capture: true });
      window.removeEventListener('scroll', handleScrollLock);
    };
  }, [isActive]);

  // If not active and not crossfading, render nothing
  if (!isActive && !reducedCrossfade) return null;

  if (reducedCrossfade) {
    return <div className="portal-reduced-motion-overlay" aria-hidden="true" />;
  }

  // Camera & Visual Render Calculation
  const W = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const H = typeof window !== 'undefined' ? window.innerHeight : 900;
  const stageCy = H / 2;

  const currentP = pState;

  // Word geometry & bounds
  let wordCenterX = W / 2;
  let wordCenterY = H / 2;
  let wordTopPx = 0;
  let wordBottomPx = H;

  const currentLayout = layoutDataRef.current || layoutData;
  const currentPatch = inkPatchRef.current || inkPatch;

  if (currentLayout && currentLayout.containerRect && currentLayout.glyphs) {
    const cRect = currentLayout.containerRect;
    const xs = currentLayout.glyphs.map((g) => cRect.left + g.x + g.offset.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs) + (currentLayout.size || 140) * 0.75;
    wordCenterX = (minX + maxX) / 2;
    wordCenterY = cRect.top + (currentLayout.baseline || H / 2) - (currentLayout.size || 140) * 0.35;
    wordTopPx = cRect.top;
    wordBottomPx = cRect.top + (currentLayout.size || 140);
  }

  const patchX = currentPatch?.x ?? wordCenterX;
  const patchY = currentPatch?.y ?? wordCenterY;
  const patchRadius = Math.max(4, currentPatch?.radius ?? 20);

  // Phase 1: Camera zoom into letter (p in [0, 0.73])
  const s0 = 1;
  const s1 = Math.hypot(W, H) / (patchRadius * 1.35);

  const tZoom = clamp01(currentP / 0.73);
  const eZoom = easeInOutCubic(tZoom);
  const s = Math.exp(Math.log(s0) + (Math.log(s1) - Math.log(s0)) * eZoom);

  const denom = 1 / s1 - 1 / s0;
  const blendRaw = Math.abs(denom) > 1e-6 ? (1 / s - 1 / s0) / denom : 0;
  const blend = clamp01(blendRaw);

  const focusX = wordCenterX + (patchX - wordCenterX) * blend;
  const focusY = wordCenterY + (patchY - wordCenterY) * blend;

  // Camera roll: subtle -4 deg maximum
  const rollDeg = -4 * smooth(0.06, 0.5, tZoom) * (1 - smooth(0.62, 0.92, tZoom));

  const anchorX = wordCenterX + (W / 2 - wordCenterX) * eZoom;
  const anchorY = wordCenterY + (stageCy - wordCenterY) * eZoom;
  const cameraTransform = `translate(${anchorX.toFixed(2)}, ${anchorY.toFixed(2)}) scale(${s.toFixed(5)}) rotate(${rollDeg.toFixed(3)}) translate(${(-focusX).toFixed(2)}, ${(-focusY).toFixed(2)})`;

  // Phase 3: Eclipse reveal of stage (p in [0.78, 1.0])
  const tEclipse = smooth(0.78, 1.0, currentP);
  const R = easeOutCubic(tEclipse) * 0.8 * Math.hypot(W, H);

  // Gold rim opacity (fades out in last 10% of p)
  let rimOpacity = 0;
  if (currentP >= 0.78 && currentP < 1.0 && R > 1) {
    rimOpacity = currentP > 0.9 ? 1 - smooth(0.9, 1.0, currentP) : 1;
  }

  // Clip path and mask styles
  const isSolidCover = currentP >= 0.73;
  const clipPathStyle = isSolidCover ? 'none' : 'url(#portalClip)';

  let maskStyle = 'none';
  if (currentP >= 0.78 && R > 0) {
    maskStyle = `radial-gradient(circle at ${W / 2}px ${stageCy}px, transparent 0px, transparent ${R}px, #000 ${R + 1.5}px)`;
  }

  const gradientBg = `linear-gradient(to bottom, #FFFFFF ${Math.round(wordTopPx)}px, #E6D9B4 ${Math.round(wordBottomPx)}px)`;

  return (
    <div className="portal-overlay" aria-hidden="true">
      {/* SVG Definitions for Glyph ClipPath */}
      <svg
        className="portal-svg-defs"
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
      >
        <defs>
          <clipPath
            id="portalClip"
            clipPathUnits="userSpaceOnUse"
            transform={cameraTransform}
          >
            {currentLayout &&
              currentLayout.glyphs &&
              currentLayout.glyphs.map((g, idx) => (
                <text
                  key={idx}
                  x={currentLayout.containerRect.left + g.x + g.offset.x}
                  y={currentLayout.containerRect.top + currentLayout.baseline + g.offset.y}
                  fontFamily={currentLayout.fontFamily}
                  fontWeight={currentLayout.fontWeight}
                  fontSize={currentLayout.size}
                  letterSpacing={
                    currentLayout.letterSpacing
                      ? `${currentLayout.letterSpacing * currentLayout.size}px`
                      : undefined
                  }
                  textAnchor="start"
                >
                  {g.char}
                </text>
              ))}
          </clipPath>
        </defs>
      </svg>

      {/* Full-viewport field div masked by portalClip & radial eclipse */}
      <div
        className="portal-field"
        style={{
          background: isSolidCover ? '#F6EFDD' : gradientBg,
          clipPath: clipPathStyle,
          WebkitClipPath: clipPathStyle,
          maskImage: maskStyle,
          WebkitMaskImage: maskStyle
        }}
      />

      {/* Gold Rim following eclipse hole edge */}
      {rimOpacity > 0.01 && (
        <div
          className="portal-rim"
          style={{
            left: `${W / 2}px`,
            top: `${stageCy}px`,
            width: `${Math.round(R * 2)}px`,
            height: `${Math.round(R * 2)}px`,
            opacity: rimOpacity.toFixed(3)
          }}
        />
      )}
    </div>
  );
});

PortalTransition.displayName = 'PortalTransition';

export default PortalTransition;
