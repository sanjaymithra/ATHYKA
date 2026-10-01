import React, { useState } from 'react';
import { useContent } from '../../content';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { submitLead } from '../../utils/leads';
import './WorkshopsBookPage.css';

export default function WorkshopsBookPage() {
  const siteSettings = useContent('siteSettings');
  const wsContent = useContent('workshops');
  const dialog = wsContent.dialog || {};
  const fields = dialog.fields || {};
  const faqs = siteSettings.faq || [];
  const nextSteps = siteSettings.processStepsStrip || [];

  useDocumentMeta({
    title: 'Book a Workshop — ATHYKA',
    description: 'Bring ATHYKA instructors to your campus. Hands-on software, automation, and AI intensives.'
  });

  const [formData, setFormData] = useState({
    institution: '',
    role: '',
    city: '',
    participants: '<50',
    topic: 'Software',
    month: '',
    message: ''
  });

  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.institution || !formData.role || !formData.city) {
      setStatus({ state: 'error', message: 'Please fill in Institution, Role, and City.' });
      return;
    }

    setStatus({ state: 'submitting', message: '' });

    try {
      const res = await submitLead({
        type: 'workshop_booking',
        ...formData
      });

      if (res.success) {
        setStatus({
          state: 'success',
          message: dialog.successMessage || 'Got it. Our curriculum lead will reach out to coordinate schedule and lab requirements.'
        });
      } else {
        setStatus({ state: 'error', message: res.error || 'Submission failed. Please email us directly.' });
      }
    } catch {
      setStatus({ state: 'error', message: 'Unable to submit at this time. Please email us directly.' });
    }
  };

  return (
    <div className="ws-book-container">
      {/* 1. Header */}
      <header className="ws-book-header">
        <span className="ws-book-eyebrow">CAMPUS PROGRAM / SCHEDULING</span>
        <h1 className="ws-book-title">{dialog.title || 'Book a Workshop'}</h1>
        <p className="ws-book-sub">
          {dialog.sub || 'We come directly to your institution with turnkey materials, live demonstrations, and dedicated instructors.'}
        </p>
      </header>

      {/* 2. Main Grid: Form Left, Sidebar Right */}
      <div className="contact-main-grid">
        <section className="contact-form-section">
          {status.state === 'success' ? (
            <div className="contact-success-banner" role="status">
              <span className="success-icon" aria-hidden="true">✓</span>
              <h2 className="success-title">Request Received</h2>
              <p className="success-desc">{status.message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form" noValidate>
              {status.state === 'error' && (
                <div className="contact-error-alert" role="alert">
                  {status.message}
                </div>
              )}

              <div className="form-group-row">
                <div className="form-group">
                  <label htmlFor="ws-inst" className="form-label">
                    {fields.institution?.label || 'Institution Name'} <span className="req">*</span>
                  </label>
                  <input
                    id="ws-inst"
                    type="text"
                    name="institution"
                    value={formData.institution}
                    onChange={handleChange}
                    placeholder={fields.institution?.placeholder || 'e.g. National Institute of Design'}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ws-role" className="form-label">
                    {fields.role?.label || 'Your Role / Department'} <span className="req">*</span>
                  </label>
                  <input
                    id="ws-role"
                    type="text"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder={fields.role?.placeholder || 'e.g. Head of Computer Science'}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label htmlFor="ws-city" className="form-label">
                    {fields.city?.label || 'City / Location'} <span className="req">*</span>
                  </label>
                  <input
                    id="ws-city"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder={fields.city?.placeholder || 'e.g. Pune'}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ws-month" className="form-label">
                    {fields.month?.label || 'Target Month'}
                  </label>
                  <input
                    id="ws-month"
                    type="text"
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    placeholder={fields.month?.placeholder || 'e.g. November 2026'}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label htmlFor="ws-topic" className="form-label">
                    {fields.topic?.label || 'Focus Topic'}
                  </label>
                  <select
                    id="ws-topic"
                    name="topic"
                    value={formData.topic}
                    onChange={handleChange}
                    className="form-select"
                  >
                    {(fields.topic?.options || ['Software', 'Automation', 'AI', 'Not sure']).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="ws-participants" className="form-label">
                    {fields.participants?.label || 'Expected Cohort Size'}
                  </label>
                  <select
                    id="ws-participants"
                    name="participants"
                    value={formData.participants}
                    onChange={handleChange}
                    className="form-select"
                  >
                    {(fields.participants?.options || ['<50', '50–150', '150–400', '400+']).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt} students
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="ws-message" className="form-label">
                  {fields.message?.label || 'Additional Context (optional)'}
                </label>
                <textarea
                  id="ws-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder={fields.message?.placeholder || 'Tell us about student prerequisite background and syllabus goals...'}
                  className="form-textarea"
                />
              </div>

              <button
                type="submit"
                disabled={status.state === 'submitting'}
                className="ds-btn-gold form-submit-btn"
              >
                {status.state === 'submitting' ? 'PROCESSING...' : (dialog.submitLabel || 'SUBMIT WORKSHOP REQUEST →')}
              </button>
            </form>
          )}
        </section>

        {/* Sidebar */}
        <aside className="contact-sidebar">
          <div className="sidebar-card">
            <span className="sidebar-tag">CAMPUS LOGISTICS</span>
            <h3 className="sidebar-title">What We Provide</h3>
            <p className="sidebar-desc">
              ATHYKA provides complete starter codebases, student cloud sandbox environments, slides, and post-session certification keys.
            </p>
            <a href={`mailto:${siteSettings.contactEmail || 'contact@athyka.com'}`} className="sidebar-email-link">
              Email Coordinators: {siteSettings.contactEmail || 'contact@athyka.com'} ↗
            </a>
          </div>

          <div className="sidebar-card">
            <span className="sidebar-tag">CAMPUS TIMELINE</span>
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

      {/* 3. Common Objection FAQs */}
      {faqs.length > 0 && (
        <section className="contact-faq-section" aria-label="Campus FAQs">
          <div className="faq-header">
            <span className="faq-tag">INSTITUTION FAQ</span>
            <h2 className="faq-title">Frequently Asked Questions</h2>
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
