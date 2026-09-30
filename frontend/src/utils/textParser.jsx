import React from 'react';

/**
 * Safe text parser for headlines and body text.
 * - Converts *word* into gold true-italic emphasis with animated SVG underline.
 * - Converts \n into line breaks (<br />).
 * - Avoids dangerouslySetInnerHTML completely.
 */
export function parseEmphasisText(text) {
  if (typeof text !== 'string') return text;

  // Split by newline first
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    // Split line by *accent* syntax
    const segments = line.split(/(\*[^*]+\*)/g);

    const parsedSegments = segments.map((seg, segIdx) => {
      if (seg.startsWith('*') && seg.endsWith('*') && seg.length > 2) {
        const word = seg.slice(1, -1);
        return (
          <span key={`acc-${lineIdx}-${segIdx}`} className="quote-accent-word">
            <em>{word}</em>
            <svg
              className="accent-underline-svg"
              viewBox="0 0 100 12"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                className="accent-underline-path"
                d="M 2 7 Q 25 3, 50 6 T 98 5"
              />
            </svg>
          </span>
        );
      }
      return seg;
    });

    return (
      <React.Fragment key={`line-${lineIdx}`}>
        {parsedSegments}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}
