import React, { useState } from 'react';
import { useContent } from '../content';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useScrollSpy } from '../hooks/useScrollSpy';
import { parseEmphasisText } from '../utils/textParser';
import PillNav from '../components/shared/PillNav';
import BookingDialog from '../components/shared/BookingDialog';
import Section from '../components/shared/Section';
import CtaBand from '../components/shared/CtaBand';
import { DevDraftCard, CollapsedSectionBand } from '../components/shared/AdminBadges';
import './WorkshopsPage.css';

export default function WorkshopsPage({ onNavigate }) {
  const content = useContent('workshops');
  const siteSettings = useContent('siteSettings');

  // Dynamic SEO meta
  useDocumentMeta(content.meta);

  // Scroll spy for sections
  const sectionIds = ['home', 'work', 'about', 'book'];
  const { activeId, scrollToSection } = useScrollSpy(sectionIds, 90);

  // Booking dialog state
  const [bookingOpen, setBookingOpen] = useState(false);

  const isProd = import.meta.env?.PROD;

  const hero = content.hero || {};
  const problems = content.problems?.items || [];
  const publishedProblems = isProd ? problems.filter(p => p.status === 'published') : problems;

  const formats = content.formats?.items || [];
  const publishedFormats = isProd ? formats.filter(f => f.status === 'published') : formats;

  const pastWorkshops = content.work?.pastWorkshops || [];
  const publishedWorkshops = isProd ? pastWorkshops.filter(w => w.status === 'published') : pastWorkshops;

  const team = content.about?.team || [];
  const publishedTeam = isProd ? team.filter(t => t.status === 'published') : team;

  const proof = content.about?.proof || [];
  const publishedProof = isProd ? proof.filter(p => p.status === 'published') : proof;

  return (
    <main className="service-page-root">
      {/* 4% Film Grain Overlay */}
      <div className="service-page-grain" aria-hidden="true" />

      {/* Floating PillNav */}
      <PillNav
        navData={content.nav}
        activeSection={activeId}
        onSelectSection={scrollToSection}
        onOpenBooking={() => setBookingOpen(true)}
        onNavigateHome={() => onNavigate && onNavigate('/')}
        onNavigateRoute={(route) => onNavigate && onNavigate(route)}
      />

      {/* ====================================================================
          1. Hero Section (#home)
          ==================================================================== */}
      <Section id="home" className="ws-hero-section" ticks>
        <div className="ws-hero-content">
          <span className="ws-hero-eyebrow">{hero.eyebrow}</span>
          <h1 className="ws-hero-title">
            {parseEmphasisText(hero.h1)}
          </h1>
          <p className="ws-hero-sub">{hero.sub}</p>

          <div className="ws-hero-cta-group">
            <button
              type="button"
              className="ws-btn ws-btn-primary"
              onClick={() => scrollToSection('book')}
            >
              {hero.primaryCta}
            </button>
            <button
              type="button"
              className="ws-btn ws-btn-secondary"
              onClick={() => scrollToSection('work')}
            >
              {hero.secondaryCta}
            </button>
          </div>

          <p className="ws-hero-microcopy">{hero.microcopy}</p>
        </div>

        {/* Problems Block */}
        {publishedProblems.length > 0 && (
          <div className="ws-problems-wrapper">
            <div className="ws-problems-header">
              <span className="ws-problems-title">{content.problems?.heading || 'The gap on campus'}</span>
            </div>
            <div className="ws-problems-grid">
              {publishedProblems.map((prob, idx) => {
                const isDraft = prob.status === 'draft';
                const card = (
                  <div key={prob.id} className="ws-problem-card">
                    <div className="ws-problem-provocation">
                      "{prob.provocation}"
                    </div>
                    <div className="ws-problem-arrow" aria-hidden="true">→</div>
                    <div className="ws-problem-solution">
                      {prob.solution}
                    </div>
                  </div>
                );

                if (isDraft) {
                  return (
                    <DevDraftCard key={prob.id} title={`PROBLEM 0${idx + 1}`}>
                      {card}
                    </DevDraftCard>
                  );
                }
                return card;
              })}
            </div>
          </div>
        )}

        {/* Formats Block */}
        {publishedFormats.length > 0 && (
          <div className="ws-formats-wrapper">
            <div className="ws-formats-header">
              <span className="ws-formats-title">{content.formats?.heading || 'Workshop Formats'}</span>
              <p className="ws-formats-sub">{content.formats?.sub}</p>
            </div>
            <div className="ws-formats-grid">
              {publishedFormats.map((fmt, idx) => {
                const isDraft = fmt.status === 'draft';
                const card = (
                  <div key={fmt.id} className="ws-format-card">
                    <span className="ws-format-duration">{fmt.duration}</span>
                    <h3 className="ws-format-name">{fmt.name}</h3>
                    <p className="ws-format-who"><strong>For:</strong> {fmt.whoItsFor}</p>
                    <p className="ws-format-leaves"><strong>Leaves with:</strong> {fmt.leavesWith}</p>
                  </div>
                );

                if (isDraft) {
                  return (
                    <DevDraftCard key={fmt.id} title={`FORMAT 0${idx + 1}`}>
                      {card}
                    </DevDraftCard>
                  );
                }
                return card;
              })}
            </div>
          </div>
        )}
      </Section>

      {/* ====================================================================
          2. Previous Work Section (#work)
          ==================================================================== */}
      <Section
        id="work"
        className="ws-work-section"
        eyebrow="CAMPUS SESSIONS"
        title={content.work?.heading}
        sub={content.work?.sub}
      >
        {publishedWorkshops.length > 0 ? (
          <div className="ws-work-grid">
            {publishedWorkshops.map((ws, idx) => {
              const isDraft = ws.status === 'draft';
              const card = (
                <article key={ws.id} className="ws-past-card">
                  <div className="ws-past-meta">
                    <span className="ws-past-tag">{ws.city} • {ws.date}</span>
                    <span className="ws-past-attendees">{ws.attendees}</span>
                  </div>
                  <h3 className="ws-past-inst">{ws.institution}</h3>
                  <div className="ws-past-topic"><strong>Topic:</strong> {ws.topic}</div>
                  {ws.quote && (
                    <blockquote className="ws-past-quote">"{ws.quote}"</blockquote>
                  )}
                </article>
              );

              if (isDraft) {
                return (
                  <DevDraftCard key={ws.id} title={`SESSION: ${ws.institution}`}>
                    {card}
                  </DevDraftCard>
                );
              }
              return card;
            })}
          </div>
        ) : (
          <CollapsedSectionBand
            message={content.work?.emptyFallback}
            buttonText={content.work?.emptyCta || 'BOOK A WORKSHOP'}
            onCtaClick={() => setBookingOpen(true)}
          />
        )}

        <CtaBand
          heading={content.work?.ctaBand?.heading}
          buttonText={content.work?.ctaBand?.buttonText}
          onButtonClick={() => setBookingOpen(true)}
        />
      </Section>

      {/* ====================================================================
          3. About Section (#about)
          ==================================================================== */}
      <Section
        id="about"
        className="ws-about-section"
        eyebrow="FACILITATORS"
        title={content.about?.heading}
        sub={content.about?.sub}
      >
        {publishedTeam.length > 0 ? (
          <div className="ws-team-grid">
            {publishedTeam.map((member) => {
              const isDraft = member.status === 'draft';
              const card = (
                <div key={member.id} className="ws-team-card">
                  <div className="ws-team-monogram" aria-hidden="true">
                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <h3 className="ws-team-name">{member.name}</h3>
                  <div className="ws-team-role">{member.role}</div>
                  <p className="ws-team-flex">{member.flexLine}</p>
                </div>
              );

              if (isDraft) {
                return (
                  <DevDraftCard key={member.id} title={`TEAM: ${member.name}`}>
                    {card}
                  </DevDraftCard>
                );
              }
              return card;
            })}
          </div>
        ) : (
          <CollapsedSectionBand
            message={content.about?.emptyFallback}
            buttonText={content.about?.emptyCta || 'BOOK A WORKSHOP'}
            onCtaClick={() => setBookingOpen(true)}
          />
        )}

        {publishedProof.length > 0 && (
          <div className="ws-proof-strip">
            {publishedProof.map(item => (
              <div key={item.id} className="ws-proof-item">
                <span className="ws-proof-val">{item.value}</span>
                <span className="ws-proof-lbl">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ====================================================================
          4. Booking Section (#book)
          ==================================================================== */}
      <Section
        id="book"
        className="ws-book-section"
        eyebrow="SCHEDULE A SESSION"
        title={content.book?.heading}
        sub={content.book?.sub}
        ticks
      >
        <div className="ws-book-container">
          <div className="ws-book-actions">
            <button
              type="button"
              className="ws-btn ws-btn-primary ws-btn-large"
              onClick={() => setBookingOpen(true)}
            >
              {content.book?.primaryCta || 'BOOK A WORKSHOP'} →
            </button>

            {content.book?.crossLinkText && (
              <a
                href={content.book.crossLinkHref}
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) onNavigate(content.book.crossLinkHref);
                }}
                className="ws-book-crosslink"
              >
                {content.book.crossLinkText}
              </a>
            )}
          </div>
        </div>
      </Section>

      {/* Accessible Booking Modal */}
      <BookingDialog
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        variant="workshop"
        settings={siteSettings}
        dialogContent={content.dialog}
      />
    </main>
  );
}
