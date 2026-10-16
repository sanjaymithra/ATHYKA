import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Ferrofluid from '../Ferrofluid';
import DitherVeil from '../DitherVeil';
import TechText from '../TechText';
import Navbar from '../components/Navbar';
import PhilosophyStage from '../components/PhilosophyStage';
import PortalTransition from '../components/PortalTransition';
import { pageSnap } from '../utils/pageSnap';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useContent } from '../content';

export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const siteSettings = useContent('siteSettings');
  useDocumentMeta(siteSettings.perPageMeta?.home || {
    title: 'ATHYKA — Technology for Business. Technology for People.',
    description: 'Wisdom in thoughts, purpose in creation. Software, automation and AI engineered with mathematical care.'
  });

  const portalRef = useRef(null);
  const techTextRef = useRef(null);
  const stageRef = useRef(null);
  const heroRef = useRef(null);
  const wordmarkRef = useRef(null);
  const faceRef = useRef(null);
  const sentinelRef = useRef(null);

  const [navbarVisible, setNavbarVisible] = useState(pathname === '/home');
  const isInitialMountRef = useRef(true);
  const downwardMomentumLockRef = useRef(false);
  const momentumTimerRef = useRef(null);
  const urlSyncTimerRef = useRef(null);

  // Transition trigger handler (Forward only)
  const triggerForward = useCallback(() => {
    if (pageSnap.isLocked() || portalRef.current?.isRunning?.()) return;
    portalRef.current?.triggerForward?.();
  }, []);

  // Initialize Page Snap (never rest between hero and stage)
  useEffect(() => {
    pageSnap.init({
      getStageTop: () => {
        const stageEl = document.querySelector('#stage');
        return stageEl ? (stageEl.getBoundingClientRect().top + (window.scrollY || document.documentElement.scrollTop || 0)) : window.innerHeight;
      },
      onSnapComplete: (targetY) => {
        if (targetY === 0) {
          navigate('/', { replace: true, preventScrollReset: true });
          portalRef.current?.restoreHeroVisuals?.();
          setNavbarVisible(false);
        } else {
          navigate('/home', { replace: true, preventScrollReset: true });
          setNavbarVisible(true);
          stageRef.current?.enter?.(400);
        }
      }
    });

    return () => {
      pageSnap.destroy();
    };
  }, [navigate]);

  // When portal finishes flying forward onto the stage, PUSH to /home with preventScrollReset: true
  const handleTransitionEnd = useCallback((direction) => {
    if (direction === 'forward') {
      const stageEl = document.querySelector('#stage');
      const stageTop = stageEl ? (stageEl.getBoundingClientRect().top + window.scrollY) : window.innerHeight;
      navigate('/home', { preventScrollReset: true });
      window.scrollTo({ top: stageTop, behavior: 'instant' });

      // Start 700ms momentum cooldown for downward input only
      downwardMomentumLockRef.current = true;
      if (momentumTimerRef.current) clearTimeout(momentumTimerRef.current);
      momentumTimerRef.current = setTimeout(() => {
        downwardMomentumLockRef.current = false;
      }, 700);
    }
  }, [navigate]);

  // Initial mount scroll behavior
  useEffect(() => {
    if (pathname === '/' && isInitialMountRef.current) {
      isInitialMountRef.current = false;
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
      setNavbarVisible(false);
      techTextRef.current?.resume?.();
    } else {
      isInitialMountRef.current = false;
    }
  }, []);

  // Handle popstate explicitly for browser Back to / or /home
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/') {
        portalRef.current?.reset?.();
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        window.scrollTo(0, 0);
        setNavbarVisible(false);
        techTextRef.current?.resume?.();
      } else if (currentPath === '/home') {
        setNavbarVisible(true);
        const stageEl = document.querySelector('#stage');
        const stageTop = stageEl ? (stageEl.getBoundingClientRect().top + window.scrollY) : window.innerHeight;
        window.scrollTo({ top: stageTop, behavior: 'instant' });
        stageRef.current?.enter?.(400);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle direct access or route change to /home
  useEffect(() => {
    if (pathname === '/home') {
      setNavbarVisible(true);
      if (!portalRef.current?.isRunning?.()) {
        const stageEl = document.querySelector('#stage');
        const stageTop = stageEl ? (stageEl.getBoundingClientRect().top + window.scrollY) : window.innerHeight;
        if (window.scrollY < 100) {
          window.scrollTo({ top: stageTop, behavior: 'instant' });
        }
        stageRef.current?.enter?.(400);
      }
    }
  }, [pathname]);

  // Dynamic Scroll Listener: Navbar visibility, Hero visuals restore, and URL Hysteresis Sync
  useEffect(() => {
    const onScroll = () => {
      if (portalRef.current?.isRunning?.()) return;

      const currentScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const stageEl = document.querySelector('#stage');
      const stageTop = stageEl ? (stageEl.getBoundingClientRect().top + currentScrollY) : window.innerHeight;

      // Dynamic navbar visibility
      if (currentScrollY > 0.50 * stageTop) {
        setNavbarVisible(true);
      } else if (currentScrollY < 0.40 * stageTop) {
        setNavbarVisible(false);
        portalRef.current?.restoreHeroVisuals?.();
      }

      // Debounced URL sync with hysteresis (>60% -> /home, <40% -> /)
      if (urlSyncTimerRef.current) clearTimeout(urlSyncTimerRef.current);
      urlSyncTimerRef.current = setTimeout(() => {
        const idleScrollY = window.scrollY || document.documentElement.scrollTop || 0;
        const currentPath = window.location.pathname;

        if (idleScrollY > 0.60 * stageTop) {
          if (currentPath !== '/home') {
            navigate('/home', { replace: true, preventScrollReset: true });
          }
        } else if (idleScrollY < 0.40 * stageTop) {
          if (currentPath !== '/') {
            navigate('/', { replace: true, preventScrollReset: true });
          }
        }
      }, 150);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (urlSyncTimerRef.current) clearTimeout(urlSyncTimerRef.current);
    };
  }, [navigate]);

  // Mouse Parallax on Hero
  useEffect(() => {
    const isReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const isTouch = window.matchMedia?.('(pointer: coarse)')?.matches;
    if (isReduced || isTouch) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = null;

    const onPointerMove = (e) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const loop = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      if (wordmarkRef.current) {
        wordmarkRef.current.style.transform = `translateY(-50%) translate3d(${currentX * 6}px, ${currentY * 6}px, 0)`;
      }
      if (faceRef.current) {
        faceRef.current.style.transform = `translate3d(${-currentX * 10}px, ${-currentY * 10}px, 0)`;
      }

      rafId = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // Gesture: Wheel navigation (Forward only, downward intent at hero scrollY <= 2, route-agnostic)
  useEffect(() => {
    let wheelAccumulator = 0;
    let resetWheelTimer = null;

    const onWheel = (e) => {
      if (pageSnap.isLocked() || portalRef.current?.isRunning?.()) {
        if (e.cancelable) e.preventDefault();
        return;
      }

      // Downward momentum cooldown after landing for 700ms
      if (downwardMomentumLockRef.current && e.deltaY > 0) {
        if (e.cancelable) e.preventDefault();
        return;
      }

      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;

      // Downward wheel at hero (scrollY <= 2)
      if (scrollY <= 2 && e.deltaY > 0) {
        if (e.cancelable) e.preventDefault();
        wheelAccumulator += e.deltaY;
        if (resetWheelTimer) clearTimeout(resetWheelTimer);
        resetWheelTimer = setTimeout(() => {
          wheelAccumulator = 0;
        }, 250);

        if (wheelAccumulator >= 10) {
          wheelAccumulator = 0;
          triggerForward();
        }
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
      if (resetWheelTimer) clearTimeout(resetWheelTimer);
    };
  }, [triggerForward]);

  // Gesture: Touch swipe (Forward only, swipe up >= 16px at hero scrollY <= 2, route-agnostic)
  useEffect(() => {
    let touchStartY = 0;
    let touchStartScrollY = 0;

    const onTouchStart = (e) => {
      if (e.touches && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
        touchStartScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      }
    };

    const onTouchEnd = (e) => {
      if (pageSnap.isLocked() || portalRef.current?.isRunning?.()) return;
      if (!e.changedTouches || e.changedTouches.length === 0) return;

      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY - touchEndY; // deltaY > 0 is swipe up (downward intent)

      if (downwardMomentumLockRef.current && deltaY > 0) return;

      if (touchStartScrollY <= 2 && deltaY >= 16) {
        triggerForward();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [triggerForward]);

  // Gesture: Keyboard navigation (Forward only, Down / PageDown / Space at hero scrollY <= 2, route-agnostic)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (pageSnap.isLocked() || portalRef.current?.isRunning?.()) {
        e.preventDefault();
        return;
      }

      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      const isForwardKey =
        e.key === 'ArrowDown' ||
        e.key === 'Down' ||
        e.key === 'PageDown' ||
        e.key === ' ' ||
        e.key === 'Spacebar' ||
        e.code === 'Space';

      if (downwardMomentumLockRef.current && isForwardKey) {
        e.preventDefault();
        return;
      }

      if (scrollY <= 2 && isForwardKey) {
        e.preventDefault();
        triggerForward();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [triggerForward]);

  const handleStageNavigate = (targetPath) => {
    navigate(targetPath);
  };

  return (
    <div className="homepage-wrapper">
      {/* 1. Fly through the letter portal transition overlay */}
      <PortalTransition
        ref={portalRef}
        techTextRef={techTextRef}
        stageRef={stageRef}
        heroRef={heroRef}
        onNavbarVisibilityChange={setNavbarVisible}
        onTransitionEnd={handleTransitionEnd}
      />

      {/* 2. Scroll-Triggered Navbar (wordmark links to /home) */}
      <Navbar isVisible={navbarVisible} onNavigate={handleStageNavigate} />

      {/* 3. Hero Section (exists above stage, native scrolling reaches it) */}
      <section ref={heroRef} className="app-hero-container">
        {/* Invisible 70% Sentinel */}
        <div
          id="hero-sentinel"
          ref={sentinelRef}
          style={{
            position: 'absolute',
            top: '70%',
            left: 0,
            width: '100%',
            height: '1px',
            pointerEvents: 'none'
          }}
          aria-hidden="true"
        />

        {/* Animated Ferrofluid Background Layer */}
        <div className="ferrofluid-background-layer">
          <Ferrofluid
            colors={['#ffffff', '#ffffff', '#ffffff']}
            speed={0.4}
            scale={1}
            turbulence={1}
            fluidity={0.1}
            rimWidth={0.2}
            sharpness={3}
            shimmer={1.2}
            glow={1.5}
            flowDirection="down"
            opacity={0.9}
            mouseInteraction={true}
            mouseStrength={1}
            mouseRadius={0.3}
          />
        </div>

        {/* Lightened dark scrim behind text */}
        <div className="hero-scrim" />

        {/* Soft warm gold glow behind wordmark */}
        <div className="hero-wordmark-glow" />

        {/* Edge vignette */}
        <div className="hero-vignette" />

        {/* Subtle film grain overlay */}
        <div className="hero-grain" />

        {/* Page Framing Corner Ticks & Bottom Captions */}
        <div className="hero-frame-layer">
          <div className="hero-corner-tick hero-tick-tl" aria-hidden="true" />
          <div className="hero-corner-tick hero-tick-tr" aria-hidden="true" />
          <div className="hero-corner-tick hero-tick-bl" aria-hidden="true" />
          <div className="hero-corner-tick hero-tick-br" aria-hidden="true" />

          <div className="hero-caption-bl" aria-hidden="true">
            <span className="hero-status-dot" />
            <span>DIGITAL SERVICES — TECHNOLOGY EDUCATION</span>
          </div>

          <div className="hero-caption-br" aria-hidden="true">
            TECHNOLOGY FOR BUSINESS. TECHNOLOGY FOR PEOPLE.
          </div>
        </div>

        {/* Interactive Bottom Center Scroll Cue */}
        <button
          type="button"
          className="hero-scroll-cue"
          onClick={triggerForward}
          aria-label="Scroll to explore philosophy stage"
        >
          <span className="hero-scroll-label">SCROLL</span>
          <div className="hero-scroll-track" aria-hidden="true">
            <div className="hero-scroll-runner" />
          </div>
        </button>

        {/* Interactive Left Block: Wordmark + Tagline + Hairline + Explore CTA */}
        <div ref={wordmarkRef} className="hero-wordmark-block" aria-label="ATHYKA">
          <div className="hero-techtext-container">
            <TechText
              ref={techTextRef}
              text="ΛTHYKΛ"
              fontFamily="'Manrope', 'Inter', system-ui, sans-serif"
              fontWeight={700}
              fontSize={140}
              letterSpacing={0.38}
              color="#F6EFDD"
              accentColor="#D8C48A"
              fillGradient={['#FFFFFF', '#E6D9B4']}
              reveal="letter"
              sweep={true}
              speed={0.4}
              specks={8}
              selection={true}
              labels={true}
              draggable={true}
              reach={160}
              dashLength={4}
              dashGap={2}
              strokeWidth={1.5}
            />
          </div>

          <div className="hero-sub-block">
            <p className="hero-tagline">Wisdom in thoughts, purpose in creation.</p>
            <div className="hero-hairline" aria-hidden="true" />
            <div className="hero-cta-group">
              <button
                type="button"
                className="hero-btn hero-btn-explore"
                onClick={triggerForward}
              >
                EXPLORE ↓
              </button>
            </div>
          </div>
        </div>

        {/* Floating DitherVeil Face */}
        <div ref={faceRef} className="dither-veil-wrapper">
          <DitherVeil
            src="https://images.unsplash.com/photo-1737071371043-761e02b1ef95?q=80&w=1400&auto=format&fit=crop"
            fit="contain"
            pattern="floyd"
            pixelSize={2}
            inkColor="#000000"
            paperColor="#f4f4f4"
            revealRadius={180}
            softness={0.6}
            linger={1}
            transparent
            knockout="ink"
            trackWindow
          />
        </div>
      </section>

      {/* 4. Philosophy Stage Section */}
      <PhilosophyStage ref={stageRef} onNavigate={handleStageNavigate} />
    </div>
  );
}
