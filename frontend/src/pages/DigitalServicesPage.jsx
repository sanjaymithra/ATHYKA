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
import ServicesSection from '../components/digital-services/ServicesSection';
import './DigitalServicesPage.css';

export default function DigitalServicesPage({ onNavigate }) {
  const content = useContent('digitalServices');
  const siteSettings = useContent('siteSettings');

  // Dynamic SEO meta
  useDocumentMeta(content.meta);

  // Scroll spy for sections
  const sectionIds = ['home', 'work', 'services', 'contact'];
  const { activeId, scrollToSection } = useScrollSpy(sectionIds, 90);

  // Booking dialog state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');

  const openBookingWithService = (serviceName = '') => {
    setSelectedService(serviceName);
    setBookingOpen(true);
  };

  const isProd = import.meta.env?.PROD;

  const hero = content.hero || {};
  const problems = content.problems?.items || [];
  const publishedProblems = isProd ? problems.filter(p => p.status === 'published') : problems;

  const projects = content.work?.projects || [];
  const publishedProjects = isProd ? projects.filter(p => p.status === 'published') : projects;

  const services = content.services?.items || [];
  const publishedServices = isProd ? services.filter(s => s.status === 'published') : services;

  const processSteps = content.process?.items || [];
  const publishedSteps = isProd ? processSteps.filter(s => s.status === 'published') : processSteps;

  return (
    <main className="service-page-root">
      {/* 4% Film Grain Overlay */}
      <div className="service-page-grain" aria-hidden="true" />

      {/* Floating PillNav */}
      <PillNav
        navData={content.nav}
        activeSection={activeId}
        onSelectSection={scrollToSection}
        onOpenBooking={() => openBookingWithService('')}
        onNavigateHome={() => onNavigate && onNavigate('/')}
        onNavigateRoute={(route) => onNavigate && onNavigate(route)}
      />

      {/* ====================================================================
          1. Hero Section (#home)
          ==================================================================== */}
      <Section id="home" className="ds-hero-section" ticks>
        <div className="ds-hero-content">
          <span className="ds-hero-eyebrow">{hero.eyebrow}</span>
          <h1 className="ds-hero-title">
            {parseEmphasisText(hero.h1)}
          </h1>
          <p className="ds-hero-sub">{hero.sub}</p>

          <div className="ds-hero-cta-group">
            <button
              type="button"
              className="ds-btn ds-btn-primary"
              onClick={() => openBookingWithService('')}
            >
              {hero.primaryCta}
            </button>
            <button
              type="button"
              className="ds-btn ds-btn-secondary"
              onClick={() => scrollToSection('work')}
            >
              {hero.secondaryCta}
            </button>
          </div>

          <p className="ds-hero-microcopy">{hero.microcopy}</p>
        </div>

        {/* Problems Block: "Sound familiar?" */}
        {publishedProblems.length > 0 && (
          <div className="ds-problems-wrapper">
            <div className="ds-problems-header">
              <span className="ds-problems-title">{content.problems?.heading || 'Sound familiar?'}</span>
            </div>
            <div className="ds-problems-grid">
              {publishedProblems.map((prob, idx) => {
                const isDraft = prob.status === 'draft';
                const cardNode = (
                  <div
                    key={prob.id}
                    className="ds-problem-card"
                    onClick={() => scrollToSection('services')}
                  >
                    <div className="ds-problem-provocation">
                      "{prob.provocation}"
                    </div>
                    <div className="ds-problem-arrow" aria-hidden="true">→</div>
                    <div className="ds-problem-solution">
                      {prob.solution}
                    </div>
                  </div>
                );

                if (isDraft) {
                  return (
                    <DevDraftCard key={prob.id} title={`PROBLEM 0${idx + 1}`}>
                      {cardNode}
                    </DevDraftCard>
                  );
                }
                return cardNode;
              })}
            </div>
          </div>
        )}
      </Section>

      {/* ====================================================================
          2. Work Section (#work)
          ==================================================================== */}
      <Section
        id="work"
        className="ds-work-section"
        eyebrow="PORTFOLIO & CASE STUDIES"
        title={content.work?.heading}
        sub={content.work?.sub}
      >
        {publishedProjects.length > 0 ? (
          <div className="ds-projects-grid">
            {publishedProjects.map((proj, idx) => {
              const isDraft = proj.status === 'draft';
              const card = (
                <article key={proj.id} className="ds-project-card">
                  <div className="ds-project-header">
                    <span className="ds-project-index">0{idx + 1}</span>
                    <h3 className="ds-project-name">{proj.name}</h3>
                  </div>
                  <div className="ds-project-challenge">
                    <strong>Challenge:</strong> {proj.challenge}
                  </div>
                  <div className="ds-project-built">
                    <strong>What we built:</strong> {proj.whatWeBuilt}
                  </div>
                  <div className="ds-project-result">
                    <strong>Result:</strong> {proj.result}
                  </div>
                </article>
              );

              if (isDraft) {
                return (
                  <DevDraftCard key={proj.id} title={`PROJECT: ${proj.name}`}>
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
            buttonText={content.work?.emptyCta || 'BOOK A CALL'}
            onCtaClick={() => openBookingWithService('')}
          />
        )}

        <CtaBand
          heading={content.work?.ctaBand?.heading}
          buttonText={content.work?.ctaBand?.buttonText}
          onButtonClick={() => openBookingWithService('')}
        />
      </Section>

      {/* ====================================================================
          3. Services Section (#services)
          ==================================================================== */}
      <Section
        id="services"
        className="ds-services-section"
        eyebrow="CAPABILITIES & PRACTICE AREAS"
        title={content.services?.heading}
        sub={content.services?.sub}
      >
        <ServicesSection
          services={publishedServices}
          onDiscussService={openBookingWithService}
        />

        <CtaBand
          heading={content.services?.ctaBand?.heading}
          buttonText={content.services?.ctaBand?.buttonText}
          onButtonClick={() => openBookingWithService('')}
        />
      </Section>

      {/* ====================================================================
          4. Process Section
          ==================================================================== */}
      {publishedSteps.length > 0 && (
        <Section
          id="process"
          className="ds-process-section"
          eyebrow="METHODOLOGY"
          title={content.process?.heading}
          sub={content.process?.sub}
        >
          <div className="ds-process-grid">
            {publishedSteps.map((step, idx) => (
              <div key={step.id} className="ds-process-card">
                <span className="ds-process-kicker">0{idx + 1}</span>
                <h3 className="ds-process-title">{step.title}</h3>
                <p className="ds-process-body">{step.body}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ====================================================================
          5. Contact Section (#contact)
          ==================================================================== */}
      <Section
        id="contact"
        className="ds-contact-section"
        eyebrow="GET IN TOUCH"
        title={content.contact?.heading}
        sub={content.contact?.sub}
        ticks
      >
        <div className="ds-contact-container">
          <div className="ds-contact-actions">
            <button
              type="button"
              className="ds-btn ds-btn-primary ds-btn-large"
              onClick={() => openBookingWithService('')}
            >
              {content.contact?.primaryCta || 'BOOK A CALL'} →
            </button>

            {content.contact?.crossLinkText && (
              <a
                href={content.contact.crossLinkHref}
                onClick={(e) => {
                  e.preventDefault();
                  if (onNavigate) onNavigate(content.contact.crossLinkHref);
                }}
                className="ds-contact-crosslink"
              >
                {content.contact.crossLinkText}
              </a>
            )}
          </div>
        </div>
      </Section>

      {/* Accessible Booking Modal */}
      <BookingDialog
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        variant="call"
        preselect={selectedService}
        settings={siteSettings}
        dialogContent={content.dialog}
        servicesList={publishedServices}
      />
    </main>
  );
}
