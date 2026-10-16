'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
  memo
} from 'react';
import DocumentIcon from './DocumentIcon';
import NotebookIcon from './NotebookIcon';
import { PHILOSOPHY_QUOTES as DEFAULT_QUOTES, SERVICES as DEFAULT_SERVICES } from '../content/philosophy';
import { useContent } from '../content';
import { registerAnimation, unregisterAnimation } from '../utils/loop';
import './PhilosophyStage.css';

const ORBIT_PERIOD_MS = 28000;
const QUOTE_DURATION_MS = 2500;

// Subcomponent: Orbit Plane with static hover glows (no per-frame filter/drop-shadow)
const OrbitPlane = memo(forwardRef(({ services, hoveredServiceId, onOrbClick, onOrbEnter, onOrbLeave, readout1Ref, readout2Ref }, ref) => {
  return (
    <div ref={ref} className="stage-orbit-plane" aria-label="Interactive services orbit">
      {/* Icon 01: Digital Services (macOS Document) */}
      <a
        data-orb="digital"
        href={services[0].href}
        onClick={(e) => onOrbClick(e, services[0].href)}
        className={`orbit-orb ${hoveredServiceId === 'digital' ? 'is-hovered' : ''}`}
        onMouseEnter={() => onOrbEnter('digital')}
        onMouseLeave={onOrbLeave}
        onFocus={() => onOrbEnter('digital')}
        onBlur={onOrbLeave}
        aria-label={services[0].label}
      >
        <div className="orb-hover-glow" aria-hidden="true" />
        <DocumentIcon />
        <div className="orb-label-block">
          <span className="orb-label">{services[0].label}</span>
          <span ref={readout1Ref} className="orb-theta-readout">θ 045°</span>
        </div>
      </a>

      {/* Icon 02: Workshops (Spiral Notebook) */}
      <a
        data-orb="workshops"
        href={services[1].href}
        onClick={(e) => onOrbClick(e, services[1].href)}
        className={`orbit-orb ${hoveredServiceId === 'workshops' ? 'is-hovered' : ''}`}
        onMouseEnter={() => onOrbEnter('workshops')}
        onMouseLeave={onOrbLeave}
        onFocus={() => onOrbEnter('workshops')}
        onBlur={onOrbLeave}
        aria-label={services[1].label}
      >
        <div className="orb-hover-glow" aria-hidden="true" />
        <NotebookIcon />
        <div className="orb-label-block">
          <span className="orb-label">{services[1].label}</span>
          <span ref={readout2Ref} className="orb-theta-readout">θ 225°</span>
        </div>
      </a>
    </div>
  );
}));
OrbitPlane.displayName = 'OrbitPlane';

// Subcomponent: Mobile Cards
const MobileCards = memo(({ services, onOrbClick }) => {
  return (
    <div className="stage-mobile-cards" aria-label="Services overview">
      <a
        href={services[0].href}
        onClick={(e) => onOrbClick(e, services[0].href)}
        className="static-orb-card"
      >
        <div className="static-card-icon-box">
          <DocumentIcon />
        </div>
        <div className="static-orb-label">{services[0].label}</div>
        <p className="static-orb-desc">{services[0].description}</p>
      </a>

      <a
        href={services[1].href}
        onClick={(e) => onOrbClick(e, services[1].href)}
        className="static-orb-card"
      >
        <div className="static-card-icon-box">
          <NotebookIcon />
        </div>
        <div className="static-orb-label">{services[1].label}</div>
        <p className="static-orb-desc">{services[1].description}</p>
      </a>
    </div>
  );
});
MobileCards.displayName = 'MobileCards';

const PhilosophyStage = forwardRef(({ onNavigate }, ref) => {
  const philosophyData = useContent('philosophy');
  const PHILOSOPHY_QUOTES = philosophyData?.quotes?.length > 0 ? philosophyData.quotes : DEFAULT_QUOTES;
  const SERVICES = philosophyData?.services?.length > 0 ? philosophyData.services : DEFAULT_SERVICES;

  const stageRef = useRef(null);
  const fieldRef = useRef(null);
  const headlineStackRef = useRef(null);
  const canvasRef = useRef(null);
  const staticCanvasRef = useRef(null);

  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);
  const readout1Ref = useRef(null);
  const readout2Ref = useRef(null);

  // Entrance and interaction states
  const [isEntered, setIsEntered] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [hasInteractedWithIcon, setHasInteractedWithIcon] = useState(false);
  const hintTimerRef = useRef(null);

  const isTouchDevice =
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  // Slide state machine: only one slide is active at any time
  const [activeSlideId, setActiveSlideId] = useState(PHILOSOPHY_QUOTES[0]?.id || 'quote-0');
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [hoveredServiceId, setHoveredServiceId] = useState(null); // 'digital' | 'workshops' | null
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isCenterHovered, setIsCenterHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isStageVisible, setIsStageVisible] = useState(false);

  // Live state refs for derived pause evaluation
  const isEnteredRef = useRef(false);
  const isStageVisibleRef = useRef(false);
  const isReducedMotionRef = useRef(false);
  const hoveredServiceIdRef = useRef(null);
  const isCenterHoveredRef = useRef(false);
  const isFocusWithinRef = useRef(false);
  const activeSlideIdRef = useRef(PHILOSOPHY_QUOTES[0]?.id || 'quote-0');
  const activeQuoteIndexRef = useRef(0);
  const isTransitioningRef = useRef(false);

  // Slides DOM references registry: id -> { container, lines, cta }
  const slidesRegistryRef = useRef({});
  const runningAnimationsRef = useRef([]);

  // Self-correcting drift-compensated timer refs
  const targetSwapTimeRef = useRef(0);
  const timerIdRef = useRef(null);
  const quoteHistoryRef = useRef([]);

  const clearTimer = useCallback(() => {
    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, []);

  const checkIsPaused = useCallback(() => {
    if (isReducedMotionRef.current) return true;
    if (!isEnteredRef.current) return true;
    if (!isStageVisibleRef.current) return true;
    if (hoveredServiceIdRef.current !== null) return true;
    if (isCenterHoveredRef.current) return true;
    if (isFocusWithinRef.current) return true;
    if (typeof document !== 'undefined' && document.hidden) return true;
    return false;
  }, []);

  // Slide State Machine Transition with WAAPI cancellation and promise cleanup
  const transitionTo = useCallback((targetSlideId) => {
    if (!targetSlideId) return;
    const currentActiveId = activeSlideIdRef.current;
    if (targetSlideId === currentActiveId && !isTransitioningRef.current) return;

    // 1. Cancel running WAAPI animations
    if (runningAnimationsRef.current.length > 0) {
      runningAnimationsRef.current.forEach((anim) => {
        try {
          anim.cancel();
        } catch (e) {}
      });
      runningAnimationsRef.current = [];
    }

    isTransitioningRef.current = true;
    setIsTransitioning(true);

    const outgoingId = currentActiveId;
    const incomingId = targetSlideId;
    activeSlideIdRef.current = incomingId;
    setActiveSlideId(incomingId);

    // If incoming is a quote, update activeQuoteIndex for counter & progress bar
    const quoteIdx = PHILOSOPHY_QUOTES.findIndex((q) => q.id === incomingId);
    if (quoteIdx !== -1) {
      activeQuoteIndexRef.current = quoteIdx;
      setActiveQuoteIndex(quoteIdx);
      quoteHistoryRef.current.push({
        fromId: outgoingId,
        toId: incomingId,
        quoteIndex: quoteIdx,
        timestamp: performance.now(),
        quoteId: incomingId
      });
    }

    // Reset all inactive slides immediately
    Object.entries(slidesRegistryRef.current).forEach(([id, slide]) => {
      if (!slide || !slide.container) return;
      if (id !== outgoingId && id !== incomingId) {
        slide.container.style.visibility = 'hidden';
        slide.container.style.opacity = '0';
        slide.container.style.pointerEvents = 'none';
        slide.lines.forEach((line) => {
          if (line) {
            line.style.transform = 'translateY(105%)';
            line.style.opacity = '0';
          }
        });
        if (slide.cta) {
          slide.cta.style.opacity = '0';
          slide.cta.style.pointerEvents = 'none';
        }
      }
    });

    const createdAnimations = [];

    // 2. Animate Outgoing Slide
    const outgoingSlide = slidesRegistryRef.current[outgoingId];
    if (outgoingSlide && outgoingSlide.container) {
      outgoingSlide.container.style.visibility = 'visible';
      outgoingSlide.container.style.opacity = '1';
      outgoingSlide.container.style.pointerEvents = 'none';

      outgoingSlide.lines.forEach((line) => {
        if (!line) return;
        const anim = line.animate(
          [
            { transform: 'translateY(0)', opacity: 1 },
            { transform: 'translateY(-105%)', opacity: 0 }
          ],
          {
            duration: 550,
            easing: 'cubic-bezier(0.5, 0, 0.75, 0)',
            fill: 'forwards'
          }
        );
        createdAnimations.push(anim);
      });

      if (outgoingSlide.cta) {
        const anim = outgoingSlide.cta.animate(
          [{ opacity: 1 }, { opacity: 0 }],
          { duration: 300, fill: 'forwards' }
        );
        createdAnimations.push(anim);
      }
    }

    // 3. Animate Incoming Slide
    const incomingSlide = slidesRegistryRef.current[incomingId];
    if (incomingSlide && incomingSlide.container) {
      incomingSlide.container.style.visibility = 'visible';
      incomingSlide.container.style.opacity = '1';
      incomingSlide.container.style.pointerEvents = 'auto';

      incomingSlide.lines.forEach((line, lineIdx) => {
        if (!line) return;
        const delay = 300 + lineIdx * 90; // 300ms, then +90ms for line 2
        const anim = line.animate(
          [
            { transform: 'translateY(105%)', opacity: 0 },
            { transform: 'translateY(0)', opacity: 1 }
          ],
          {
            delay,
            duration: 900,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'forwards'
          }
        );
        createdAnimations.push(anim);
      });

      if (incomingSlide.cta) {
        incomingSlide.cta.style.pointerEvents = 'auto';
        const anim = incomingSlide.cta.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          {
            delay: 450,
            duration: 400,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
            fill: 'forwards'
          }
        );
        createdAnimations.push(anim);
      }
    }

    runningAnimationsRef.current = createdAnimations;

    // Clean up in the finished promise handler, never on a setTimeout
    Promise.all(createdAnimations.map((a) => a.finished))
      .then(() => {
        if (activeSlideIdRef.current === incomingId) {
          isTransitioningRef.current = false;
          setIsTransitioning(false);
          runningAnimationsRef.current = [];

          if (outgoingSlide && outgoingSlide.container && outgoingId !== incomingId) {
            outgoingSlide.container.style.visibility = 'hidden';
            outgoingSlide.container.style.opacity = '0';
            outgoingSlide.container.style.pointerEvents = 'none';
          }
        }
      })
      .catch(() => {
        // Interrupted animation threw AbortError, handled cleanly
      });
  }, [PHILOSOPHY_QUOTES]);

  const scheduleQuoteIn = useCallback((delayMs) => {
    clearTimer();
    targetSwapTimeRef.current = performance.now() + delayMs;

    const tick = () => {
      timerIdRef.current = null;
      const now = performance.now();

      if (checkIsPaused()) {
        return;
      }

      const nextIdx = (activeQuoteIndexRef.current + 1) % PHILOSOPHY_QUOTES.length;
      transitionTo(PHILOSOPHY_QUOTES[nextIdx].id);

      let nextTarget = targetSwapTimeRef.current + QUOTE_DURATION_MS;
      if (now - nextTarget > QUOTE_DURATION_MS) {
        nextTarget = now + QUOTE_DURATION_MS;
      }
      targetSwapTimeRef.current = nextTarget;
      const nextDelay = Math.max(16, nextTarget - performance.now());
      timerIdRef.current = setTimeout(tick, nextDelay);
    };

    timerIdRef.current = setTimeout(tick, Math.max(0, delayMs));
  }, [checkIsPaused, clearTimer, transitionTo, PHILOSOPHY_QUOTES]);

  // Imperative handle for transition coordination
  useImperativeHandle(ref, () => ({
    enter: (entranceDelay = 400) => {
      setIsEntered(true);
      isEnteredRef.current = true;
      setIsStageVisible(true);
      isStageVisibleRef.current = true;
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (!hasInteractedWithIcon) {
        hintTimerRef.current = setTimeout(() => {
          setHintVisible(true);
        }, 1200);
      }
      // Start quotes 400ms after entrance, running 2500ms per quote
      scheduleQuoteIn(entranceDelay + QUOTE_DURATION_MS);
    },
    leave: () => {
      setIsEntered(false);
      isEnteredRef.current = false;
      setHintVisible(false);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      clearTimer();
    },
    prime: () => {
      setIsEntered(false);
      isEnteredRef.current = false;
      setHintVisible(false);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      clearTimer();
    },
    isEntered: () => isEnteredRef.current
  }), [clearTimer, hasInteractedWithIcon, scheduleQuoteIn]);

  // Animated geometry values
  const geomRef = useRef({
    W: 1440,
    H: 800,
    cx: 720,
    cy: 400,
    rx: 520,
    ry: 220,
    quoteHalfW: 380,
    quoteHalfH: 90
  });

  const leaveTimeoutRef = useRef(null);
  const orbitAngleRef = useRef(0.25 * Math.PI);
  const orbitSpeedRef = useRef(1.0);
  const lastRafTimeRef = useRef(performance.now());
  const lastReadoutTimeRef = useRef(0);

  // Dynamic tilt/bob states for smooth lerp
  const tilt1Ref = useRef({ x: 0, y: 0, bob: 0 });
  const tilt2Ref = useRef({ x: 0, y: 0, bob: 0 });

  // 1. Check reduced motion & hardware capability
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const checkMotion = () => {
      const lowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
      const reduced = Boolean(motionQuery.matches || lowPower);
      setIsReducedMotion(reduced);
      isReducedMotionRef.current = reduced;
    };
    checkMotion();
    motionQuery.addEventListener('change', checkMotion);
    return () => motionQuery.removeEventListener('change', checkMotion);
  }, []);

  // 2. Measure widest line and set uniform --q-size across all quotes
  const computeQuoteSize = useCallback(() => {
    if (!stageRef.current || !fieldRef.current) return;
    const stageWidth = fieldRef.current.clientWidth || window.innerWidth;

    const allLines = [
      ...PHILOSOPHY_QUOTES.flatMap((q) => q.lines),
      ...SERVICES.flatMap((s) => s.lines)
    ];

    const measureCanvas = document.createElement('canvas');
    const ctx = measureCanvas.getContext('2d');
    if (!ctx) return;

    ctx.font = '600 100px Inter, system-ui, sans-serif';

    let maxW100 = 0;
    for (const rawLine of allLines) {
      const cleanLine = rawLine.replace(/\*/g, '');
      const w = ctx.measureText(cleanLine).width;
      if (w > maxW100) maxW100 = w;
    }

    if (maxW100 <= 0) maxW100 = 1000;

    let targetRatio = 0.62;
    if (stageWidth <= 768) {
      targetRatio = 0.88;
    } else if (stageWidth <= 1100) {
      targetRatio = 0.70;
    }

    const targetWidth = stageWidth * targetRatio;
    const computedSize = (targetWidth / maxW100) * 100;
    const minSize = stageWidth <= 768 ? 26 : (stageWidth <= 1100 ? 36 : 44);
    const clampedSize = Math.max(minSize, Math.min(136, computedSize));

    stageRef.current.style.setProperty('--q-size', `${clampedSize.toFixed(1)}px`);
  }, [PHILOSOPHY_QUOTES, SERVICES]);

  // 3. Pre-render static blueprint layers (dial ticks, axes, dimension line)
  const renderStaticBlueprint = useCallback((W, H, cx, cy, rx, ry, quoteHalfW, quoteHalfH) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const offCanvas = document.createElement('canvas');
    offCanvas.width = W * dpr;
    offCanvas.height = H * dpr;
    const ctx = offCanvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(dpr, dpr);

    // A. Main Orbit Ellipse: solid rgba(246, 239, 221, 0.22)
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(246, 239, 221, 0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // B. Dial Ring at 1.14x
    const dialRx = rx * 1.14;
    const dialRy = ry * 1.14;

    ctx.beginPath();
    ctx.ellipse(cx, cy, dialRx, dialRy, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(246, 239, 221, 0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Ticks every 5°, 15°, 30°
    ctx.font = '9px ui-monospace, "JetBrains Mono", Menlo, monospace';
    ctx.fillStyle = 'rgba(246, 239, 221, 0.35)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let deg = 0; deg < 360; deg += 5) {
      const rad = (deg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const px = cx + dialRx * cos;
      const py = cy + dialRy * sin;

      const nxRaw = cos / dialRx;
      const nyRaw = sin / dialRy;
      const nLen = Math.hypot(nxRaw, nyRaw) || 1;
      const nx = nxRaw / nLen;
      const ny = nyRaw / nLen;

      let tickLen = 4;
      if (deg % 30 === 0) tickLen = 14;
      else if (deg % 15 === 0) tickLen = 8;

      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + nx * tickLen, py + ny * tickLen);
      ctx.strokeStyle = 'rgba(246, 239, 221, 0.16)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (deg === 0 || deg === 180 || deg === 270) {
        const labelText = `${deg}°`;
        const lx = px + nx * (tickLen + 14);
        const ly = py + ny * (tickLen + 14);
        ctx.fillText(labelText, lx, ly);
      }
    }

    // C. Axes: Outside quote zone only
    ctx.strokeStyle = 'rgba(246, 239, 221, 0.1)';
    ctx.lineWidth = 1;

    const safePadX = quoteHalfW + 40;
    const safePadY = quoteHalfH + 40;

    // Horizontal Axis
    ctx.beginPath();
    ctx.moveTo(cx - dialRx, cy);
    ctx.lineTo(cx - safePadX, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - dialRx, cy - 4);
    ctx.lineTo(cx - dialRx, cy + 4);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + safePadX, cy);
    ctx.lineTo(cx + dialRx, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + dialRx, cy - 4);
    ctx.lineTo(cx + dialRx, cy + 4);
    ctx.stroke();

    // Vertical Axis
    ctx.beginPath();
    ctx.moveTo(cx, cy - dialRy);
    ctx.lineTo(cx, cy - safePadY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - dialRy);
    ctx.lineTo(cx + 4, cy - dialRy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy + safePadY);
    ctx.lineTo(cx, cy + dialRy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + dialRy);
    ctx.lineTo(cx + 4, cy + dialRy);
    ctx.stroke();

    // D. Dimension line
    const dimX1 = 28;
    const dimX2 = 28 + 180;
    const dimY = H - 36;
    if (dimY > 100 && W > 768) {
      ctx.beginPath();
      ctx.moveTo(dimX1, dimY);
      ctx.lineTo(dimX2, dimY);
      ctx.strokeStyle = 'rgba(246, 239, 221, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(dimX1, dimY - 4);
      ctx.lineTo(dimX1, dimY + 4);
      ctx.moveTo(dimX2, dimY - 4);
      ctx.lineTo(dimX2, dimY + 4);
      ctx.stroke();

      ctx.font = '10px ui-monospace, "JetBrains Mono", Menlo, monospace';
      ctx.fillStyle = 'rgba(246, 239, 221, 0.4)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('ORBIT — 28S PER REVOLUTION', dimX1, dimY - 6);
    }

    return offCanvas;
  }, []);

  // 4. Update geometry contract on resize & quote bounds change
  const updateGeometry = useCallback(() => {
    if (!fieldRef.current) return;
    const W = fieldRef.current.clientWidth || window.innerWidth;
    const H = fieldRef.current.clientHeight || 750;

    const cx = W / 2;
    const cy = H / 2;

    let quoteHalfW = 380;
    let quoteHalfH = 85;
    if (headlineStackRef.current) {
      const qRect = headlineStackRef.current.getBoundingClientRect();
      if (qRect.width > 0) quoteHalfW = qRect.width / 2;
      if (qRect.height > 0) quoteHalfH = qRect.height / 2;
    }

    const ih = W <= 1100 ? 46 : 55;
    const iw = W <= 1100 ? 42 : 50;

    let rxBase = Math.min(W <= 1100 ? 0.46 * W : 0.44 * W, 640);
    let rx = Math.max(rxBase, quoteHalfW + iw + 0.04 * W);
    const maxRx = W / 2 - iw - 12;
    if (rx > maxRx) {
      rx = maxRx;
    }

    const cosCrit = Math.min(0.88, (quoteHalfW + iw) / rx);
    const sinCrit = Math.sqrt(Math.max(0.1, 1 - cosCrit * cosCrit));
    const minRyClearance = (quoteHalfH + ih + 16) / sinCrit;

    let ry = Math.max(0.26 * H, minRyClearance);
    const maxRy = (H / 2 - 24) / 1.14;
    if (maxRy > quoteHalfH + ih + 16) {
      ry = Math.min(ry, maxRy);
    }

    geomRef.current = { W, H, cx, cy, rx, ry, quoteHalfW, quoteHalfH };

    if (canvasRef.current) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasRef.current.width = W * dpr;
      canvasRef.current.height = H * dpr;
      canvasRef.current.style.width = `${W}px`;
      canvasRef.current.style.height = `${H}px`;
    }

    staticCanvasRef.current = renderStaticBlueprint(
      W, H, cx, cy, rx, ry, quoteHalfW, quoteHalfH
    );
  }, [renderStaticBlueprint]);

  useEffect(() => {
    computeQuoteSize();
    updateGeometry();

    const onResize = () => {
      computeQuoteSize();
      updateGeometry();
    };

    window.addEventListener('resize', onResize);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        computeQuoteSize();
        updateGeometry();
      });
    }

    return () => window.removeEventListener('resize', onResize);
  }, [computeQuoteSize, updateGeometry]);

  // 5. Visibility observer & auto-start
  const checkVisibility = useCallback(() => {
    if (!stageRef.current) return false;
    const rect = stageRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const visibleH = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
    const ratio = visibleH / Math.min(rect.height || vh, vh);
    return ratio >= 0.5;
  }, []);

  useEffect(() => {
    if (!stageRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const is50 = entry.intersectionRatio >= 0.5;
        setIsStageVisible(is50);
        isStageVisibleRef.current = is50;

        if (is50 && !isEnteredRef.current) {
          setIsEntered(true);
          isEnteredRef.current = true;
          scheduleQuoteIn(QUOTE_DURATION_MS);
          if (!hasInteractedWithIcon) {
            hintTimerRef.current = setTimeout(() => {
              setHintVisible(true);
            }, 1200);
          }
        } else if (is50 && isEnteredRef.current) {
          if (!timerIdRef.current && !checkIsPaused()) {
            scheduleQuoteIn(QUOTE_DURATION_MS);
          }
        }
      },
      { threshold: [0, 0.5, 1.0] }
    );

    observer.observe(stageRef.current);

    const isVisibleNow = checkVisibility();
    if (isVisibleNow) {
      setIsStageVisible(true);
      isStageVisibleRef.current = true;
      setIsEntered(true);
      isEnteredRef.current = true;
      if (!timerIdRef.current) {
        scheduleQuoteIn(QUOTE_DURATION_MS);
      }
    }

    return () => observer.disconnect();
  }, [checkVisibility, checkIsPaused, hasInteractedWithIcon, scheduleQuoteIn]);

  // Tab visibility change listener: pause when hidden, resume when visible
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        clearTimer();
      } else {
        if (!timerIdRef.current && !checkIsPaused()) {
          scheduleQuoteIn(QUOTE_DURATION_MS);
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [checkIsPaused, clearTimer, scheduleQuoteIn]);

  // Window debug hook for test automation and verification
  useEffect(() => {
    window.__stageQuotes = {
      getCurrentIndex: () => activeQuoteIndexRef.current,
      getActiveSlideId: () => activeSlideIdRef.current,
      getHistory: () => [...quoteHistoryRef.current],
      clearHistory: () => {
        quoteHistoryRef.current = [];
      },
      isPaused: () => checkIsPaused(),
      advance: () => {
        const next = (activeQuoteIndexRef.current + 1) % PHILOSOPHY_QUOTES.length;
        transitionTo(PHILOSOPHY_QUOTES[next].id);
      },
      transitionTo: (id) => transitionTo(id),
      scheduleNext: (delay = QUOTE_DURATION_MS) => scheduleQuoteIn(delay)
    };
  }, [checkIsPaused, scheduleQuoteIn, transitionTo, PHILOSOPHY_QUOTES]);

  // Derived pause flag for progress bar & UI states
  const isRotationPaused = Boolean(
    !isEntered ||
    hoveredServiceId !== null ||
    isCenterHovered ||
    isFocusWithin ||
    !isStageVisible ||
    isReducedMotion ||
    (typeof document !== 'undefined' && document.hidden)
  );

  const handleNextQuote = useCallback(() => {
    const next = (activeQuoteIndexRef.current + 1) % PHILOSOPHY_QUOTES.length;
    transitionTo(PHILOSOPHY_QUOTES[next].id);
  }, [transitionTo, PHILOSOPHY_QUOTES.length]);

  const handlePrevQuote = useCallback(() => {
    const prev = (activeQuoteIndexRef.current - 1 + PHILOSOPHY_QUOTES.length) % PHILOSOPHY_QUOTES.length;
    transitionTo(PHILOSOPHY_QUOTES[prev].id);
  }, [transitionTo, PHILOSOPHY_QUOTES.length]);

  // 7. Central Loop Scheduler Registration for Orbit Animation
  useEffect(() => {
    if (isReducedMotion) return;

    // Cache element references for zero layout recalculation
    const orbPlane = document.querySelector('.stage-orbit-plane');
    if (orbPlane) {
      orb1Ref.current = orbPlane.querySelector('[data-orb="digital"]');
      orb2Ref.current = orbPlane.querySelector('[data-orb="workshops"]');
    }

    const unregister = registerAnimation(
      'stage-orbit',
      (now, dt) => {
        const safeDt = Math.min(dt, 64);
        const { W, H, cx, cy, rx, ry } = geomRef.current;
        const isHovered = hoveredServiceIdRef.current !== null;

        const targetSpeed = isHovered ? 0 : 1.0;
        orbitSpeedRef.current += (targetSpeed - orbitSpeedRef.current) * 0.08;

        if (isStageVisibleRef.current && orbitSpeedRef.current > 0.001) {
          const deltaAngle = ((2 * Math.PI * safeDt) / ORBIT_PERIOD_MS) * orbitSpeedRef.current;
          orbitAngleRef.current = (orbitAngleRef.current + deltaAngle) % (2 * Math.PI);
        }

        const angle = orbitAngleRef.current;
        const theta1 = angle;
        const theta2 = (angle + Math.PI) % (2 * Math.PI);

        // --- Position Icon 1 (Digital) ---
        const x1 = cx + rx * Math.cos(theta1);
        const y1 = cy + ry * Math.sin(theta1);
        const sin1 = Math.sin(theta1);
        const d1 = (sin1 + 1) / 2;
        const baseScale1 = 0.74 + 0.26 * d1;
        const baseOpacity1 = 0.6 + 0.4 * d1;
        const baseZ1 = d1 < 0.5 ? 6 : 16;

        const isHov1 = hoveredServiceIdRef.current === 'digital';
        const targetTiltY1 = isHov1 ? 0 : Math.cos(theta1) * 14;
        const targetTiltX1 = isHov1 ? 0 : -sin1 * 6;
        const targetBob1 = isHov1 ? 0 : Math.sin(now * 0.0013) * 4;

        tilt1Ref.current.y += (targetTiltY1 - tilt1Ref.current.y) * 0.1;
        tilt1Ref.current.x += (targetTiltX1 - tilt1Ref.current.x) * 0.1;
        tilt1Ref.current.bob += (targetBob1 - tilt1Ref.current.bob) * 0.1;

        const scale1 = isHov1 ? baseScale1 * 1.12 : baseScale1;
        const opacity1 = isHov1 ? 1.0 : baseOpacity1;
        const z1 = isHov1 ? 25 : baseZ1;

        if (orb1Ref.current) {
          orb1Ref.current.style.transform = `translate3d(calc(${x1.toFixed(1)}px - 50%), calc(${y1.toFixed(1)}px - 50%), 0) scale(${scale1.toFixed(3)}) rotateY(${tilt1Ref.current.y.toFixed(1)}deg) rotateX(${tilt1Ref.current.x.toFixed(1)}deg) translateY(${tilt1Ref.current.bob.toFixed(1)}px)`;
          orb1Ref.current.style.opacity = opacity1.toFixed(3);
          orb1Ref.current.style.zIndex = z1;
        }

        // --- Position Icon 2 (Workshops) ---
        const x2 = cx + rx * Math.cos(theta2);
        const y2 = cy + ry * Math.sin(theta2);
        const sin2 = Math.sin(theta2);
        const d2 = (sin2 + 1) / 2;
        const baseScale2 = 0.74 + 0.26 * d2;
        const baseOpacity2 = 0.6 + 0.4 * d2;
        const baseZ2 = d2 < 0.5 ? 6 : 16;

        const isHov2 = hoveredServiceIdRef.current === 'workshops';
        const targetTiltY2 = isHov2 ? 0 : Math.cos(theta2) * 14;
        const targetTiltX2 = isHov2 ? 0 : -sin2 * 6;
        const targetBob2 = isHov2 ? 0 : Math.sin(now * 0.0013 + 1.8) * 4;

        tilt2Ref.current.y += (targetTiltY2 - tilt2Ref.current.y) * 0.1;
        tilt2Ref.current.x += (targetTiltX2 - tilt2Ref.current.x) * 0.1;
        tilt2Ref.current.bob += (targetBob2 - tilt2Ref.current.bob) * 0.1;

        const scale2 = isHov2 ? baseScale2 * 1.12 : baseScale2;
        const opacity2 = isHov2 ? 1.0 : baseOpacity2;
        const z2 = isHov2 ? 25 : baseZ2;

        if (orb2Ref.current) {
          orb2Ref.current.style.transform = `translate3d(calc(${x2.toFixed(1)}px - 50%), calc(${y2.toFixed(1)}px - 50%), 0) scale(${scale2.toFixed(3)}) rotateY(${tilt2Ref.current.y.toFixed(1)}deg) rotateX(${tilt2Ref.current.x.toFixed(1)}deg) translateY(${tilt2Ref.current.bob.toFixed(1)}px)`;
          orb2Ref.current.style.opacity = opacity2.toFixed(3);
          orb2Ref.current.style.zIndex = z2;
        }

        // Update mono readouts 5 times per second
        if (now - lastReadoutTimeRef.current >= 200) {
          lastReadoutTimeRef.current = now;
          const deg1 = Math.round((((theta1 * 180) / Math.PI) % 360 + 360) % 360);
          const deg2 = Math.round((((theta2 * 180) / Math.PI) % 360 + 360) % 360);
          if (readout1Ref.current) readout1Ref.current.textContent = `θ ${String(deg1).padStart(3, '0')}°`;
          if (readout2Ref.current) readout2Ref.current.textContent = `θ ${String(deg2).padStart(3, '0')}°`;
        }

        // --- Draw Dynamic Canvas Layers ---
        if (canvasRef.current && isStageVisibleRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            ctx.clearRect(0, 0, W * dpr, H * dpr);

            if (staticCanvasRef.current) {
              ctx.drawImage(staticCanvasRef.current, 0, 0);
            }

            ctx.save();
            ctx.scale(dpr, dpr);

            if (isHovered) {
              ctx.beginPath();
              ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
              ctx.strokeStyle = 'rgba(246, 239, 221, 0.4)';
              ctx.lineWidth = 1.25;
              ctx.stroke();
            }

            // Comet trails (70° arc, 28 segments)
            const trailRad = (70 * Math.PI) / 180;
            const segCount = 28;

            const drawCometTrail = (leadAngle) => {
              for (let s = 0; s < segCount; s++) {
                const a1 = leadAngle - ((segCount - s) * trailRad) / segCount;
                const a2 = leadAngle - ((segCount - (s + 1)) * trailRad) / segCount;
                const alpha = (s / segCount) * 0.45;

                ctx.beginPath();
                ctx.ellipse(cx, cy, rx, ry, 0, a1, a2);
                ctx.strokeStyle = `rgba(216, 196, 138, ${alpha.toFixed(3)})`;
                ctx.lineWidth = 1.25;
                ctx.stroke();
              }
            };

            drawCometTrail(theta1);
            drawCometTrail(theta2);

            // Node dots on dial ring
            const dialRx = rx * 1.14;
            const dialRy = ry * 1.14;

            const phi1 = (now * 0.001 * 2 * Math.PI) / 40;
            const phi2 = -(now * 0.001 * 2 * Math.PI) / 65;

            const dot1X = cx + dialRx * Math.cos(phi1);
            const dot1Y = cy + dialRy * Math.sin(phi1);
            const dot2X = cx + dialRx * Math.cos(phi2);
            const dot2Y = cy + dialRy * Math.sin(phi2);

            ctx.fillStyle = 'rgba(246, 239, 221, 0.65)';
            ctx.beginPath();
            ctx.arc(dot1X, dot1Y, 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(dot2X, dot2Y, 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        }
      },
      {
        getVisible: () => isStageVisibleRef.current && isEnteredRef.current,
        fps: 60,
        priority: 50
      }
    );

    return () => {
      unregister();
    };
  }, [isReducedMotion]);

  // 8. Hover and Focus interactions
  const handleOrbEnter = (serviceId) => {
    setHasInteractedWithIcon(true);
    setHintVisible(false);
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    hoveredServiceIdRef.current = serviceId;
    setHoveredServiceId(serviceId);
    clearTimer();
    // Hover swap goes through same transitionTo function
    transitionTo(serviceId);
  };

  const handleOrbLeave = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    hoveredServiceIdRef.current = null;
    setHoveredServiceId(null);
    // Hover leave goes back to active quote through transitionTo
    const returnQuoteId = PHILOSOPHY_QUOTES[activeQuoteIndexRef.current].id;
    transitionTo(returnQuoteId);
    scheduleQuoteIn(QUOTE_DURATION_MS);
  };

  const handleCenterEnter = () => {
    setIsCenterHovered(true);
    isCenterHoveredRef.current = true;
  };

  const handleCenterLeave = () => {
    setIsCenterHovered(false);
    isCenterHoveredRef.current = false;
    if (!checkIsPaused()) {
      scheduleQuoteIn(QUOTE_DURATION_MS);
    }
  };

  const handleStageFocus = () => {
    setIsFocusWithin(true);
    isFocusWithinRef.current = true;
  };

  const handleStageBlur = (e) => {
    if (stageRef.current && !stageRef.current.contains(e.relatedTarget)) {
      setIsFocusWithin(false);
      isFocusWithinRef.current = false;
      if (!checkIsPaused()) {
        scheduleQuoteIn(QUOTE_DURATION_MS);
      }
    }
  };

  const handleOrbClick = (e, href) => {
    if (onNavigate && href.startsWith('/')) {
      e.preventDefault();
      onNavigate(href);
    }
  };

  // Helper to render text with hand-drawn gold underline
  const renderLine = (lineText) => {
    const parts = lineText.split(/(\*[^*]+\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        const word = part.slice(1, -1);
        return (
          <span key={idx} className="quote-accent-word">
            <em>{word}</em>
            <svg
              className="accent-underline-svg"
              viewBox="0 0 100 12"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                className="accent-underline-path"
                d="M 2 7 Q 25 3, 50 6 T 98 5"
              />
            </svg>
          </span>
        );
      }
      return part;
    });
  };

  // Register slide DOM elements into slidesRegistryRef
  const registerSlide = (id, el, line1, line2, cta) => {
    if (!el) {
      delete slidesRegistryRef.current[id];
      return;
    }
    slidesRegistryRef.current[id] = {
      container: el,
      lines: [line1, line2].filter(Boolean),
      cta: cta || null
    };

    // Ensure initial visual state matches activeSlideId
    if (id === activeSlideIdRef.current) {
      el.style.visibility = 'visible';
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
      if (line1) {
        line1.style.transform = 'translateY(0)';
        line1.style.opacity = '1';
      }
      if (line2) {
        line2.style.transform = 'translateY(0)';
        line2.style.opacity = '1';
      }
      if (cta) {
        cta.style.opacity = '1';
        cta.style.pointerEvents = 'auto';
      }
    } else {
      el.style.visibility = 'hidden';
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      if (line1) {
        line1.style.transform = 'translateY(105%)';
        line1.style.opacity = '0';
      }
      if (line2) {
        line2.style.transform = 'translateY(105%)';
        line2.style.opacity = '0';
      }
      if (cta) {
        cta.style.opacity = '0';
        cta.style.pointerEvents = 'none';
      }
    }
  };

  return (
    <section
      id="stage"
      className={`philosophy-stage ${isEntered ? 'is-entered' : 'is-primed'}`}
      aria-label="Philosophy Stage"
      ref={stageRef}
      onFocus={handleStageFocus}
      onBlur={handleStageBlur}
    >
      <h2 className="sr-only">ATHYKA Philosophy and Principles</h2>
      <ul className="sr-only" aria-label="ATHYKA Core Philosophy Statements">
        {PHILOSOPHY_QUOTES.map((q) => (
          <li key={q.id}>{q.lines.join(' ').replace(/\*/g, '')}</li>
        ))}
      </ul>

      {/* Atmospheric Underlay & Subtle Static Grain */}
      <div className="stage-fluid-underlay" aria-hidden="true" />
      <div className="stage-grain" aria-hidden="true" />

      {/* Section Framing Corner Ticks */}
      <div className="stage-corner-tick stage-tick-tl" aria-hidden="true" />
      <div className="stage-corner-tick stage-tick-tr" aria-hidden="true" />
      <div className="stage-corner-tick stage-tick-bl" aria-hidden="true" />
      <div className="stage-corner-tick stage-tick-br" aria-hidden="true" />

      {/* Top Left Studio Kicker */}
      <div className="stage-label-tl" aria-hidden="true">
        ( 02 ) — PHILOSOPHY
      </div>

      <div className="stage-field" ref={fieldRef}>
        <canvas ref={canvasRef} className="stage-orbit-canvas" aria-hidden="true" />

        <div
          ref={headlineStackRef}
          className={`stage-headline-stack ${hoveredServiceId ? 'is-service-hovered' : ''} ${
            isTransitioning ? 'is-transitioning' : ''
          }`}
          onMouseEnter={handleCenterEnter}
          onMouseLeave={handleCenterLeave}
        >
          <div className="quote-display-grid">
            {/* The 5 Rotating Philosophy Quotes */}
            {PHILOSOPHY_QUOTES.map((q, idx) => {
              const isActive = activeSlideId === q.id;
              return (
                <div
                  key={q.id}
                  id={q.id}
                  ref={(el) => {
                    if (el) {
                      const lines = el.querySelectorAll('.quote-line-text');
                      registerSlide(q.id, el, lines[0], lines[1], null);
                    }
                  }}
                  className={`quote-item-block ${isActive ? 'is-active' : ''}`}
                  aria-hidden={!isActive}
                >
                  <div className="quote-line-mask line-1">
                    <span className="quote-line-text">
                      {renderLine(q.lines[0])}
                    </span>
                  </div>
                  <div className="quote-line-mask line-2">
                    <span className="quote-line-text">
                      {renderLine(q.lines[1])}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Hovered Service Headline Overlays */}
            {SERVICES.map((srv) => {
              const isActive = activeSlideId === srv.id;
              return (
                <div
                  key={srv.id}
                  id={srv.id}
                  ref={(el) => {
                    if (el) {
                      const lines = el.querySelectorAll('.quote-line-text');
                      const cta = el.querySelector('.stage-hover-cta');
                      registerSlide(srv.id, el, lines[0], lines[1], cta);
                    }
                  }}
                  className={`quote-item-block ${isActive ? 'is-active' : ''}`}
                  aria-hidden={!isActive}
                >
                  <div className="quote-line-mask line-1">
                    <span className="quote-line-text">
                      {renderLine(srv.lines[0])}
                    </span>
                  </div>
                  <div className="quote-line-mask line-2">
                    <span className="quote-line-text">
                      {renderLine(srv.lines[1])}
                    </span>
                  </div>
                  <a
                    href={srv.href}
                    onClick={(e) => handleOrbClick(e, srv.href)}
                    className="stage-hover-cta"
                    tabIndex={isActive ? 0 : -1}
                  >
                    {srv.cta}
                  </a>
                </div>
              );
            })}
          </div>

          {/* Controls: Counter and Linear Progress Bar */}
          <div className="stage-controls-stack" aria-label="Quote progress indicator">
            <div className="stage-counter">
              {String(activeQuoteIndex + 1).padStart(2, '0')} /{' '}
              {String(PHILOSOPHY_QUOTES.length).padStart(2, '0')}
            </div>
            <div className="stage-progress-track">
              <div
                key={activeQuoteIndex}
                className={`stage-progress-bar ${isEntered ? 'is-running' : ''} ${
                  isRotationPaused ? 'is-paused' : ''
                }`}
              />
            </div>

            <div
              className={`stage-hint-line ${hintVisible && !hasInteractedWithIcon && !hoveredServiceId ? 'is-visible' : ''}`}
              aria-hidden="true"
            >
              <span className="stage-hint-dot" />
              <span>{isTouchDevice ? 'TAP A PLANET TO EXPLORE' : 'CLICK A PLANET TO EXPLORE'}</span>
            </div>

            {isReducedMotion && (
              <div className="reduced-motion-nav" aria-label="Manual quote stepper">
                <button
                  type="button"
                  className="reduced-motion-btn"
                  onClick={handlePrevQuote}
                  aria-label="Previous quote"
                >
                  ← PREV
                </button>
                <button
                  type="button"
                  className="reduced-motion-btn"
                  onClick={handleNextQuote}
                  aria-label="Next quote"
                >
                  NEXT →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Orbit Plane */}
        <OrbitPlane
          services={SERVICES}
          hoveredServiceId={hoveredServiceId}
          onOrbClick={handleOrbClick}
          onOrbEnter={handleOrbEnter}
          onOrbLeave={handleOrbLeave}
          readout1Ref={readout1Ref}
          readout2Ref={readout2Ref}
        />

        {/* Mobile & Reduced Motion Static Cards */}
        <MobileCards services={SERVICES} onOrbClick={handleOrbClick} />
      </div>
    </section>
  );
});

PhilosophyStage.displayName = 'PhilosophyStage';

export default PhilosophyStage;
