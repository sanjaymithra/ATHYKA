import React from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../../content';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { parseEmphasisText } from '../../utils/textParser';
import { prefetchRoute } from '../../utils/prefetch';
import './WorkshopsLanding.css';

export default function WorkshopsLanding() {
  const content = useContent('workshops');
  useDocumentMeta(content.meta);

  const hero = content.hero || {};
  const problems = content.problems?.items || [];
  const formats = content.formats?.items || [];

  return (
    <div className="ws-landing-container">
      {/* 1. Challenge Hero */}
      <section className="ws-landing-hero">
        <span className="ws-eyebrow">{hero.eyebrow || 'WORKSHOPS FOR SCHOOLS & COLLEGES'}</span>
        <h1 className="ws-headline">
          {parseEmphasisText(hero.h1 || 'Your students know the theory.\nHave they *built* anything?')}
        </h1>
        <p className="ws-sub">{hero.sub}</p>

        <div className="ws-hero-actions">
          <Link
            to="/workshops/book"
            onMouseEnter={() => prefetchRoute('/workshops/book')}
            className="ds-btn-gold"
          >
            {hero.primaryCta || 'BOOK A WORKSHOP'}
          </Link>
          <Link
            to="/workshops/work"
            onMouseEnter={() => prefetchRoute('/workshops/work')}
            className="ds-btn-outline"
          >
            SEE PREVIOUS SESSIONS →
          </Link>
        </div>
        {hero.microcopy && <p className="ws-microcopy">{hero.microcopy}</p>}
      </section>

      {/* 2. Campus Gap Problem Rows */}
      <section className="ws-problems-section">
        <div className="ds-section-header">
          <span className="ds-section-num">01 / THE GAP</span>
          <h2 className="ds-section-title">{content.problems?.heading || 'The gap on campus'}</h2>
        </div>

        <div className="ds-problems-list">
          {problems.map((prob) => (
            <div key={prob.id} className="ds-problem-row">
              <div className="ds-problem-left">
                <span className="ds-problem-icon" aria-hidden="true">↳</span>
                <span className="ds-problem-provocation">{prob.provocation}</span>
              </div>
              <div className="ds-problem-right">
                <span className="ds-problem-solves-label">CURRICULUM</span>
                <span className="ds-problem-solution">{prob.solution}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Three Large Navigation Tiles */}
      <section className="ws-tiles-section">
        <div className="ds-section-header">
          <span className="ds-section-num">02 / EXPLORE</span>
          <h2 className="ds-section-title">Campus Program Hub</h2>
        </div>

        <div className="ds-tiles-grid">
          <Link
            to="/workshops/work"
            onMouseEnter={() => prefetchRoute('/workshops/work')}
            className="ds-nav-tile"
          >
            <div className="ds-tile-header">
              <span className="ds-tile-tag">01 / ARCHIVE</span>
              <span className="ds-tile-arrow" aria-hidden="true">↗</span>
            </div>
            <h3 className="ds-tile-title">Previous Work</h3>
            <p className="ds-tile-desc">
              Campus sessions at IIT, NID, BITS, and premier institutions where students deployed code.
            </p>
          </Link>

          <Link
            to="/workshops/about"
            onMouseEnter={() => prefetchRoute('/workshops/about')}
            className="ds-nav-tile"
          >
            <div className="ds-tile-header">
              <span className="ds-tile-tag">02 / FACULTY</span>
              <span className="ds-tile-arrow" aria-hidden="true">↗</span>
            </div>
            <h3 className="ds-tile-title">About the Team</h3>
            <p className="ds-tile-desc">
              Engineers and systems researchers who build production software daily, not theoretical lecturers.
            </p>
          </Link>

          <Link
            to="/workshops/book"
            onMouseEnter={() => prefetchRoute('/workshops/book')}
            className="ds-nav-tile"
          >
            <div className="ds-tile-header">
              <span className="ds-tile-tag">03 / SCHEDULING</span>
              <span className="ds-tile-arrow" aria-hidden="true">↗</span>
            </div>
            <h3 className="ds-tile-title">Book a Workshop</h3>
            <p className="ds-tile-desc">
              Tell us about your student cohort and timeline. We bring turnkey materials and instructors to your campus.
            </p>
          </Link>
        </div>
      </section>

      {/* 4. Workshop Formats */}
      <section className="ws-formats-section">
        <div className="ds-section-header">
          <span className="ds-section-num">03 / INTENSIVES</span>
          <h2 className="ds-section-title">{content.formats?.heading || 'Workshop Formats'}</h2>
          <p className="ds-section-sub">{content.formats?.sub}</p>
        </div>

        <div className="ws-formats-grid">
          {formats.map((fmt) => (
            <div key={fmt.id} className="ws-format-card">
              <div className="format-top">
                <span className="format-duration">{fmt.duration}</span>
                <h3 className="format-name">{fmt.name}</h3>
              </div>
              <div className="format-detail">
                <span className="format-label">WHO IT'S FOR:</span>
                <p className="format-text">{fmt.whoItsFor}</p>
              </div>
              <div className="format-detail">
                <span className="format-label">STUDENT LEAVES WITH:</span>
                <p className="format-text format-highlight">{fmt.leavesWith}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
