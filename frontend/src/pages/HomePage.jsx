import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Ferrofluid from '../Ferrofluid';
import DitherVeil from '../DitherVeil';
import TechText from '../TechText';
import Navbar from '../components/Navbar';
import PhilosophyStage from '../components/PhilosophyStage';
import PortalTransition from '../components/PortalTransition';
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
  const hasInitializedHomeRef = useRef(false);

  // Transition trigger handlers
  const triggerForward = useCallback(() => {
    portalRef.current?.triggerForward?.();
  }, []);

  const triggerReverse = useCallback(() => {
    portalRef.current?.triggerReverse?.();
  }, []);

  // When portal finishes flying forward onto the stage, PUSH to /home with preventScrollReset: true
  const handleTransitionEnd = useCallback((direction) => {
    if (direction === 'forward') {
      const stageEl = document.querySelector('#stage');
      const stageTop = stageEl ? (stageEl.getBoundingClientRect().top + window.scrollY) : window.innerHeight;
      navigate('/home', { preventScrollReset: true });
      window.scrollTo({ top: stageTop, behavior: 'instant' });
    }
  }, [navigate]);

  // When on / and portal is idle, ensure scroll position is at the hero (0)
  React.useLayoutEffect(() => {
    if (pathname === '/') {
      portalRef.current?.reset?.();
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
      setNavbarVisible(false);
      techTextRef.current?.resume?.();
      requestAnimationFrame(() => {
        if (window.location.pathname === '/') {
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          window.scrollTo(0, 0);
        }
      });
    }
  }, [pathname]);

  // Handle popstate explicitly for browser Back to /
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/') {
        portalRef.current?.reset?.();
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle direct access or route change to /home
  useEffect(() => {
    if (pathname === '/home') {
      setNavbarVisible(true);
      // If portal is NOT currently running, ensure stage is aligned and light entrance runs
      if (!portalRef.current?.isRunning?.()) {
        const stageEl = document.querySelector('#stage');
        const stageTop = stageEl ? (stageEl.getBoundingClientRect().top + window.scrollY) : window.innerHeight;
        // If window is at 0 (e.g. direct load to /home), jump to stageTop
        if (window.scrollY < 100) {
          window.scrollTo({ top: stageTop, behavior: 'instant' });
        }
        stageRef.current?.enter?.(400);
      }
    }
  }, [pathname]);

  // Sentinel Observer for Navbar when scrolling manually
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (portalRef.current?.isRunning?.()) return;
        const isPastSentinel = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        if (pathname === '/home') {
          setNavbarVisible(true);
        } else {
          setNavbarVisible(isPastSentinel);
        }
      },
      { threshold: 0, rootMargin: '0px' }
    );

    observer.observe(sentinelRef.current);

    const checkScroll = () => {
      if (portalRef.current?.isRunning?.()) return;
      if (pathname === '/home') {
        setNavbarVisible(true);
        return;
      }
      if (sentinelRef.current) {
        const rect = sentinelRef.current.getBoundingClientRect();
        setNavbarVisible(rect.top < 0);
      }
    };

    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', checkScroll);
    };
  }, [pathname]);

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

  // Gesture: Wheel navigation
  useEffect(() => {
    let wheelAccumulator = 0;
    let resetWheelTimer = null;

    const onWheel = (e) => {
      if (portalRef.current?.isRunning?.() || portalRef.current?.isLocked?.()) return;

      const scrollY = window.scrollY;
      const stageEl = document.querySelector('#stage');
      const stageTop = stageEl ? (stageEl.getBoundingClientRect().top + scrollY) : window.innerHeight;

      // Downward wheel at hero
      if (scrollY <= 15 && pathname === '/') {
        if (e.deltaY > 0) {
          if (e.cancelable) e.preventDefault();
          wheelAccumulator += e.deltaY;
          if (resetWheelTimer) clearTimeout(resetWheelTimer);
          resetWheelTimer = setTimeout(() => { wheelAccumulator = 0; }, 250);

          if (wheelAccumulator >= 10) {
            wheelAccumulator = 0;
            triggerForward();
          }
        }
      }
      // Upward wheel at stage top
      else if (Math.abs(scrollY - stageTop) <= 25) {
        if (e.deltaY < 0) {
          if (e.cancelable) e.preventDefault();
          wheelAccumulator += e.deltaY;
          if (resetWheelTimer) clearTimeout(resetWheelTimer);
          resetWheelTimer = setTimeout(() => { wheelAccumulator = 0; }, 250);

          if (wheelAccumulator <= -10) {
            wheelAccumulator = 0;
            triggerReverse();
          }
        }
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', onWheel);
      if (resetWheelTimer) clearTimeout(resetWheelTimer);
    };
  }, [pathname, triggerForward, triggerReverse]);

  // Gesture: Touch swipe
  useEffect(() => {
    let touchStartY = 0;

    const onTouchStart = (e) => {
      if (e.touches && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const onTouchEnd = (e) => {
      if (portalRef.current?.isRunning?.() || portalRef.current?.isLocked?.()) return;
      if (!e.changedTouches || e.changedTouches.length === 0) return;

      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY - touchEndY;
      const scrollY = window.scrollY;
      const stageEl = document.querySelector('#stage');
      const stageTop = stageEl ? (stageEl.getBoundingClientRect().top + scrollY) : window.innerHeight;

      if (scrollY <= 15 && deltaY >= 16 && pathname === '/') {
        triggerForward();
      } else if (Math.abs(scrollY - stageTop) <= 25 && deltaY <= -16) {
        triggerReverse();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [pathname, triggerForward, triggerReverse]);

  // Gesture: Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e) => {
      if (portalRef.current?.isRunning?.() || portalRef.current?.isLocked?.()) return;

      const target = e.target;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const scrollY = window.scrollY;
      const stageEl = document.querySelector('#stage');
      const stageTop = stageEl ? (stageEl.getBoundingClientRect().top + scrollY) : window.innerHeight;

      const forwardKeys = ['ArrowDown', 'PageDown', ' '];
      const reverseKeys = ['ArrowUp', 'PageUp', 'Home'];

      if (scrollY <= 15 && forwardKeys.includes(e.key) && pathname === '/') {
        e.preventDefault();
        triggerForward();
      } else if (Math.abs(scrollY - stageTop) <= 25 && reverseKeys.includes(e.key)) {
        e.preventDefault();
        triggerReverse();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pathname, triggerForward, triggerReverse]);

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
