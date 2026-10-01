import React from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../../content';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { prefetchRoute } from '../../utils/prefetch';
import './WorkshopsAboutPage.css';

export default function WorkshopsAboutPage() {
  const content = useContent('workshops');
  useDocumentMeta({
    title: 'About the Instructors & Team — ATHYKA Workshops',
    description: 'Builders first, teachers second. That is why the sessions are hands-on.'
  });

  const team = (content.about?.team || []).filter((t) => t.status === 'published');
  const proof = (content.about?.proof || []).filter((p) => p.status === 'published');

  return (
    <div className="ws-about-container">
      {/* 1. Header */}
      <header className="ws-about-header">
        <span className="ws-about-eyebrow">FACULTY & PEDAGOGY</span>
        <h1 className="ws-about-title">{content.about?.heading || 'The people who will be in your room.'}</h1>
        <p className="ws-about-sub">{content.about?.sub || 'Builders first, teachers second.'}</p>
      </header>

      {/* 2. Proof Metric Strip */}
      {proof.length > 0 && (
        <section className="ws-proof-strip" aria-label="Program track record">
          {proof.map((item) => (
            <div key={item.id} className="ws-proof-card">
              <span className="proof-val">{item.value}</span>
              <span className="proof-lbl">{item.label}</span>
            </div>
          ))}
        </section>
      )}

      {/* 3. Team Grid */}
      <section className="ws-team-section">
        <h2 className="ws-team-heading">Instructors & Systems Engineers</h2>

        {team.length === 0 ? (
          <div className="team-empty-card">
            <p className="team-empty-msg">
              Instructor profiles are being finalized. Speak with our coordinators directly:
            </p>
            <Link to="/workshops/book" className="ds-btn-gold">
              SCHEDULE A CAMPUS INTRO CALL →
            </Link>
          </div>
        ) : (
          <div className="ws-team-grid">
            {team.map((member) => (
              <div key={member.id} className="ws-member-card">
                <div className="member-photo-frame">
                  <img
                    src={member.photo?.url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'}
                    alt={member.name}
                    width={320}
                    height={320}
                    className="member-img"
                  />
                </div>
                <div className="member-info">
                  <h3 className="member-name">{member.name}</h3>
                  <span className="member-role">{member.role}</span>
                  <p className="member-flex">{member.flexLine}</p>

                  {member.links && member.links.length > 0 && (
                    <div className="member-links">
                      {member.links.map((lnk, i) => (
                        <a key={i} href={lnk.url} target="_blank" rel="noopener noreferrer" className="member-link-tag">
                          {lnk.label} ↗
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Bottom CTA */}
      <section className="ws-about-cta-band">
        <h2 className="cta-band-title">Want to invite our team to your institution?</h2>
        <p className="cta-band-sub">
          We bring turnkey hardware/software setups and live code walkthroughs directly to your lecture hall.
        </p>
        <Link
          to="/workshops/book"
          onMouseEnter={() => prefetchRoute('/workshops/book')}
          className="ds-btn-gold"
        >
          BOOK A CAMPUS WORKSHOP →
        </Link>
      </section>
    </div>
  );
}
