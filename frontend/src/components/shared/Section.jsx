import React from 'react';
import './Section.css';

/**
 * Standard Section Container with Responsive Gutter for PillNav
 * - >= 1100px: 260px left gutter
 * - 768px - 1099px: 200px left gutter
 * - < 768px: 0px left gutter (content edge-to-edge with standard padding)
 * - Content max-width: 1180px
 */
export default function Section({
  id,
  className = '',
  eyebrow,
  title,
  sub,
  children,
  ticks = false
}) {
  return (
    <section id={id} className={`service-page-section ${className}`}>
      {ticks && (
        <div className="section-frame-layer" aria-hidden="true">
          <div className="section-tick section-tick-tl" />
          <div className="section-tick section-tick-tr" />
        </div>
      )}

      <div className="service-section-inner">
        {(eyebrow || title || sub) && (
          <header className="service-section-header">
            {eyebrow && <span className="service-section-eyebrow">{eyebrow}</span>}
            {title && <h2 className="service-section-title">{title}</h2>}
            {sub && <p className="service-section-sub">{sub}</p>}
          </header>
        )}
        <div className="service-section-body">
          {children}
        </div>
      </div>
    </section>
  );
}
