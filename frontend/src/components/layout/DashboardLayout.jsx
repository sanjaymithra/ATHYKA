import React, { Suspense } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import PillNav from '../shared/PillNav';
import BackButton from './BackButton';
import FooterSlot from './FooterSlot';
import { prefetchRoute } from '../../utils/prefetch';
import './DashboardLayout.css';

export default function DashboardLayout({ section = 'digital-services' }) {
  const location = useLocation();
  const pathname = location.pathname;

  const isWorkshops = section === 'workshops';
  const baseLandingPath = isWorkshops ? '/workshops' : '/digital-services';
  const isLanding = pathname === baseLandingPath;

  const sectionLabel = isWorkshops ? '/ WORKSHOPS' : '/ DIGITAL SERVICES';
  const bookingPath = isWorkshops ? '/workshops/book' : '/digital-services/contact';
  const bookingLabel = isWorkshops ? 'BOOK A WORKSHOP' : 'BOOK A CALL';

  return (
    <div className="dashboard-shell-root">
      {/* 1. Static Noise Layer (4% opacity, no heavy blend modes) */}
      <div className="dashboard-static-noise" aria-hidden="true" />

      {/* 2. Top Bar: Wordmark -> /home, Section Tag, Booking Pill */}
      <header className="dashboard-top-bar" aria-label="Dashboard header">
        <div className="dashboard-top-left">
          <Link
            to="/home"
            className="dashboard-wordmark-link"
            aria-label="Return to ATHYKA Home"
          >
            ΛTHYKΛ
          </Link>
          <Link
            to={baseLandingPath}
            className={`dashboard-section-tag ${isLanding ? 'is-active' : ''}`}
            aria-label={`Go to ${sectionLabel} landing`}
          >
            {isLanding && <span className="section-active-dot" aria-hidden="true" />}
            <span>{sectionLabel}</span>
          </Link>
        </div>

        <div className="dashboard-top-right">
          <Link
            to={bookingPath}
            onMouseEnter={() => prefetchRoute(bookingPath)}
            className="dashboard-booking-pill"
          >
            {bookingLabel}
          </Link>
        </div>
      </header>

      {/* 3. Main Outlet Container with BackButton */}
      <main className="dashboard-content-area">
        <BackButton />

        <div key={location.pathname} className="dashboard-page-transition">
          <Suspense fallback={<div className="dashboard-skeleton-view" />}>
            <Outlet />
          </Suspense>
        </div>

        {/* 4. Empty FooterSlot (reserving 96px bottom padding, NO footer) */}
        <FooterSlot />
      </main>

      {/* 5. Persistent Bottom PillNav */}
      <PillNav section={section} />
    </div>
  );
}
