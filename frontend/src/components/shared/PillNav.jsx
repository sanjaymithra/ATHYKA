import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, LayoutGroup } from 'framer-motion';
import { prefetchRoute } from '../../utils/prefetch';
import './PillNav.css';

const PILL_TILTS = [-1.5, 1.2, -0.8, 1.6, -1.2, 0.9];

const TONAL_PALETTE = [
  { bg: '#F6EFDD', text: '#141414', border: 'none' },
  { bg: '#D8C48A', text: '#141414', border: 'none' },
  { bg: '#B89B4A', text: '#141414', border: 'none' },
  { bg: '#8A7545', text: '#F6EFDD', border: 'none' },
  { bg: '#1B1B16', text: '#F6EFDD', border: '1px solid rgba(246, 239, 221, 0.35)' },
  { bg: '#3A3321', text: '#D8C48A', border: 'none' }
];

export default function PillNav({ section = 'digital-services' }) {
  const location = useLocation();
  const pathname = location.pathname;
  const [mobileOpen, setMobileOpen] = useState(false);

  // Configure items based on section
  const isWorkshops = section === 'workshops';
  const baseHref = isWorkshops ? '/workshops' : '/digital-services';

  const items = isWorkshops
    ? [
        { id: 'home', label: 'Home', href: '/home' },
        { id: 'work', label: 'Previous work', href: '/workshops/work' },
        { id: 'about', label: 'About', href: '/workshops/about' },
        { id: 'book', label: 'Book a workshop', href: '/workshops/book', isPrimary: true }
      ]
    : [
        { id: 'home', label: 'Home', href: '/home' },
        { id: 'work', label: 'Work', href: '/digital-services/work' },
        { id: 'services', label: 'Services', href: '/digital-services/services' },
        { id: 'contact', label: 'Contact', href: '/digital-services/contact', isPrimary: true }
      ];

  // Derive active pill strictly from route
  let activeId = null;
  if (isWorkshops) {
    if (pathname.startsWith('/workshops/work')) activeId = 'work';
    else if (pathname.startsWith('/workshops/about')) activeId = 'about';
    else if (pathname.startsWith('/workshops/book')) activeId = 'book';
  } else {
    if (pathname.startsWith('/digital-services/work')) activeId = 'work';
    else if (pathname.startsWith('/digital-services/services')) activeId = 'services';
    else if (pathname.startsWith('/digital-services/contact')) activeId = 'contact';
  }

  const crossLink = isWorkshops
    ? { text: 'NEED SOFTWARE BUILT? DIGITAL SERVICES ↗', href: '/digital-services' }
    : { text: 'LOOKING TO TRAIN YOUR TEAM? WORKSHOPS ↗', href: '/workshops' };

  return (
    <>
      <nav
        className={`pillnav-stack-container ${mobileOpen ? 'is-mobile-open' : ''}`}
        aria-label="Service navigation"
      >
        {/* Mobile Toggle Button (<768px) */}
        <button
          type="button"
          className="pillnav-mobile-toggle"
          onClick={() => setMobileOpen((curr) => !curr)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          <span className="pillnav-mobile-icon">{mobileOpen ? '✕' : '☰'}</span>
          <span>{mobileOpen ? 'CLOSE' : 'MENU'}</span>
        </button>

        {/* Stack of Pills animated via framer-motion LayoutGroup */}
        <LayoutGroup id={`pillnav-${section}`}>
          <div className="pillnav-pills-list">
            {items.map((item, idx) => {
              const isActive = activeId === item.id;
              const tilt = PILL_TILTS[idx % PILL_TILTS.length];
              const color = TONAL_PALETTE[idx % TONAL_PALETTE.length];

              return (
                <motion.div
                  key={item.id}
                  layout
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 36,
                    mass: 0.8
                  }}
                  className={`pillnav-motion-wrapper ${isActive ? 'is-active' : ''}`}
                >
                  <Link
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    onMouseEnter={() => prefetchRoute(item.href)}
                    onFocus={() => prefetchRoute(item.href)}
                    onTouchStart={() => prefetchRoute(item.href)}
                    className={`pillnav-item ${isActive ? 'is-active' : ''} ${item.isPrimary ? 'is-primary-pill' : ''}`}
                    style={{
                      backgroundColor: color.bg,
                      color: color.text,
                      border: color.border,
                      borderRadius: isActive ? 44 : 26
                    }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span
                      className="pillnav-inner-tilt"
                      style={{ transform: `rotate(${tilt}deg)` }}
                    >
                      <motion.span
                        layout="position"
                        className="pillnav-item-text"
                      >
                        {item.label}
                      </motion.span>
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </LayoutGroup>
      </nav>

      {/* Bottom-Right Cross-Link Mono Pill */}
      {crossLink && (
        <div className="pillnav-bottom-right">
          <Link
            to={crossLink.href}
            onMouseEnter={() => prefetchRoute(crossLink.href)}
            className="pillnav-crosslink-pill"
          >
            {crossLink.text}
          </Link>
        </div>
      )}
    </>
  );
}
