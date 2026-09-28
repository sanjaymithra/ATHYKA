'use client';

import React, { useId } from 'react';

export default function NotebookIcon({ className = '' }) {
  const uid = useId().replace(/:/g, '');
  const coverGradId = `nbCoverGrad-${uid}`;
  const coilGradId = `nbCoilGrad-${uid}`;
  const sheenId = `nbSheen-${uid}`;
  const shadowId = `nbShadowGrad-${uid}`;

  // 9 coils spaced 18 apart starting at y = 26
  const coilYs = [26, 44, 62, 80, 98, 116, 134, 152, 170];

  return (
    <svg
      viewBox="0 0 160 200"
      className={`stage-object-svg notebook-icon-svg ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Cover dark gradient */}
        <linearGradient id={coverGradId} x1="16" y1="6" x2="148" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2A2A2A" />
          <stop offset="60%" stopColor="#181818" />
          <stop offset="100%" stopColor="#0B0B0B" />
        </linearGradient>

        {/* Coil gold metallic gradient */}
        <linearGradient id={coilGradId} x1="3" y1="0" x2="29" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FAF1D2" />
          <stop offset="40%" stopColor="#D8C48A" />
          <stop offset="80%" stopColor="#9C7F32" />
          <stop offset="100%" stopColor="#E2D19D" />
        </linearGradient>

        {/* Subtle cover sheen / edge highlight */}
        <linearGradient id={sheenId} x1="16" y1="6" x2="60" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Contact shadow */}
        <radialGradient id={shadowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#000000" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Contact Shadow Under Notebook */}
      <ellipse cx="82" cy="196" rx="60" ry="5" fill={`url(#${shadowId})`} />

      {/* Paper Block Behind Cover (visible on right and bottom) */}
      <rect
        x="22"
        y="10"
        width="130"
        height="183"
        rx="8"
        fill="#E9DFC4"
        stroke="rgba(0, 0, 0, 0.2)"
        strokeWidth="1"
      />
      {/* Paper edge page layers effect */}
      <line x1="149" y1="20" x2="149" y2="188" stroke="#D3C7A8" strokeWidth="1" />
      <line x1="151" y1="22" x2="151" y2="186" stroke="#BAAE8D" strokeWidth="1" />

      {/* Front Cover */}
      <rect
        x="16"
        y="6"
        width="132"
        height="184"
        rx="10"
        fill={`url(#${coverGradId})`}
        stroke="rgba(255, 255, 255, 0.18)"
        strokeWidth="1"
      />

      {/* Cover subtle top-left specular highlight */}
      <rect
        x="17"
        y="7"
        width="130"
        height="70"
        rx="9"
        fill={`url(#${sheenId})`}
      />

      {/* Elastic Band */}
      <rect
        x="118"
        y="6"
        width="8"
        height="184"
        fill="#B89B4A"
        opacity="0.9"
        rx="1"
      />
      <line x1="118" y1="6" x2="118" y2="190" stroke="#7A6329" strokeWidth="0.75" />
      <line x1="126" y1="6" x2="126" y2="190" stroke="#E2D19D" strokeWidth="0.75" opacity="0.6" />

      {/* White/Ivory Cover Label */}
      <rect
        x="46"
        y="52"
        width="60"
        height="56"
        rx="4"
        fill="#F6EFDD"
        stroke="rgba(0, 0, 0, 0.12)"
        strokeWidth="1"
      />

      {/* Label Content: ATHYKA Λ Chevron & Ruled Lines */}
      {/* Λ Chevron */}
      <path
        d="M71 68 L76 60 L81 68"
        stroke="#141414"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 1st Ruled Line (Shorter) */}
      <line
        x1="58"
        y1="78"
        x2="84"
        y2="78"
        stroke="#141414"
        strokeOpacity="0.55"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* 2nd Ruled Line */}
      <line
        x1="58"
        y1="88"
        x2="94"
        y2="88"
        stroke="#141414"
        strokeOpacity="0.55"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* 3rd Ruled Line */}
      <line
        x1="58"
        y1="98"
        x2="94"
        y2="98"
        stroke="#141414"
        strokeOpacity="0.55"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Coil Binding on Left Edge: 9 Rings with Punch Holes */}
      {coilYs.map((y, idx) => (
        <g key={idx}>
          {/* Dark Punch Hole */}
          <circle cx="28" cy={y + 3.5} r="2.5" fill="#0C0C0C" opacity="0.9" />
          {/* Ring Loop */}
          <rect
            x="3"
            y={y}
            width="26"
            height="7"
            rx="3.5"
            fill={`url(#${coilGradId})`}
            stroke="rgba(0, 0, 0, 0.25)"
            strokeWidth="0.75"
          />
          {/* Coil highlight glint */}
          <line
            x1="8"
            y1={y + 2}
            x2="22"
            y2={y + 2}
            stroke="#FFFBF0"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.6"
          />
        </g>
      ))}
    </svg>
  );
}
