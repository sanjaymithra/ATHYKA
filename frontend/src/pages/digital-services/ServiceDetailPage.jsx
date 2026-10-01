import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useContent } from '../../content';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { prefetchRoute } from '../../utils/prefetch';
import NotFoundPage from '../NotFoundPage';
import './ServiceDetailPage.css';

export default function ServiceDetailPage() {
  const { slug } = useParams();
  const content = useContent('digitalServices');
  const services = content.services?.items || [];
  const allProjects = content.work?.projects || [];
  const processSteps = content.process?.items || [];

  const service = services.find((s) => s.slug === slug);

  useDocumentMeta({
    title: service ? `${service.title} (${service.kicker}) — ATHYKA Digital Services` : 'Service Not Found — ATHYKA',
    description: service?.body || 'ATHYKA service discipline detail.'
  });

  if (!service || service.status !== 'published') {
    return <NotFoundPage />;
  }

  // Filter projects tagged with this service slug
  const relatedProjects = allProjects.filter((p) => p.services?.includes(slug)).slice(0, 3);

  return (
    <article className="servicedetail-container">
      {/* 1. Header & Challenge */}
      <header className="servicedetail-header">
        <div className="servicedetail-eyebrow-row">
          <span className="servicedetail-order">DISCIPLINE 0{service.order}</span>
          <span className="servicedetail-kicker">{service.kicker}</span>
        </div>
        <h1 className="servicedetail-title">{service.title}</h1>
        <p className="servicedetail-challenge-highlight">"{service.challenge}"</p>
        <p className="servicedetail-body">{service.body}</p>

        <div className="servicedetail-cta-row">
          <Link
            to={`/digital-services/contact?service=${service.slug}`}
            onMouseEnter={() => prefetchRoute('/digital-services/contact')}
            className="ds-btn-gold"
          >
            DISCUSS THIS DISCIPLINE →
          </Link>
        </div>
      </header>

      {/* 2. What We Solve */}
      <section className="servicedetail-solves-section">
        <span className="servicedetail-section-tag">01 / RESOLUTION</span>
        <h2 className="servicedetail-section-title">What we solve</h2>
        <div className="servicedetail-solves-grid">
          {service.solves?.map((solve, idx) => (
            <div key={idx} className="solves-card">
              <span className="solves-icon" aria-hidden="true">✕</span>
              <p className="solves-text">{solve}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. How We Would Approach It (Process Steps) */}
      <section className="servicedetail-process-section">
        <span className="servicedetail-section-tag">02 / EXECUTION</span>
        <h2 className="servicedetail-section-title">How we approach it</h2>
        <div className="servicedetail-process-grid">
          {processSteps.map((step, idx) => (
            <div key={step.id} className="servicedetail-step-card">
              <span className="step-num">STEP 0{idx + 1}</span>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Related Work */}
      {relatedProjects.length > 0 && (
        <section className="servicedetail-related-section">
          <div className="related-header-row">
            <div>
              <span className="servicedetail-section-tag">03 / EVIDENCE</span>
              <h2 className="servicedetail-section-title">Related Case Studies</h2>
            </div>
            <Link to={`/digital-services/work?service=${service.slug}`} className="related-view-all">
              VIEW ALL IN WORK →
            </Link>
          </div>

          <div className="servicedetail-related-grid">
            {relatedProjects.map((proj) => (
              <Link
                key={proj.id}
                to={`/digital-services/work/${proj.slug}`}
                onMouseEnter={() => prefetchRoute(`/digital-services/work/${proj.slug}`)}
                className="servicedetail-project-card"
              >
                <div className="rel-card-media">
                  <img
                    src={proj.gallery?.[0]?.url || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop'}
                    alt={proj.name}
                    loading="lazy"
                    width={400}
                    height={250}
                    className="rel-card-img"
                  />
                </div>
                <div className="rel-card-body">
                  <span className="rel-card-client">{proj.client}</span>
                  <h3 className="rel-card-title">{proj.name}</h3>
                  <p className="rel-card-outcome">{proj.outcome}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 5. Preselected Contact CTA Band */}
      <section className="servicedetail-bottom-band">
        <h2 className="bottom-band-heading">Ready to engineer an answer for {service.title}?</h2>
        <p className="bottom-band-sub">
          We test all hypotheses through working software before expanding scope.
        </p>
        <Link
          to={`/digital-services/contact?service=${service.slug}`}
          onMouseEnter={() => prefetchRoute('/digital-services/contact')}
          className="ds-btn-gold"
        >
          BOOK A CALL (PRESELECTS {service.kicker}) →
        </Link>
      </section>
    </article>
  );
}
