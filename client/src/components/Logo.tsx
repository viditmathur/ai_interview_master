// client/src/components/Logo.tsx
import React from 'react';
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="fr-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1"/>
          <stop offset="1" stopColor="#A21CAF"/>
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#fr-gradient)" stroke="#fff" strokeWidth="2"/>
      <text x="50%" y="58%" textAnchor="middle" fontWeight="bold" fontSize="20" fill="#fff" fontFamily="Inter, sans-serif" letterSpacing="2" dominantBaseline="middle">
        FR
      </text>
      <path d="M36 16 Q38 24 24 36 Q10 24 12 16" stroke="#fff" strokeWidth="2" fill="none" opacity="0.3"/>
    </svg>
  );
} 