import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import './NotFoundPage.css';

export default function NotFoundPage() {
  const navigate = useNavigate();

  useDocumentMeta({
    title: '404 — Page Not Found · ATHYKA',
    description: 'The requested route or case study does not exist.'
  });

  const handleBack = () => {
    if (
      typeof window !== 'undefined' &&
      window.history.state &&
      typeof window.history.state.idx === 'number' &&
      window.history.state.idx > 0
    ) {
      navigate(-1);
    } else {
      navigate('/home', { replace: true });
    }
  };

  return (
    <div className="notfound-container">
      <div className="notfound-content">
        <span className="notfound-code">404</span>
        <h1 className="notfound-title">Route or case study not found</h1>
        <p className="notfound-sub">
          The requested coordinate does not exist or may have been unlisted.
        </p>

        <div className="notfound-actions">
          <button type="button" onClick={handleBack} className="ds-btn-outline notfound-back-btn">
            ← GO BACK
          </button>
          <Link to="/home" className="ds-btn-gold">
            RETURN TO ATHYKA HOME →
          </Link>
        </div>
      </div>
    </div>
  );
}
