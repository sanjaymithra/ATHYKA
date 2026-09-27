'use client';

import React, { useEffect, useRef, useState } from 'react';
import './CustomCursor.css';

export default function CustomCursor() {
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

    let rafId = null;
    let targetX = -100;
    let targetY = -100;
    let ringX = -100;
    let ringY = -100;
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

    const onPointerMove = e => {
      targetX = e.clientX;
      targetY = e.clientY;

      if (!isInitialized) {
        ringX = targetX;
        ringY = targetY;
        isInitialized = true;
      }

      if (!isVisible) {
        isVisible = true;
        syncDOM();
      }

      const el = e.target;
      if (el) {
        const isTechText = el.closest('.hero-techtext-container, .tech-text, [data-cursor="text"]');
        const isInteractive = el.closest('a, button, [role="button"], .cta, .hero-btn');

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

    const loop = () => {
      if (isInitialized) {
        // Dot follows pointer exactly
        if (dotWrapper) {
          dotWrapper.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
        }

        // Ring follows with easing (lerp factor ~0.18 per frame)
        ringX += (targetX - ringX) * 0.18;
        ringY += (targetY - ringY) * 0.18;

        if (ringWrapper) {
          ringWrapper.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave, { passive: true });
    document.documentElement.addEventListener('pointerenter', onPointerEnter, { passive: true });
    window.addEventListener('blur', onPointerLeave);

    rafId = requestAnimationFrame(loop);

    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.documentElement.removeEventListener('pointerenter', onPointerEnter);
      window.removeEventListener('blur', onPointerLeave);
      if (rafId) cancelAnimationFrame(rafId);
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
}
