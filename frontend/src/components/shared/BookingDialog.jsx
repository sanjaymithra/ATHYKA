import React, { useState, useEffect, useRef } from 'react';
import { submitLead } from '../../utils/leads';
import { track } from '../../utils/analytics';
import './BookingDialog.css';

export default function BookingDialog({
  isOpen,
  onClose,
  variant = 'call', // 'call' | 'workshop'
  preselect = '',
  settings = {},
  dialogContent = {},
  servicesList = []
}) {
  const dialogRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    problem: '',
    service: preselect || 'Not sure yet',
    company: '',
    institution: '',
    role: '',
    city: '',
    participants: '50–150',
    topic: 'Software',
    month: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  // Update preselect if passed
  useEffect(() => {
    if (preselect) {
      setFormData(prev => ({ ...prev, service: preselect }));
    }
  }, [preselect]);

  // Focus trap and accessibility
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElementRef.current = document.activeElement;
    track('booking_open', { variant });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on first interactive element
    const timer = setTimeout(() => {
      if (dialogRef.current) {
        const firstInput = dialogRef.current.querySelector('input, textarea, select');
        if (firstInput) firstInput.focus();
      }
    }, 100);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, variant, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (variant === 'call') {
      if (!formData.name.trim()) errs.name = 'Please provide your name.';
      if (!formData.email.trim() || !formData.email.includes('@')) {
        errs.email = 'Please provide a valid email address.';
      }
      if (!formData.problem.trim()) {
        errs.problem = 'Please tell us what problem you are trying to solve.';
      }
    } else {
      if (!formData.institution.trim()) errs.institution = 'Please enter your institution name.';
      if (!formData.role.trim()) errs.role = 'Please enter your role or department.';
      if (!formData.city.trim()) errs.city = 'Please enter your campus city.';
      if (!formData.month.trim()) errs.month = 'Please state your preferred month or timeframe.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await submitLead(variant, formData, settings);
      setSubmitResult(result);
      setSuccess(true);
    } catch (err) {
      console.error('Lead submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setErrors({});
    onClose();
  };

  const serviceOptions = servicesList.length > 0
    ? servicesList.map(s => s.title)
    : [
        'Web development',
        'UI/UX design',
        'ERP systems',
        'AI integrations',
        'SEO optimization',
        'Booking platforms',
        'Dashboard systems',
        'Branding & identity',
        'Maintenance & support',
        'Digital marketing'
      ];

  const content = dialogContent || {};

  return (
    <div className="booking-modal-overlay" onClick={onClose} aria-hidden="true">
      <div
        className="booking-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-dialog-title"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          className="booking-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          ✕
        </button>

        {!success ? (
          <>
            <header className="booking-header">
              <span className="booking-eyebrow">
                {variant === 'call' ? 'DISCOVERY CALL' : 'CAMPUS WORKSHOP'}
              </span>
              <h2 id="booking-dialog-title" className="booking-title">
                {content.title || (variant === 'call' ? 'Book a call' : 'Book a workshop')}
              </h2>
              <p className="booking-sub">
                {content.sub ||
                  (variant === 'call'
                    ? 'Direct, technical conversation. No account managers.'
                    : "Tell us about your students and your goals. We'll plan the day around them.")}
              </p>
            </header>

            <form className="booking-form" onSubmit={handleSubmit} noValidate>
              {variant === 'call' ? (
                <>
                  <div className="booking-field-group">
                    <label htmlFor="call-name" className="booking-label">
                      Your Name <span className="req">*</span>
                    </label>
                    <input
                      id="call-name"
                      type="text"
                      className={`booking-input ${errors.name ? 'is-error' : ''}`}
                      placeholder={content.fields?.name?.placeholder || 'e.g. Maya Lin'}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    {errors.name && <span className="booking-error-text">{errors.name}</span>}
                  </div>

                  <div className="booking-field-group">
                    <label htmlFor="call-email" className="booking-label">
                      Email Address <span className="req">*</span>
                    </label>
                    <input
                      id="call-email"
                      type="email"
                      className={`booking-input ${errors.email ? 'is-error' : ''}`}
                      placeholder={content.fields?.email?.placeholder || 'maya@company.com'}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {errors.email && <span className="booking-error-text">{errors.email}</span>}
                  </div>

                  <div className="booking-field-group">
                    <label htmlFor="call-problem" className="booking-label">
                      What problem are you trying to solve? <span className="req">*</span>
                    </label>
                    <textarea
                      id="call-problem"
                      rows={3}
                      className={`booking-textarea ${errors.problem ? 'is-error' : ''}`}
                      placeholder={
                        content.fields?.problem?.placeholder ||
                        'Describe what is currently slow, broken, or costing your team time...'
                      }
                      value={formData.problem}
                      onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                    />
                    {errors.problem && <span className="booking-error-text">{errors.problem}</span>}
                  </div>

                  <div className="booking-field-row">
                    <div className="booking-field-group">
                      <label htmlFor="call-service" className="booking-label">
                        Service of interest
                      </label>
                      <select
                        id="call-service"
                        className="booking-select"
                        value={formData.service}
                        onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      >
                        <option value="Not sure yet">Not sure yet</option>
                        {serviceOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="booking-field-group">
                      <label htmlFor="call-company" className="booking-label">
                        Company (optional)
                      </label>
                      <input
                        id="call-company"
                        type="text"
                        className="booking-input"
                        placeholder="e.g. Acme Corp"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="booking-field-row">
                    <div className="booking-field-group">
                      <label htmlFor="ws-institution" className="booking-label">
                        Institution Name <span className="req">*</span>
                      </label>
                      <input
                        id="ws-institution"
                        type="text"
                        className={`booking-input ${errors.institution ? 'is-error' : ''}`}
                        placeholder="e.g. National Institute of Design"
                        value={formData.institution}
                        onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      />
                      {errors.institution && (
                        <span className="booking-error-text">{errors.institution}</span>
                      )}
                    </div>

                    <div className="booking-field-group">
                      <label htmlFor="ws-role" className="booking-label">
                        Your Role / Department <span className="req">*</span>
                      </label>
                      <input
                        id="ws-role"
                        type="text"
                        className={`booking-input ${errors.role ? 'is-error' : ''}`}
                        placeholder="e.g. Head of Computer Science"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      />
                      {errors.role && <span className="booking-error-text">{errors.role}</span>}
                    </div>
                  </div>

                  <div className="booking-field-row">
                    <div className="booking-field-group">
                      <label htmlFor="ws-city" className="booking-label">
                        City / Campus Location <span className="req">*</span>
                      </label>
                      <input
                        id="ws-city"
                        type="text"
                        className={`booking-input ${errors.city ? 'is-error' : ''}`}
                        placeholder="e.g. Pune"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      />
                      {errors.city && <span className="booking-error-text">{errors.city}</span>}
                    </div>

                    <div className="booking-field-group">
                      <label htmlFor="ws-participants" className="booking-label">
                        Expected Participants
                      </label>
                      <select
                        id="ws-participants"
                        className="booking-select"
                        value={formData.participants}
                        onChange={(e) => setFormData({ ...formData, participants: e.target.value })}
                      >
                        <option value="<50">&lt;50 students</option>
                        <option value="50–150">50–150 students</option>
                        <option value="150–400">150–400 students</option>
                        <option value="400+">400+ students</option>
                      </select>
                    </div>
                  </div>

                  <div className="booking-field-row">
                    <div className="booking-field-group">
                      <label htmlFor="ws-topic" className="booking-label">
                        Focus Topic
                      </label>
                      <select
                        id="ws-topic"
                        className="booking-select"
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      >
                        <option value="Software">Software Engineering</option>
                        <option value="Automation">Workflow Automation</option>
                        <option value="AI">Applied AI & ML</option>
                        <option value="Not sure">Not sure / Custom</option>
                      </select>
                    </div>

                    <div className="booking-field-group">
                      <label htmlFor="ws-month" className="booking-label">
                        Preferred Month <span className="req">*</span>
                      </label>
                      <input
                        id="ws-month"
                        type="text"
                        className={`booking-input ${errors.month ? 'is-error' : ''}`}
                        placeholder="e.g. November 2026"
                        value={formData.month}
                        onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      />
                      {errors.month && <span className="booking-error-text">{errors.month}</span>}
                    </div>
                  </div>

                  <div className="booking-field-group">
                    <label htmlFor="ws-message" className="booking-label">
                      Additional Context (optional)
                    </label>
                    <textarea
                      id="ws-message"
                      rows={2}
                      className="booking-textarea"
                      placeholder="Tell us about your cohort background and target outcomes..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>
                </>
              )}

              <footer className="booking-footer">
                <button
                  type="submit"
                  className="booking-submit-btn"
                  disabled={submitting}
                >
                  {submitting
                    ? 'TRANSMITTING...'
                    : content.submitLabel ||
                      (variant === 'call' ? 'SUBMIT INQUIRY' : 'SUBMIT WORKSHOP REQUEST')}
                </button>
              </footer>
            </form>
          </>
        ) : (
          <div className="booking-success-view">
            <div className="booking-success-icon">✓</div>
            <h3 className="booking-success-title">Message Received</h3>
            <p className="booking-success-msg">
              {variant === 'call'
                ? "Got it. We'll read it properly and reply with an honest take."
                : "Got it. We'll get back to you to plan the day."}
            </p>
            {submitResult?.method === 'mailto' && (
              <p className="booking-mailto-hint">
                A draft has also been opened in your email client for immediate sending.
              </p>
            )}
            <button
              type="button"
              className="booking-done-btn"
              onClick={handleReset}
            >
              DONE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
