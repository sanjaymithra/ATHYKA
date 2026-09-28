'use client';

import React, { useId } from 'react';

export default function DocumentIcon({ className = '' }) {
  const uid = useId().replace(/:/g, '');
  const pageGradId = `docPageGrad-${uid}`;
  const foldGradId = `docFoldGrad-${uid}`;
  const specularId = `docSpecular-${uid}`;
  const shadowId = `docShadowGrad-${uid}`;

  // Generate dot-dither strip near bottom
  const ditherDots = [];
  for (let x = 34; x <= 126; x += 8) {
    ditherDots.push(
      <rect key={`r1-${x}`} x={x} y={162} width={3} height={3} fill="#141414" opacity={0.4} />
    );
    ditherDots.push(
      <rect key={`r2-${x}`} x={x + 4} y={168} width={3} height={3} fill="#141414" opacity={0.3} />
    );
  }

  return (
    <svg
      viewBox="0 0 160 200"
      className={`stage-object-svg document-icon-svg ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Page gradient */}
        <linearGradient id={pageGradId} x1="22" y1="6" x2="150" y2="194" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBF0" />
          <stop offset="100%" stopColor="#E6DABA" />
        </linearGradient>

        {/* Fold gradient */}
        <linearGradient id={foldGradId} x1="106" y1="6" x2="150" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#CDBF96" />
          <stop offset="100%" stopColor="#EFE6CB" />
        </linearGradient>

        {/* Top-left specular highlight */}
        <linearGradient id={specularId} x1="22" y1="6" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Contact shadow dither pattern */}
        <radialGradient id={shadowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#000000" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Contact Shadow Under Page */}
      <ellipse cx="80" cy="195" rx="58" ry="5" fill={`url(#${shadowId})`} />

      {/* Main Page Body */}
      <path
        d="M22 6 H106 L150 50 V182 a12 12 0 0 1 -12 12 H22 a12 12 0 0 1 -12 -12 V18 a12 12 0 0 1 12 -12 Z"
        fill={`url(#${pageGradId})`}
        stroke="rgba(0, 0, 0, 0.12)"
        strokeWidth="1"
      />

      {/* Specular Highlight Overlay */}
      <path
        d="M22 6 H106 L120 20 H36 a14 14 0 0 0 -14 14 V120 L10 100 V18 a12 12 0 0 1 12 -12 Z"
        fill={`url(#${specularId})`}
      />

      {/* Shadow Under Folded Flap */}
      <path
        d="M106 50 L150 50 L106 6 Z"
        fill="rgba(0, 0, 0, 0.08)"
      />
      <path
        d="M106 50 H150"
        stroke="rgba(0, 0, 0, 0.18)"
        strokeWidth="2"
      />

      {/* Folded Corner */}
      <path
        d="M106 6 V38 a12 12 0 0 0 12 12 H150 Z"
        fill={`url(#${foldGradId})`}
        stroke="rgba(0, 0, 0, 0.14)"
        strokeWidth="1"
      />

      {/* Central Code Glyph: < / > */}
      {/* Left Bracket < */}
      <path
        d="M58 92 L36 112 L58 132"
        stroke="#141414"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center Slash / */}
      <path
        d="M88 88 L72 136"
        stroke="#B89B4A"
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* Right Bracket > */}
      <path
        d="M102 92 L124 112 L102 132"
        stroke="#141414"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dither Strip Echoing Artwork */}
      {ditherDots}
    </svg>
  );
}
