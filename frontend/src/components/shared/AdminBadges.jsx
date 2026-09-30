import React from 'react';
import './AdminBadges.css';

/**
 * Development Draft Indicator Wrapper
 * Shows a dashed gold/amber border and "TODO: DRAFT" badge in dev mode.
 * In production, draft items are already excluded by the content layer.
 */
export function DevDraftCard({ children, title = 'DRAFT CONTENT' }) {
  const isProd = import.meta.env?.PROD;
  if (isProd) return null;

  return (
    <div className="dev-todo-outline" title="Admin Draft Item">
      <div className="dev-todo-badge">
        <span className="dev-todo-dot" />
        <span>TODO: {title}</span>
      </div>
      {children}
    </div>
  );
}

/**
 * Collapsed Empty Section Band (for production when an entire section has no published items)
 */
export function CollapsedSectionBand({
  message = 'Case studies in progress. Have a project in mind?',
  buttonText = 'BOOK A CALL',
  onCtaClick
}) {
  return (
    <div className="collapsed-section-band">
      <p className="collapsed-band-text">{message}</p>
      <button
        type="button"
        className="collapsed-band-btn"
        onClick={onCtaClick}
      >
        {buttonText} →
      </button>
    </div>
  );
}
