import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useContent } from '../../content';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { prefetchRoute } from '../../utils/prefetch';
import NotFoundPage from '../NotFoundPage';
import './CaseStudyDetailPage.css';

export default function CaseStudyDetailPage() {
  const { slug } = useParams();
  const content = useContent('digitalServices');
  const projects = content.work?.projects || [];

  const currentIndex = projects.findIndex((p) => p.slug === slug);
  const project = currentIndex !== -1 ? projects[currentIndex] : null;

  useDocumentMeta({
    title: project ? `${project.name} — ATHYKA Case Study` : 'Project Not Found — ATHYKA',
    description: project?.outcome || 'ATHYKA engineering case study.'
  });

  if (!project || project.status !== 'published') {
    return <NotFoundPage />;
  }

  const prevProject = currentIndex > 0 ? projects[currentIndex - 1] : projects[projects.length - 1];
  const nextProject = currentIndex < projects.length - 1 ? projects[currentIndex + 1] : projects[0];
  const primaryServiceSlug = project.services?.[0] || 'web-development';

  return (
    <article className="casestudy-container">
      {/* 1. Header & Metadata */}
      <header className="casestudy-header">
        <div className="casestudy-meta-strip">
          <span className="casestudy-client-pill">{project.client}</span>
          <span className="casestudy-dot">•</span>
          <span className="casestudy-industry">{project.industry}</span>
          <span className="casestudy-dot">•</span>
          <span className="casestudy-year">{project.year}</span>
        </div>

        <h1 className="casestudy-title">{project.name}</h1>
        <p className="casestudy-outcome-hero">{project.outcome}</p>

        <div className="casestudy-services-row">
          <span className="casestudy-tag-label">DISCIPLINES:</span>
          {project.services?.map((s) => (
            <Link
              key={s}
              to={`/digital-services/services/${s}`}
              className="casestudy-service-link"
            >
              {s.replace(/-/g, ' ')}
            </Link>
          ))}
        </div>
      </header>

      {/* 2. Primary Showcase Gallery */}
      {project.gallery && project.gallery.length > 0 && (
        <section className="casestudy-gallery" aria-label="Project Gallery">
          {project.gallery.map((img, idx) => (
            <figure key={idx} className="casestudy-gallery-figure">
              <img
                src={img.url}
                alt={img.alt || project.name}
                loading={idx === 0 ? 'eager' : 'lazy'}
                width={img.width || 800}
                height={img.height || 500}
                className="casestudy-gallery-img"
              />
              {img.alt && <figcaption className="casestudy-gallery-caption">{img.alt}</figcaption>}
            </figure>
          ))}
        </section>
      )}

      {/* 3. Deep Dive Narrative Grid: Challenge, Approach, Result */}
      <section className="casestudy-narrative-grid">
        <div className="narrative-card narrative-challenge">
          <span className="narrative-eyebrow">01 / THE BOTTLENECK</span>
          <h2 className="narrative-heading">Challenge</h2>
          <p className="narrative-body">{project.challenge}</p>
        </div>

        <div className="narrative-card narrative-approach">
          <span className="narrative-eyebrow">02 / ARCHITECTURE</span>
          <h2 className="narrative-heading">Approach</h2>
          <p className="narrative-body">{project.approach}</p>
        </div>

        <div className="narrative-card narrative-result">
          <span className="narrative-eyebrow">03 / METRIC IMPACT</span>
          <h2 className="narrative-heading">Measured Results</h2>
          <p className="narrative-body narrative-metric-highlight">{project.result}</p>
        </div>
      </section>

      {/* 4. Testimonial */}
      {project.testimonial && (
        <section className="casestudy-testimonial-section">
          <blockquote className="casestudy-quote">
            "{project.testimonial.quote}"
          </blockquote>
          <div className="casestudy-author">
            <cite className="author-name">{project.testimonial.name}</cite>
            <span className="author-role">{project.testimonial.role}</span>
          </div>
        </section>
      )}

      {/* 5. External Link (if available) */}
      {project.externalLink && (
        <div className="casestudy-ext-link-row">
          <a
            href={project.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="casestudy-external-btn"
          >
            VISIT LIVE PLATFORM ↗
          </a>
        </div>
      )}

      {/* 6. Previous / Next Project Links */}
      <nav className="casestudy-nav-strip" aria-label="Adjacent Case Studies">
        {prevProject && (
          <Link
            to={`/digital-services/work/${prevProject.slug}`}
            onMouseEnter={() => prefetchRoute(`/digital-services/work/${prevProject.slug}`)}
            className="casestudy-nav-prev"
          >
            <span className="nav-dir-label">← PREVIOUS CASE STUDY</span>
            <span className="nav-proj-title">{prevProject.name}</span>
          </Link>
        )}

        {nextProject && (
          <Link
            to={`/digital-services/work/${nextProject.slug}`}
            onMouseEnter={() => prefetchRoute(`/digital-services/work/${nextProject.slug}`)}
            className="casestudy-nav-next"
          >
            <span className="nav-dir-label">NEXT CASE STUDY →</span>
            <span className="nav-proj-title">{nextProject.name}</span>
          </Link>
        )}
      </nav>

      {/* 7. "Have a similar problem?" CTA Band */}
      <section className="casestudy-cta-band">
        <h2 className="cta-band-title">Have a similar problem? Tell us about yours.</h2>
        <p className="cta-band-sub">
          We dissect the requirements upfront and deliver an architectural roadmap before starting.
        </p>
        <Link
          to={`/digital-services/contact?service=${primaryServiceSlug}`}
          onMouseEnter={() => prefetchRoute('/digital-services/contact')}
          className="ds-btn-gold"
        >
          BOOK A CALL TO DISCUSS THIS →
        </Link>
      </section>
    </article>
  );
}
