import React from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../../content';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { prefetchRoute } from '../../utils/prefetch';
import './ServicesIndexPage.css';

export default function ServicesIndexPage() {
  const content = useContent('digitalServices');
  const services = content.services?.items || [];

  useDocumentMeta({
    title: 'Disciplines & Services — ATHYKA',
    description: 'All 10 ATHYKA engineering disciplines from BUILD to GROW.'
  });

  return (
    <div className="services-index-container">
      {/* 1. Header */}
      <div className="services-index-header">
        <span className="services-index-eyebrow">DIGITAL SERVICES / DISCIPLINES</span>
        <h1 className="services-index-title">All 10 Services</h1>
        <p className="services-index-sub">
          Numbered by discipline. Engineered around the question you need answered.
        </p>
      </div>

      {/* 2. Minimal Rows List */}
      <div className="services-minimal-list" role="list">
        {services.map((item) => {
          const detailUrl = `/digital-services/services/${item.slug}`;
          return (
            <Link
              key={item.id}
              to={detailUrl}
              onMouseEnter={() => prefetchRoute(detailUrl)}
              className="service-row-item"
              role="listitem"
            >
              <div className="service-row-left">
                <span className="service-row-order">{String(item.order).padStart(2, '0')}</span>
                <span className="service-row-kicker">{item.kicker}</span>
                <h2 className="service-row-title">{item.title}</h2>
              </div>

              <div className="service-row-right">
                <p className="service-row-challenge">{item.challenge}</p>
                <span className="service-row-arrow" aria-hidden="true">→</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3. Bottom CTA */}
      <div className="services-index-cta">
        <p className="cta-note">Not sure which discipline fits your bottleneck?</p>
        <Link to="/digital-services/contact" className="ds-btn-gold">
          TELL US THE PROBLEM & WE'LL DIAGNOSE
        </Link>
      </div>
    </div>
  );
}
