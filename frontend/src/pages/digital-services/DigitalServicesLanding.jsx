import React from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../../content';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { parseEmphasisText } from '../../utils/textParser';
import { prefetchRoute } from '../../utils/prefetch';
import './DigitalServicesLanding.css';

export default function DigitalServicesLanding() {
  const content = useContent('digitalServices');
  useDocumentMeta(content.meta);

  const hero = content.hero || {};
  const problems = content.problems?.items || [];
  const processSteps = content.process?.items || [];

  return (
    <div className="ds-landing-container">
      {/* 1. Challenge-Led Hero */}
      <section className="ds-landing-hero">
        <span className="ds-eyebrow">{hero.eyebrow || 'DIGITAL SERVICES'}</span>
        <h1 className="ds-headline">
          {parseEmphasisText(hero.h1 || 'What is your software\nactually *solving*?')}
        </h1>
        <p className="ds-sub">{hero.sub}</p>

        <div className="ds-hero-actions">
          <Link
            to="/digital-services/contact"
            onMouseEnter={() => prefetchRoute('/digital-services/contact')}
            className="ds-btn-gold"
          >
            {hero.primaryCta || 'BOOK A CALL'}
          </Link>
          <Link
            to="/digital-services/work"
            onMouseEnter={() => prefetchRoute('/digital-services/work')}
            className="ds-btn-outline"
          >
            SEE OUR WORK →
          </Link>
        </div>
        {hero.microcopy && <p className="ds-microcopy">{hero.microcopy}</p>}
      </section>

      {/* 2. Problem Rows */}
      <section className="ds-problems-section">
        <div className="ds-section-header">
          <span className="ds-section-num">01 / DIAGNOSIS</span>
          <h2 className="ds-section-title">{content.problems?.heading || 'Sound familiar?'}</h2>
        </div>

        <div className="ds-problems-list">
          {problems.map((prob) => {
            const serviceSlug = prob.targetServiceSlug || 'web-development';
            const targetUrl = `/digital-services/services/${serviceSlug}`;
            return (
              <Link
                key={prob.id}
                to={targetUrl}
                onMouseEnter={() => prefetchRoute(targetUrl)}
                className="ds-problem-row"
              >
                <div className="ds-problem-left">
                  <span className="ds-problem-icon" aria-hidden="true">↳</span>
                  <span className="ds-problem-provocation">{prob.provocation}</span>
                </div>
                <div className="ds-problem-right">
                  <span className="ds-problem-solves-label">ANSWER</span>
                  <span className="ds-problem-solution">{prob.solution}</span>
                  <span className="ds-row-arrow" aria-hidden="true">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Three Large Navigation Tiles */}
      <section className="ds-tiles-section">
        <div className="ds-section-header">
          <span className="ds-section-num">02 / EXPLORE</span>
          <h2 className="ds-section-title">Operational Hub</h2>
        </div>

        <div className="ds-tiles-grid">
          <Link
            to="/digital-services/work"
            onMouseEnter={() => prefetchRoute('/digital-services/work')}
            className="ds-nav-tile"
          >
            <div className="ds-tile-header">
              <span className="ds-tile-tag">01 / PORTFOLIO</span>
              <span className="ds-tile-arrow" aria-hidden="true">↗</span>
            </div>
            <h3 className="ds-tile-title">Selected Work</h3>
            <p className="ds-tile-desc">
              60 verified production case studies with real metrics across fintech, healthcare, logistics, and SaaS.
            </p>
          </Link>

          <Link
            to="/digital-services/services"
            onMouseEnter={() => prefetchRoute('/digital-services/services')}
            className="ds-nav-tile"
          >
            <div className="ds-tile-header">
              <span className="ds-tile-tag">02 / DISCIPLINES</span>
              <span className="ds-tile-arrow" aria-hidden="true">↗</span>
            </div>
            <h3 className="ds-tile-title">All 10 Services</h3>
            <p className="ds-tile-desc">
              From BUILD to GROW: software, automation, and AI integrations engineered around the problem.
            </p>
          </Link>

          <Link
            to="/digital-services/contact"
            onMouseEnter={() => prefetchRoute('/digital-services/contact')}
            className="ds-nav-tile"
          >
            <div className="ds-tile-header">
              <span className="ds-tile-tag">03 / INITIATE</span>
              <span className="ds-tile-arrow" aria-hidden="true">↗</span>
            </div>
            <h3 className="ds-tile-title">Contact & Scoping</h3>
            <p className="ds-tile-desc">
              Tell us the problem. We evaluate technical feasibility and return a concrete architectural plan.
            </p>
          </Link>
        </div>
      </section>

      {/* 4. Process Steps */}
      <section className="ds-process-section">
        <div className="ds-section-header">
          <span className="ds-section-num">03 / METHODOLOGY</span>
          <h2 className="ds-section-title">{content.process?.heading || 'Process'}</h2>
          <p className="ds-section-sub">{content.process?.sub}</p>
        </div>

        <div className="ds-process-grid">
          {processSteps.map((step, idx) => (
            <div key={step.id} className="ds-process-card">
              <span className="ds-process-num">0{idx + 1}</span>
              <h3 className="ds-process-title">{step.title}</h3>
              <p className="ds-process-body">{step.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
