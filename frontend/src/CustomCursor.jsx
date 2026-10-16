'use client';

import React, { useEffect, useRef, useState, memo } from 'react';
import { registerAnimation } from './utils/loop';
import './CustomCursor.css';

const CustomCursor = memo(() => {
  const [enabled, setEnabled] = useState(false);
  const containerRef = useRef(null);
  const dotWrapperRef = useRef(null);
  const ringWrapperRef = useRef(null);

  // Enable only on desktop devices with fine pointer and no reduced-motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const fineQuery = window.matchMedia('(pointer: fine)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const evaluate = () => {
      setEnabled(fineQuery.matches && !motionQuery.matches);
    };

    evaluate();

    fineQuery.addEventListener('change', evaluate);
    motionQuery.addEventListener('change', evaluate);

    return () => {
      fineQuery.removeEventListener('change', evaluate);
      motionQuery.removeEventListener('change', evaluate);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    document.documentElement.classList.add('has-custom-cursor');

    const targetPosRef = { x: -100, y: -100 };
    const ringPosRef = { x: -100, y: -100 };
    let isInitialized = false;

    let isVisible = false;
    let isDown = false;
    let state = 'default'; // 'default' | 'hover' | 'text'

    const container = containerRef.current;
    const dotWrapper = dotWrapperRef.current;
    const ringWrapper = ringWrapperRef.current;

    const syncDOM = () => {
      if (!container) return;
      container.setAttribute('data-visible', isVisible ? 'true' : 'false');
      container.setAttribute('data-down', isDown ? 'true' : 'false');
      container.setAttribute('data-state', state);
    };

    // Event delegation on root for hover states (no per-frame or per-move hit testing!)
    const onPointerOver = (e) => {
      const el = e.target;
      if (!el) return;

      const isTechText = el.closest('.hero-techtext-container, .tech-text, [data-cursor="text"]');
      const isInteractive = el.closest('a, button, [role="button"], .cta, .hero-btn, .orbit-orb, .static-orb-card');

      let nextState = 'default';
      if (isTechText) {
        nextState = 'text';
      } else if (isInteractive) {
        nextState = 'hover';
      }

      if (nextState !== state) {
        state = nextState;
        syncDOM();
      }
    };

    const onPointerMove = (e) => {
      targetPosRef.x = e.clientX;
      targetPosRef.y = e.clientY;

      if (!isInitialized) {
        ringPosRef.x = targetPosRef.x;
        ringPosRef.y = targetPosRef.y;
        isInitialized = true;
      }

      if (!isVisible) {
        isVisible = true;
        syncDOM();
      }
    };

    const onPointerDown = () => {
      isDown = true;
      syncDOM();
    };

    const onPointerUp = () => {
      isDown = false;
      syncDOM();
    };

    const onPointerLeave = () => {
      isVisible = false;
      isDown = false;
      syncDOM();
    };

    const onPointerEnter = () => {
      isVisible = true;
      syncDOM();
    };

    // Register with central loop scheduler: single rAF update per frame
    const unregister = registerAnimation(
      'cursor',
      () => {
        if (!isInitialized) return;

        // Dot follows pointer exactly
        if (dotWrapper) {
          dotWrapper.style.transform = `translate3d(${targetPosRef.x}px, ${targetPosRef.y}px, 0)`;
        }

        // Ring follows with smooth lerp
        ringPosRef.x += (targetPosRef.x - ringPosRef.x) * 0.18;
        ringPosRef.y += (targetPosRef.y - ringPosRef.y) * 0.18;

        if (ringWrapper) {
          ringWrapper.style.transform = `translate3d(${ringPosRef.x.toFixed(1)}px, ${ringPosRef.y.toFixed(1)}px, 0)`;
        }
      },
      {
        fps: 60,
        priority: 100 // High priority for smooth input tracking
      }
    );

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerover', onPointerOver, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave, { passive: true });
    document.documentElement.addEventListener('pointerenter', onPointerEnter, { passive: true });
    window.addEventListener('blur', onPointerLeave);

    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      unregister();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerover', onPointerOver);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.documentElement.removeEventListener('pointerenter', onPointerEnter);
      window.removeEventListener('blur', onPointerLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      className="custom-cursor-root"
      data-state="default"
      data-down="false"
      data-visible="false"
      aria-hidden="true"
    >
      <div ref={dotWrapperRef} className="custom-cursor-dot-wrapper">
        <div className="custom-cursor-dot" />
      </div>
      <div ref={ringWrapperRef} className="custom-cursor-ring-wrapper">
        <div className="custom-cursor-ring" />
      </div>
    </div>
  );
});

CustomCursor.displayName = 'CustomCursor';

export default CustomCursor;
