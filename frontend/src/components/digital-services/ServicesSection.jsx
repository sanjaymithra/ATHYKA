import React, { useState } from 'react';
import './ServicesSection.css';

/**
 * Isolated Services Presentation
 * Deliberately minimal numbered rows: kicker, title, one-line challenge.
 * Clicking a row expands it to reveal body, solves list, and a "Discuss this ↗" CTA.
 */
export default function ServicesSection({ services = [], onDiscussService }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleRow = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  if (!services || services.length === 0) {
    return null;
  }

  return (
    <div className="services-minimal-list" role="list">
      {services.map((srv, idx) => {
        const isExpanded = expandedId === srv.id;
        const numberStr = String(srv.order || idx + 1).padStart(2, '0');
        const kickerStr = srv.kicker ? `${numberStr} / ${srv.kicker}` : `${numberStr}`;

        return (
          <div
            key={srv.id}
            className={`service-row-item ${isExpanded ? 'is-expanded' : ''}`}
            role="listitem"
          >
            {/* Clickable Row Header */}
            <button
              type="button"
              className="service-row-header"
              onClick={() => toggleRow(srv.id)}
              aria-expanded={isExpanded}
              aria-controls={`service-details-${srv.id}`}
            >
              <div className="service-row-meta">
                <span className="service-row-kicker">{kickerStr}</span>
                <h3 className="service-row-title">{srv.title}</h3>
              </div>

              <div className="service-row-challenge">
                <span>{srv.challenge}</span>
              </div>

              <div className="service-row-toggle" aria-hidden="true">
                <span className="toggle-indicator">{isExpanded ? '—' : '+'}</span>
              </div>
            </button>

            {/* Expandable Details Drawer */}
            <div
              id={`service-details-${srv.id}`}
              className="service-row-drawer"
              hidden={!isExpanded}
            >
              <div className="service-drawer-content">
                <p className="service-drawer-body">{srv.body}</p>

                {Array.isArray(srv.solves) && srv.solves.length > 0 && (
                  <div className="service-solves-block">
                    <span className="service-solves-label">WHAT WE SOLVE:</span>
                    <ul className="service-solves-list">
                      {srv.solves.map((solveItem, sIdx) => (
                        <li key={sIdx} className="service-solve-item">
                          <span className="solve-bullet" aria-hidden="true">•</span>
                          <span>{solveItem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="service-drawer-actions">
                  <button
                    type="button"
                    className="service-discuss-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDiscussService) {
                        onDiscussService(srv.title);
                      }
                    }}
                  >
                    {srv.discussLabel || 'Discuss this ↗'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
