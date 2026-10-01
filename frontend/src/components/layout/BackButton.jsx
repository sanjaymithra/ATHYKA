import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './BackButton.css';

export default function BackButton({ currentTitle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  // Determine fallback and breadcrumbs based on pathname
  let fallbackPath = '/home';
  const crumbs = [];

  if (pathname.startsWith('/digital-services')) {
    crumbs.push({ label: 'DIGITAL SERVICES', path: '/digital-services' });

    if (pathname === '/digital-services') {
      fallbackPath = '/home';
    } else if (pathname === '/digital-services/work') {
      fallbackPath = '/digital-services';
      crumbs.push({ label: 'WORK', path: null });
    } else if (pathname.startsWith('/digital-services/work/')) {
      fallbackPath = '/digital-services/work';
      crumbs.push({ label: 'WORK', path: '/digital-services/work' });
      const slug = pathname.replace('/digital-services/work/', '');
      crumbs.push({ label: currentTitle || slug.toUpperCase().replace(/-/g, ' '), path: null });
    } else if (pathname === '/digital-services/services') {
      fallbackPath = '/digital-services';
      crumbs.push({ label: 'SERVICES', path: null });
    } else if (pathname.startsWith('/digital-services/services/')) {
      fallbackPath = '/digital-services/services';
      crumbs.push({ label: 'SERVICES', path: '/digital-services/services' });
      const slug = pathname.replace('/digital-services/services/', '');
      crumbs.push({ label: currentTitle || slug.toUpperCase().replace(/-/g, ' '), path: null });
    } else if (pathname === '/digital-services/contact') {
      fallbackPath = '/digital-services';
      crumbs.push({ label: 'CONTACT', path: null });
    }
  } else if (pathname.startsWith('/workshops')) {
    crumbs.push({ label: 'WORKSHOPS', path: '/workshops' });

    if (pathname === '/workshops') {
      fallbackPath = '/home';
    } else if (pathname === '/workshops/work') {
      fallbackPath = '/workshops';
      crumbs.push({ label: 'PREVIOUS WORK', path: null });
    } else if (pathname.startsWith('/workshops/work/')) {
      fallbackPath = '/workshops/work';
      crumbs.push({ label: 'PREVIOUS WORK', path: '/workshops/work' });
      const slug = pathname.replace('/workshops/work/', '');
      crumbs.push({ label: currentTitle || slug.toUpperCase().replace(/-/g, ' '), path: null });
    } else if (pathname === '/workshops/about') {
      fallbackPath = '/workshops';
      crumbs.push({ label: 'ABOUT', path: null });
    } else if (pathname === '/workshops/book') {
      fallbackPath = '/workshops';
      crumbs.push({ label: 'BOOK A WORKSHOP', path: null });
    }
  } else {
    fallbackPath = '/home';
  }

  const handleBack = (e) => {
    e.preventDefault();
    if (
      typeof window !== 'undefined' &&
      window.history.state &&
      typeof window.history.state.idx === 'number' &&
      window.history.state.idx > 0
    ) {
      navigate(-1);
    } else {
      navigate(fallbackPath, { replace: true });
    }
  };

  return (
    <div className="athyka-back-bar" aria-label="Page navigation breadcrumb">
      <button
        type="button"
        className="athyka-back-btn"
        onClick={handleBack}
        aria-label={`Go back to ${fallbackPath}`}
      >
        <span className="back-btn-circle" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </span>
        <span className="back-btn-label">BACK</span>
      </button>

      {crumbs.length > 0 && (
        <nav className="athyka-breadcrumbs" aria-label="Breadcrumb">
          {crumbs.map((crumb, idx) => {
            const isLast = idx === crumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="breadcrumb-separator">/</span>}
                {isLast || !crumb.path ? (
                  <span className="breadcrumb-item is-current" aria-current={isLast ? 'page' : undefined}>
                    {crumb.label}
                  </span>
                ) : (
                  <Link to={crumb.path} className="breadcrumb-item breadcrumb-link">
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      )}
    </div>
  );
}
