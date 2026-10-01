import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useContent } from '../../content';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { submitLead } from '../../utils/leads';
import './ContactPage.css';

export default function ContactPage() {
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get('service') || '';

  const siteSettings = useContent('siteSettings');
  const dsContent = useContent('digitalServices');
  const services = dsContent.services?.items || [];
  const faqs = siteSettings.faq || [];
  const nextSteps = siteSettings.processStepsStrip || [];

  useDocumentMeta({
    title: 'Book a Call — ATHYKA Digital Services',
    description: 'Tell us the problem. We will evaluate technical feasibility and return a concrete plan.'
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    service: preselectedService,
    budget: '',
    challenge: ''
  });

  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.challenge) {
      setStatus({ state: 'error', message: 'Please fill in all required fields (Name, Email, Challenge).' });
      return;
    }

    setStatus({ state: 'submitting', message: '' });

    try {
      const result = await submitLead({
        type: 'digital_services_call',
        ...formData
      });

      if (result.success) {
        setStatus({
          state: 'success',
          message: 'Your briefing has been received. An engineer will review your operational requirements and reach out within 24 hours.'
        });
      } else {
        setStatus({ state: 'error', message: result.error || 'Submission failed. Please email us directly.' });
      }
    } catch {
      setStatus({ state: 'error', message: 'Unable to submit at this time. Please email us directly.' });
    }
  };

  return (
    <div className="contact-page-container">
      {/* 1. Header */}
      <header className="contact-header">
        <span className="contact-eyebrow">DIGITAL SERVICES / INITIATION</span>
        <h1 className="contact-title">Book a Call</h1>
        <p className="contact-sub">
          Tell us the operational bottleneck. We'll tell you honestly if our engineering team is the right fit.
        </p>
      </header>

      {/* 2. Main Grid: Form on Left, Direct Channels & What Happens Next on Right */}
      <div className="contact-main-grid">
        {/* Left: Full Page Form */}
        <section className="contact-form-section">
          {status.state === 'success' ? (
            <div className="contact-success-banner" role="status">
              <span className="success-icon" aria-hidden="true">✓</span>
              <h2 className="success-title">Briefing Received</h2>
              <p className="success-desc">{status.message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form" noValidate>
              {status.state === 'error' && (
                <div className="contact-error-alert" role="alert">
                  {status.message}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="contact-name" className="form-label">
                  Your Name <span className="req">*</span>
                </label>
                <input
                  id="contact-name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Alex Vance"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label htmlFor="contact-email" className="form-label">
                    Work Email <span className="req">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="alex@company.com"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-company" className="form-label">
                    Company / Organization
                  </label>
                  <input
                    id="contact-company"
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="e.g. Meridian Logistics"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label htmlFor="contact-service" className="form-label">
                    Discipline Focus
                  </label>
                  <select
                    id="contact-service"
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">General Engineering Diagnosis</option>
                    {services.map((s) => (
                      <option key={s.slug} value={s.slug}>
                        {s.kicker} — {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="contact-budget" className="form-label">
                    Estimated Timeline / Budget
                  </label>
                  <select
                    id="contact-budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select scope tier...</option>
                    <option value="under_25k">&lt; $25k (Targeted fix or audit)</option>
                    <option value="25k_50k">$25k – $50k (Prototype / MVP)</option>
                    <option value="50k_plus">$50k+ (Full system production)</option>
                    <option value="undecided">To be scoped together</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="contact-challenge" className="form-label">
                  What is the operational problem you need solved? <span className="req">*</span>
                </label>
                <textarea
                  id="contact-challenge"
                  name="challenge"
                  value={formData.challenge}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Describe what hurts in your current workflows, tools, or performance..."
                  className="form-textarea"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={status.state === 'submitting'}
                className="ds-btn-gold form-submit-btn"
              >
                {status.state === 'submitting' ? 'TRANSMITTING...' : 'TRANSMIT BRIEFING →'}
              </button>
            </form>
          )}
        </section>

        {/* Right: Direct Channels & What Happens Next */}
        <aside className="contact-sidebar">
          {/* Direct channels */}
          <div className="sidebar-card">
            <span className="sidebar-tag">DIRECT INQUIRIES</span>
            <h3 className="sidebar-title">Prefer Email?</h3>
            <p className="sidebar-desc">
              Write directly to our engineering coordinators with your brief or RFP:
            </p>
            <a href={`mailto:${siteSettings.contactEmail || 'contact@athyka.com'}`} className="sidebar-email-link">
              {siteSettings.contactEmail || 'contact@athyka.com'} ↗
            </a>

            {siteSettings.social && (
              <div className="sidebar-social-links">
                {siteSettings.social.x && (
                  <a href={siteSettings.social.x} target="_blank" rel="noopener noreferrer" className="sidebar-social-item">
                    X (Twitter) ↗
                  </a>
                )}
                {siteSettings.social.linkedin && (
                  <a href={siteSettings.social.linkedin} target="_blank" rel="noopener noreferrer" className="sidebar-social-item">
                    LinkedIn ↗
                  </a>
                )}
              </div>
            )}
          </div>

          {/* 3-Step What Happens Next Strip */}
          <div className="sidebar-card">
            <span className="sidebar-tag">TRANSPARENCY</span>
            <h3 className="sidebar-title">What Happens Next</h3>
            <div className="sidebar-steps-list">
              {nextSteps.map((step) => (
                <div key={step.step} className="sidebar-step-item">
                  <span className="sidebar-step-num">{step.step}</span>
                  <div>
                    <h4 className="sidebar-step-heading">{step.title}</h4>
                    <p className="sidebar-step-text">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* 3. Objection-Handling FAQs */}
      {faqs.length > 0 && (
        <section className="contact-faq-section" aria-label="Frequently Asked Questions">
          <div className="faq-header">
            <span className="faq-tag">COMMON QUESTIONS</span>
            <h2 className="faq-title">Before we speak</h2>
          </div>

          <div className="faq-grid">
            {faqs.map((faq) => (
              <div key={faq.id} className="faq-card">
                <h3 className="faq-question">{faq.question}</h3>
                <p className="faq-answer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
