'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle
} from 'react';
import DocumentIcon from './DocumentIcon';
import NotebookIcon from './NotebookIcon';
import { PHILOSOPHY_QUOTES as DEFAULT_QUOTES, SERVICES as DEFAULT_SERVICES } from '../content/philosophy';
import { useContent } from '../content';
import './PhilosophyStage.css';

const ORBIT_PERIOD_MS = 28000;
const QUOTE_DURATION_MS = 3500;
const LEAVE_DELAY_MS = 400;

const PhilosophyStage = forwardRef(({ onNavigate }, ref) => {
  const philosophyData = useContent('philosophy');
  const PHILOSOPHY_QUOTES = philosophyData?.quotes?.length > 0 ? philosophyData.quotes : DEFAULT_QUOTES;
  const SERVICES = philosophyData?.services?.length > 0 ? philosophyData.services : DEFAULT_SERVICES;

  const stageRef = useRef(null);
  const fieldRef = useRef(null);
  const headlineStackRef = useRef(null);
  const quoteDisplayGridRef = useRef(null);
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

  // Quotes state
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);
  const [outgoingQuoteIndex, setOutgoingQuoteIndex] = useState(null);
  const [hoveredServiceId, setHoveredServiceId] = useState(null); // 'digital' | 'workshops' | null
  const [isCenterHovered, setIsCenterHovered] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isStageVisible, setIsStageVisible] = useState(false);

  // Imperative handle for transition coordination
  useImperativeHandle(ref, () => ({
    enter: () => {
      setIsEntered(true);
      setActiveQuoteIndex(0);
      setOutgoingQuoteIndex(null);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      if (!hasInteractedWithIcon) {
        hintTimerRef.current = setTimeout(() => {
          setHintVisible(true);
        }, 1200);
      }
    },
    leave: () => {
      setIsEntered(false);
      setHintVisible(false);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      setActiveQuoteIndex(0);
      setOutgoingQuoteIndex(null);
    },
    prime: () => {
      setIsEntered(false);
      setHintVisible(false);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      setActiveQuoteIndex(0);
      setOutgoingQuoteIndex(null);
    },
    isEntered: () => isEntered
  }), [hasInteractedWithIcon, isEntered]);

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
  const rafIdRef = useRef(null);
  const lastReadoutTimeRef = useRef(0);

  // Dynamic tilt/bob states for smooth lerp
  const tilt1Ref = useRef({ x: 0, y: 0, bob: 0 });
  const tilt2Ref = useRef({ x: 0, y: 0, bob: 0 });

  // 1. Check reduced motion & hardware capability
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const checkMotion = () => {
      const lowPower = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
      setIsReducedMotion(motionQuery.matches || lowPower);
    };
    checkMotion();
    motionQuery.addEventListener('change', checkMotion);
    return () => motionQuery.removeEventListener('change', checkMotion);
  }, []);

  // 2. Measure widest line and set uniform --q-size across all quotes
  const computeQuoteSize = useCallback(() => {
    if (!stageRef.current || !fieldRef.current) return;
    const stageWidth = fieldRef.current.clientWidth || window.innerWidth;

    // Collect all lines from quotes + hover states
    const allLines = [
      ...PHILOSOPHY_QUOTES.flatMap(q => q.lines),
      ...SERVICES.flatMap(s => s.lines)
    ];

    // Measure with an offscreen canvas
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
  }, []);

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

      // Ellipse outward normal
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

      // Cardinal labels: keep left (180°), right (0°), and top (270°). Remove bottom (90°). No leading zeros.
      if (deg === 0 || deg === 180 || deg === 270) {
        const labelText = `${deg}°`;
        const lx = px + nx * (tickLen + 14);
        const ly = py + ny * (tickLen + 14);
        ctx.fillText(labelText, lx, ly);
      }
    }

    // C. Axes: Horizontal and Vertical hairlines outside quote zone only
    ctx.strokeStyle = 'rgba(246, 239, 221, 0.1)';
    ctx.lineWidth = 1;

    const safePadX = quoteHalfW + 40;
    const safePadY = quoteHalfH + 40;

    // Horizontal Axis (y = cy)
    // Left segment
    ctx.beginPath();
    ctx.moveTo(cx - dialRx, cy);
    ctx.lineTo(cx - safePadX, cy);
    ctx.stroke();
    // Left end tick
    ctx.beginPath();
    ctx.moveTo(cx - dialRx, cy - 4);
    ctx.lineTo(cx - dialRx, cy + 4);
    ctx.stroke();

    // Right segment
    ctx.beginPath();
    ctx.moveTo(cx + safePadX, cy);
    ctx.lineTo(cx + dialRx, cy);
    ctx.stroke();
    // Right end tick
    ctx.beginPath();
    ctx.moveTo(cx + dialRx, cy - 4);
    ctx.lineTo(cx + dialRx, cy + 4);
    ctx.stroke();

    // Vertical Axis (x = cx)
    // Top segment
    ctx.beginPath();
    ctx.moveTo(cx, cy - dialRy);
    ctx.lineTo(cx, cy - safePadY);
    ctx.stroke();
    // Top end tick
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - dialRy);
    ctx.lineTo(cx + 4, cy - dialRy);
    ctx.stroke();

    // Bottom segment
    ctx.beginPath();
    ctx.moveTo(cx, cy + safePadY);
    ctx.lineTo(cx, cy + dialRy);
    ctx.stroke();
    // Bottom end tick
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy + dialRy);
    ctx.lineTo(cx + 4, cy + dialRy);
    ctx.stroke();

    // D. Dimension line in bottom-left corner area (left-aligned with corner tick at x = 28px)
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

      // End ticks
      ctx.beginPath();
      ctx.moveTo(dimX1, dimY - 4);
      ctx.lineTo(dimX1, dimY + 4);
      ctx.moveTo(dimX2, dimY - 4);
      ctx.lineTo(dimX2, dimY + 4);
      ctx.stroke();

      // Dimension label above line, left-aligned at dimX1
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

    // Dynamic collision clearance calculation:
    // When |rx * cos(theta)| <= quoteHalfW + iw, we must have |ry * sin(theta)| > quoteHalfH + ih
    const cosCrit = Math.min(0.88, (quoteHalfW + iw) / rx);
    const sinCrit = Math.sqrt(Math.max(0.1, 1 - cosCrit * cosCrit));
    const minRyClearance = (quoteHalfH + ih + 16) / sinCrit;

    let ry = Math.max(0.26 * H, minRyClearance);
    const maxRy = (H / 2 - 24) / 1.14;
    if (maxRy > quoteHalfH + ih + 16) {
      ry = Math.min(ry, maxRy);
    }

    geomRef.current = { W, H, cx, cy, rx, ry, quoteHalfW, quoteHalfH };

    // Update canvas resolution
    if (canvasRef.current) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasRef.current.width = W * dpr;
      canvasRef.current.height = H * dpr;
      canvasRef.current.style.width = `${W}px`;
      canvasRef.current.style.height = `${H}px`;
    }

    // Render offscreen blueprint
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

  // 5. Visibility observer
  useEffect(() => {
    if (!stageRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStageVisible(entry.isIntersecting);
        if (entry.isIntersecting && !isEntered && window.scrollY > 200) {
          setIsEntered(true);
          if (!hasInteractedWithIcon) {
            hintTimerRef.current = setTimeout(() => {
              setHintVisible(true);
            }, 1200);
          }
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, [hasInteractedWithIcon, isEntered]);

  // 6. Quote Auto-Advance Timer (3.5s per quote)
  const isRotationPaused =
    !isEntered || hoveredServiceId !== null || isCenterHovered || !isStageVisible || isReducedMotion;

  const advanceQuote = useCallback((nextIndex) => {
    setOutgoingQuoteIndex(activeQuoteIndex);
    setActiveQuoteIndex(nextIndex);
    const t = setTimeout(() => {
      setOutgoingQuoteIndex(null);
    }, 500);
    return () => clearTimeout(t);
  }, [activeQuoteIndex]);

  const handleNextQuote = useCallback(() => {
    const next = (activeQuoteIndex + 1) % PHILOSOPHY_QUOTES.length;
    advanceQuote(next);
  }, [activeQuoteIndex, advanceQuote]);

  const handlePrevQuote = useCallback(() => {
    const prev =
      (activeQuoteIndex - 1 + PHILOSOPHY_QUOTES.length) % PHILOSOPHY_QUOTES.length;
    advanceQuote(prev);
  }, [activeQuoteIndex, advanceQuote]);

  useEffect(() => {
    if (isRotationPaused) return;

    const timer = setInterval(() => {
      setActiveQuoteIndex(curr => {
        const next = (curr + 1) % PHILOSOPHY_QUOTES.length;
        setOutgoingQuoteIndex(curr);
        setTimeout(() => setOutgoingQuoteIndex(null), 500);
        return next;
      });
    }, QUOTE_DURATION_MS);

    return () => clearInterval(timer);
  }, [isRotationPaused]);

  // 7. Single rAF Loop: Orbit, 3D Tilt, Comet Trails, and Dial Node Dots
  useEffect(() => {
    if (isReducedMotion) return;

    const loop = (now) => {
      const dt = Math.min(now - lastRafTimeRef.current, 64);
      lastRafTimeRef.current = now;

      const { W, H, cx, cy, rx, ry } = geomRef.current;
      const isHovered = hoveredServiceId !== null;

      // Ease orbit speed to 0 on hover, back to 1 on unhover
      const targetSpeed = isHovered ? 0 : 1.0;
      orbitSpeedRef.current += (targetSpeed - orbitSpeedRef.current) * 0.08;

      if (isStageVisible && orbitSpeedRef.current > 0.001) {
        const deltaAngle = (2 * Math.PI * dt / ORBIT_PERIOD_MS) * orbitSpeedRef.current;
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
      const baseBlur1 = (1 - d1) * 1.2;
      const baseZ1 = d1 < 0.5 ? 6 : 16;

      const isHov1 = hoveredServiceId === 'digital';
      const targetTiltY1 = isHov1 ? 0 : Math.cos(theta1) * 14;
      const targetTiltX1 = isHov1 ? 0 : -sin1 * 6;
      const targetBob1 = isHov1 ? 0 : Math.sin(now * 0.0013) * 4;

      tilt1Ref.current.y += (targetTiltY1 - tilt1Ref.current.y) * 0.1;
      tilt1Ref.current.x += (targetTiltX1 - tilt1Ref.current.x) * 0.1;
      tilt1Ref.current.bob += (targetBob1 - tilt1Ref.current.bob) * 0.1;

      const scale1 = isHov1 ? baseScale1 * 1.12 : baseScale1;
      const opacity1 = isHov1 ? 1.0 : baseOpacity1;
      const blur1 = isHov1 ? 0 : baseBlur1;
      const z1 = isHov1 ? 25 : baseZ1;

      if (orb1Ref.current) {
        orb1Ref.current.style.transform = `translate3d(calc(${x1.toFixed(1)}px - 50%), calc(${y1.toFixed(1)}px - 50%), 0) scale(${scale1.toFixed(3)}) rotateY(${tilt1Ref.current.y.toFixed(1)}deg) rotateX(${tilt1Ref.current.x.toFixed(1)}deg) translateY(${tilt1Ref.current.bob.toFixed(1)}px)`;
        orb1Ref.current.style.opacity = opacity1.toFixed(3);
        orb1Ref.current.style.filter = blur1 > 0.05 ? `blur(${blur1.toFixed(1)}px)` : 'none';
        orb1Ref.current.style.zIndex = z1;
      }

      // --- Position Icon 2 (Workshops) ---
      const x2 = cx + rx * Math.cos(theta2);
      const y2 = cy + ry * Math.sin(theta2);
      const sin2 = Math.sin(theta2);
      const d2 = (sin2 + 1) / 2;
      const baseScale2 = 0.74 + 0.26 * d2;
      const baseOpacity2 = 0.6 + 0.4 * d2;
      const baseBlur2 = (1 - d2) * 1.2;
      const baseZ2 = d2 < 0.5 ? 6 : 16;

      const isHov2 = hoveredServiceId === 'workshops';
      const targetTiltY2 = isHov2 ? 0 : Math.cos(theta2) * 14;
      const targetTiltX2 = isHov2 ? 0 : -sin2 * 6;
      const targetBob2 = isHov2 ? 0 : Math.sin(now * 0.0013 + 1.8) * 4;

      tilt2Ref.current.y += (targetTiltY2 - tilt2Ref.current.y) * 0.1;
      tilt2Ref.current.x += (targetTiltX2 - tilt2Ref.current.x) * 0.1;
      tilt2Ref.current.bob += (targetBob2 - tilt2Ref.current.bob) * 0.1;

      const scale2 = isHov2 ? baseScale2 * 1.12 : baseScale2;
      const opacity2 = isHov2 ? 1.0 : baseOpacity2;
      const blur2 = isHov2 ? 0 : baseBlur2;
      const z2 = isHov2 ? 25 : baseZ2;

      if (orb2Ref.current) {
        orb2Ref.current.style.transform = `translate3d(calc(${x2.toFixed(1)}px - 50%), calc(${y2.toFixed(1)}px - 50%), 0) scale(${scale2.toFixed(3)}) rotateY(${tilt2Ref.current.y.toFixed(1)}deg) rotateX(${tilt2Ref.current.x.toFixed(1)}deg) translateY(${tilt2Ref.current.bob.toFixed(1)}px)`;
        orb2Ref.current.style.opacity = opacity2.toFixed(3);
        orb2Ref.current.style.filter = blur2 > 0.05 ? `blur(${blur2.toFixed(1)}px)` : 'none';
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
      if (canvasRef.current && isStageVisible) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          ctx.clearRect(0, 0, W * dpr, H * dpr);

          // 1. Draw static offscreen blueprint
          if (staticCanvasRef.current) {
            ctx.drawImage(staticCanvasRef.current, 0, 0);
          }

          ctx.save();
          ctx.scale(dpr, dpr);

          // 2. Brighten orbit ellipse on hover
          if (isHovered) {
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(246, 239, 221, 0.4)';
            ctx.lineWidth = 1.25;
            ctx.stroke();
          }

          // 3. Comet trails behind each icon (70° arc, 28 segments)
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

          // 4. Two node dots on the 1.14x dial ring
          const dialRx = rx * 1.14;
          const dialRy = ry * 1.14;

          const phi1 = (now * 0.001 * 2 * Math.PI) / 40; // 40s period
          const phi2 = -(now * 0.001 * 2 * Math.PI) / 65; // 65s reverse

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

      rafIdRef.current = requestAnimationFrame(loop);
    };

    lastRafTimeRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isStageVisible, hoveredServiceId, isReducedMotion]);

  // 8. Hover interactions with 400ms leave delay
  const handleOrbEnter = (serviceId) => {
    setHasInteractedWithIcon(true);
    setHintVisible(false);
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setHoveredServiceId(serviceId);
  };

  const handleOrbLeave = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredServiceId(null);
    }, LEAVE_DELAY_MS);
  };

  const handleOrbClick = (e, href) => {
    if (onNavigate && href.startsWith('/')) {
      e.preventDefault();
      onNavigate(href);
    }
  };

  // Helper to render text with hand-drawn self-drawing gold underline
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

  const hoveredService = useMemo(() => {
    if (!hoveredServiceId) return null;
    return SERVICES.find(s => s.id === hoveredServiceId);
  }, [hoveredServiceId]);

  return (
    <section
      id="stage"
      className={`philosophy-stage ${isEntered ? 'is-entered' : 'is-primed'}`}
      aria-label="Philosophy Stage"
      ref={stageRef}
    >
      {/* Hidden Accessible Headings & Lists for SEO and Screen Readers */}
      <h2 className="sr-only">ATHYKA Philosophy and Principles</h2>
      <ul className="sr-only" aria-label="ATHYKA Core Philosophy Statements">
        {PHILOSOPHY_QUOTES.map(q => (
          <li key={q.id}>{q.lines.join(' ').replace(/\*/g, '')}</li>
        ))}
      </ul>

      {/* Atmospheric Underlay & Subtle Grain */}
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

      {/* ====================================================================
          Stage Field: The Single Reference Bounding Box (top: 64px, bottom: 0)
          ==================================================================== */}
      <div className="stage-field" ref={fieldRef}>
        {/* Architectural Blueprint Orbit Canvas */}
        <canvas ref={canvasRef} className="stage-orbit-canvas" aria-hidden="true" />

        {/* ================================================================
            Centered Headline & Controls Stack
            Anchored strictly at left: 50%, top: 50%, translate(-50%, -50%).
            ================================================================ */}
        <div
          ref={headlineStackRef}
          className={`stage-headline-stack ${hoveredServiceId ? 'is-service-hovered' : ''}`}
          onMouseEnter={() => setIsCenterHovered(true)}
          onMouseLeave={() => setIsCenterHovered(false)}
        >
          {/* Quote Display Grid */}
          <div className="quote-display-grid" ref={quoteDisplayGridRef}>
            {/* The 5 Rotating Philosophy Quotes */}
            {PHILOSOPHY_QUOTES.map((q, idx) => {
              let statusClass = '';
              if (hoveredServiceId) {
                statusClass = 'is-outgoing';
              } else if (idx === activeQuoteIndex) {
                statusClass = 'is-active';
              } else if (idx === outgoingQuoteIndex) {
                statusClass = 'is-outgoing';
              }

              return (
                <div
                  key={q.id}
                  className={`quote-item-block ${statusClass}`}
                  aria-hidden={idx !== activeQuoteIndex || Boolean(hoveredServiceId)}
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
            {SERVICES.map(srv => {
              const isHov = hoveredServiceId === srv.id;
              return (
                <div
                  key={srv.id}
                  className={`quote-item-block ${isHov ? 'is-active' : ''}`}
                  aria-hidden={!isHov}
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
                  {/* Service CTA positioned absolutely below headline */}
                  <a
                    href={srv.href}
                    onClick={(e) => handleOrbClick(e, srv.href)}
                    className="stage-hover-cta"
                    tabIndex={isHov ? 0 : -1}
                  >
                    {srv.cta}
                  </a>
                </div>
              );
            })}
          </div>

          {/* Counter and Linear Progress Bar (Centered child of same stack) */}
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

            {/* Hint Line with Pulsing Gold Dot */}
            <div
              className={`stage-hint-line ${hintVisible && !hasInteractedWithIcon && !hoveredServiceId ? 'is-visible' : ''}`}
              aria-hidden="true"
            >
              <span className="stage-hint-dot" />
              <span>{isTouchDevice ? 'TAP A PLANET TO EXPLORE' : 'CLICK A PLANET TO EXPLORE'}</span>
            </div>

            {/* Reduced motion navigation stepper */}
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

        {/* ================================================================
            Desktop Orbit Plane: Physical SVG Icons
            ================================================================ */}
        <div className="stage-orbit-plane" aria-label="Interactive services orbit">
          {/* Icon 01: Digital Services (macOS Document) */}
          <a
            ref={orb1Ref}
            href={SERVICES[0].href}
            onClick={(e) => handleOrbClick(e, SERVICES[0].href)}
            className={`orbit-orb ${hoveredServiceId === 'digital' ? 'is-hovered' : ''}`}
            onMouseEnter={() => handleOrbEnter('digital')}
            onMouseLeave={handleOrbLeave}
            onFocus={() => handleOrbEnter('digital')}
            onBlur={handleOrbLeave}
            aria-label={SERVICES[0].label}
          >
            <DocumentIcon />
            <div className="orb-label-block">
              <span className="orb-label">{SERVICES[0].label}</span>
              <span ref={readout1Ref} className="orb-theta-readout">θ 045°</span>
            </div>
          </a>

          {/* Icon 02: Workshops (Spiral Notebook) */}
          <a
            ref={orb2Ref}
            href={SERVICES[1].href}
            onClick={(e) => handleOrbClick(e, SERVICES[1].href)}
            className={`orbit-orb ${hoveredServiceId === 'workshops' ? 'is-hovered' : ''}`}
            onMouseEnter={() => handleOrbEnter('workshops')}
            onMouseLeave={handleOrbLeave}
            onFocus={() => handleOrbEnter('workshops')}
            onBlur={handleOrbLeave}
            aria-label={SERVICES[1].label}
          >
            <NotebookIcon />
            <div className="orb-label-block">
              <span className="orb-label">{SERVICES[1].label}</span>
              <span ref={readout2Ref} className="orb-theta-readout">θ 225°</span>
            </div>
          </a>
        </div>

        {/* ================================================================
            Mobile & Reduced Motion Static Cards (<= 768px)
            ================================================================ */}
        <div className="stage-mobile-cards" aria-label="Services overview">
          <a
            href={SERVICES[0].href}
            onClick={(e) => handleOrbClick(e, SERVICES[0].href)}
            className="static-orb-card"
          >
            <div className="static-card-icon-box">
              <DocumentIcon />
            </div>
            <div className="static-orb-label">{SERVICES[0].label}</div>
            <p className="static-orb-desc">{SERVICES[0].description}</p>
          </a>

          <a
            href={SERVICES[1].href}
            onClick={(e) => handleOrbClick(e, SERVICES[1].href)}
            className="static-orb-card"
          >
            <div className="static-card-icon-box">
              <NotebookIcon />
            </div>
            <div className="static-orb-label">{SERVICES[1].label}</div>
            <p className="static-orb-desc">{SERVICES[1].description}</p>
          </a>
        </div>
      </div>
    </section>
  );
});

PhilosophyStage.displayName = 'PhilosophyStage';

export default PhilosophyStage;
