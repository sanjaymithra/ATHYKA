'use client';

import React, { useEffect, useState, useRef } from 'react';
import { NAV_LINKS, NAV_CTA } from '../content/philosophy';
import './Navbar.css';

export default function Navbar({ isVisible = false, onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const overlayRef = useRef(null);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Handle Escape key to close mobile menu & focus trap
  useEffect(() => {
    const onKeyDown = e => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
      if (e.key === 'Tab' && mobileOpen && overlayRef.current) {
        const focusable = overlayRef.current.querySelectorAll(
          'a[href], button:not([disabled])'
        );
        if (focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  // IntersectionObserver to highlight current active section
  useEffect(() => {
    const sectionIds = ['stage', 'about', 'contact'];
    const elements = sectionIds
      .map(id => document.getElementById(id))
      .filter(Boolean);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.35 }
    );

    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleLinkClick = (e, href) => {
    setMobileOpen(false);

    // If it's a route path (like /digital-services or /workshops)
    if (href.startsWith('/')) {
      if (onNavigate) {
        e.preventDefault();
        onNavigate(href);
      }
      return;
    }

    // If it's a hash anchor
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.slice(1);
      if (!targetId) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <nav
        className={`athyka-navbar ${isVisible ? 'is-visible' : ''}`}
        aria-label="Main Navigation"
      >
        {/* Left: small wordmark linking to /home */}
        <a
          href="/home"
          className="nav-wordmark"
          aria-label="ATHYKA"
          onClick={e => handleLinkClick(e, '/home')}
        >
          ΛTHYKΛ
        </a>

        {/* Center-right desktop links & CTA */}
        <div className="nav-center-right">
          <ul className="nav-links-list">
            {NAV_LINKS.map(link => {
              const isActive =
                activeSection === link.sectionId ||
                (typeof window !== 'undefined' && window.location.pathname === link.href);

              return (
                <li key={link.label} className="nav-link-item">
                  <a
                    href={link.href}
                    className={`nav-link ${isActive ? 'is-active' : ''}`}
                    onClick={e => handleLinkClick(e, link.href)}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>

          <a
            href={NAV_CTA.href}
            className="nav-cta-btn"
            onClick={e => handleLinkClick(e, NAV_CTA.href)}
          >
            {NAV_CTA.label}
          </a>
        </div>

        {/* Hamburger toggle button for mobile (≤900px) */}
        <button
          className={`nav-hamburger-btn ${mobileOpen ? 'is-open' : ''}`}
          aria-label={mobileOpen ? 'Close Menu' : 'Open Menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(prev => !prev)}
        >
          <span className="nav-hamburger-line" />
          <span className="nav-hamburger-line" />
        </button>
      </nav>

      {/* Full-screen Mobile Menu Overlay */}
      <div
        ref={overlayRef}
        className={`mobile-nav-overlay ${mobileOpen ? 'is-open' : ''}`}
        aria-hidden={!mobileOpen}
      >
        <ul className="mobile-nav-links">
          {NAV_LINKS.map(link => (
            <li key={link.label}>
              <a
                href={link.href}
                className="mobile-nav-link"
                tabIndex={mobileOpen ? 0 : -1}
                onClick={e => handleLinkClick(e, link.href)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href={NAV_CTA.href}
          className="nav-cta-btn mobile-nav-cta"
          tabIndex={mobileOpen ? 0 : -1}
          onClick={e => handleLinkClick(e, NAV_CTA.href)}
        >
          {NAV_CTA.label}
        </a>
      </div>
    </>
  );
}
