import { useState, useEffect, useCallback } from 'react';

/**
 * Scroll spy hook for section-based single-page navigation
 * Uses viewport trigger line (55% viewport height) and bottom-of-page detection
 */
export function useScrollSpy(sectionIds = []) {
  const [activeId, setActiveId] = useState(sectionIds[0] || '');

  useEffect(() => {
    if (typeof window === 'undefined' || sectionIds.length === 0) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );

      // Bottom edge case: if scrolled near the bottom of the page, activate the last section
      if (scrollY + windowHeight >= docHeight - 120) {
        setActiveId(sectionIds[sectionIds.length - 1]);
        return;
      }

      // Find the last section whose top has scrolled into the upper 55% of the viewport
      const triggerY = windowHeight * 0.55;
      let currentSection = sectionIds[0];

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= triggerY) {
            currentSection = id;
          }
        }
      }

      setActiveId(currentSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [sectionIds]);

  const scrollToSection = useCallback((id) => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(id);
    if (!el) return;

    const isReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const rect = el.getBoundingClientRect();
    const targetTop = id === 'home' ? 0 : Math.max(0, rect.top + window.scrollY - 24);

    window.scrollTo({
      top: targetTop,
      behavior: isReduced ? 'auto' : 'smooth'
    });
    setActiveId(id);
  }, []);

  return { activeId, scrollToSection };
}
