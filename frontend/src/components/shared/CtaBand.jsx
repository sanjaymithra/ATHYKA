import React from 'react';
import { parseEmphasisText } from '../../utils/textParser';
import './CtaBand.css';

export default function CtaBand({
  heading,
  sub,
  buttonText = 'BOOK A CALL',
  onButtonClick
}) {
  return (
    <aside className="cta-band-wrapper">
      <div className="cta-band-content">
        <div className="cta-band-text">
          <h3 className="cta-band-heading">
            {parseEmphasisText(heading)}
          </h3>
          {sub && <p className="cta-band-sub">{sub}</p>}
        </div>
        <button
          type="button"
          className="cta-band-btn"
          onClick={onButtonClick}
        >
          {buttonText} →
        </button>
      </div>
    </aside>
  );
}
