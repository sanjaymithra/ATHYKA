import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useContent } from '../../content';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { prefetchRoute } from '../../utils/prefetch';
import NotFoundPage from '../NotFoundPage';
import './WorkshopCaseStudyPage.css';

export default function WorkshopCaseStudyPage() {
  const { slug } = useParams();
  const content = useContent('workshops');
  const pastWorkshops = content.work?.pastWorkshops || [];

  const currentIndex = pastWorkshops.findIndex((w) => w.slug === slug);
  const session = currentIndex !== -1 ? pastWorkshops[currentIndex] : null;

  useDocumentMeta({
    title: session ? `${session.institution} Workshop — ATHYKA` : 'Session Not Found — ATHYKA',
    description: session?.topicTitle || 'ATHYKA campus workshop session.'
  });

  if (!session || session.status !== 'published') {
    return <NotFoundPage />;
  }

  const prevSession = currentIndex > 0 ? pastWorkshops[currentIndex - 1] : pastWorkshops[pastWorkshops.length - 1];
  const nextSession = currentIndex < pastWorkshops.length - 1 ? pastWorkshops[currentIndex + 1] : pastWorkshops[0];

  return (
    <article className="ws-study-container">
      <header className="ws-study-header">
        <div className="casestudy-meta-strip">
          <span className="casestudy-client-pill">{session.institution}</span>
          <span className="casestudy-dot">•</span>
          <span className="casestudy-industry">{session.city}</span>
          <span className="casestudy-dot">•</span>
          <span className="casestudy-year">{session.date || session.year}</span>
        </div>

        <h1 className="casestudy-title">{session.topicTitle || `${session.topic} Workshop`}</h1>
        <p className="casestudy-outcome-hero">"{session.quote}"</p>

        <div className="casestudy-services-row">
          <span className="casestudy-tag-label">PARTICIPANTS:</span>
          <span className="casestudy-service-link">{session.attendees}</span>
          <span className="casestudy-service-link">{session.topic}</span>
          <span className="casestudy-service-link">{session.institutionType}</span>
        </div>
      </header>

      {session.photo?.url && (
        <section className="casestudy-gallery">
          <figure className="casestudy-gallery-figure">
            <img
              src={session.photo.url}
              alt={session.photo.alt || session.institution}
              width={session.photo.width || 800}
              height={session.photo.height || 500}
              className="casestudy-gallery-img"
            />
          </figure>
        </section>
      )}

      <section className="casestudy-narrative-grid">
        <div className="narrative-card">
          <span className="narrative-eyebrow">01 / CAMPUS CONTEXT</span>
          <h2 className="narrative-heading">Challenge</h2>
          <p className="narrative-body">{session.challenge}</p>
        </div>

        <div className="narrative-card">
          <span className="narrative-eyebrow">02 / DELIVERABLES</span>
          <h2 className="narrative-heading">Outcomes</h2>
          <p className="narrative-body narrative-metric-highlight">{session.outcomes}</p>
        </div>

        <div className="narrative-card">
          <span className="narrative-eyebrow">03 / FACULTY NOTE</span>
          <h2 className="narrative-heading">Feedback</h2>
          <p className="narrative-body">"{session.quote}"</p>
        </div>
      </section>

      {/* Prev / Next Strip */}
      <nav className="casestudy-nav-strip" aria-label="Adjacent Sessions">
        {prevSession && (
          <Link
            to={`/workshops/work/${prevSession.slug}`}
            onMouseEnter={() => prefetchRoute(`/workshops/work/${prevSession.slug}`)}
            className="casestudy-nav-prev"
          >
            <span className="nav-dir-label">← PREVIOUS CAMPUS</span>
            <span className="nav-proj-title">{prevSession.institution}</span>
          </Link>
        )}

        {nextSession && (
          <Link
            to={`/workshops/work/${nextSession.slug}`}
            onMouseEnter={() => prefetchRoute(`/workshops/work/${nextSession.slug}`)}
            className="casestudy-nav-next"
          >
            <span className="nav-dir-label">NEXT CAMPUS →</span>
            <span className="nav-proj-title">{nextSession.institution}</span>
          </Link>
        )}
      </nav>

      {/* CTA */}
      <section className="casestudy-cta-band">
        <h2 className="cta-band-title">Want this on your campus?</h2>
        <p className="cta-band-sub">
          Tell us about your student cohort and timeline. We'll plan the day around your syllabus goals.
        </p>
        <Link
          to="/workshops/book"
          onMouseEnter={() => prefetchRoute('/workshops/book')}
          className="ds-btn-gold"
        >
          REQUEST CAMPUS DATES →
        </Link>
      </section>
    </article>
  );
}
