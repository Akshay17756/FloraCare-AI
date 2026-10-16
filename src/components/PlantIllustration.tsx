import React from 'react';

interface PlantIllustrationProps {
  type: string;
  className?: string;
}

export const PlantIllustration: React.FC<PlantIllustrationProps> = ({ type, className = 'w-16 h-16' }) => {
  const norm = type.toLowerCase();

  if (norm.includes('monstera') || norm.includes('deliciosa')) {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Monstera leaf illustration">
        <rect width="100" height="100" rx="16" fill="#ECFDF5" />
        <path d="M50 85 C50 60 50 35 50 18" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
        {/* Left Leaf Body with Fenestrations */}
        <path
          d="M50 20 C32 24 20 40 22 62 C23 74 34 80 50 82 C50 82 45 74 38 68 C34 64 36 58 42 60 C48 62 50 54 44 48 C38 42 42 36 48 38 C50 38 50 20 50 20 Z"
          fill="#10B981"
          opacity="0.9"
        />
        {/* Right Leaf Body */}
        <path
          d="M50 20 C68 24 80 40 78 62 C77 74 66 80 50 82 C50 82 55 74 62 68 C66 64 64 58 58 60 C52 62 50 54 56 48 C62 42 58 36 52 38 C50 38 50 20 50 20 Z"
          fill="#059669"
        />
        {/* Leaf Fenestrations (Holes) */}
        <ellipse cx="38" cy="44" rx="3.5" ry="7" transform="rotate(-25 38 44)" fill="#ECFDF5" />
        <ellipse cx="62" cy="44" rx="3.5" ry="7" transform="rotate(25 62 44)" fill="#ECFDF5" />
        <ellipse cx="36" cy="58" rx="3" ry="5.5" transform="rotate(-30 36 58)" fill="#ECFDF5" />
        <ellipse cx="64" cy="58" rx="3" ry="5.5" transform="rotate(30 64 58)" fill="#ECFDF5" />
      </svg>
    );
  }

  if (norm.includes('fiddle') || norm.includes('lyrata') || norm.includes('ficus')) {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Fiddle Leaf Fig illustration">
        <rect width="100" height="100" rx="16" fill="#F0FDF4" />
        <path d="M50 88 L50 20" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
        {/* Lyre-shaped violin leaf */}
        <path
          d="M50 20 C62 20 72 30 68 46 C64 58 74 68 70 82 C64 88 56 88 50 88 C44 88 36 88 30 82 C26 68 36 58 32 46 C28 30 38 20 50 20 Z"
          fill="#16A34A"
        />
        {/* Veins */}
        <path d="M50 35 L62 28 M50 48 L64 42 M50 62 L66 58 M50 72 L62 70" stroke="#86EFAC" strokeWidth="2" strokeLinecap="round" />
        <path d="M50 35 L38 28 M50 48 L36 42 M50 62 L34 58 M50 72 L38 70" stroke="#86EFAC" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (norm.includes('snake') || norm.includes('sansevieria') || norm.includes('trifasciata')) {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Snake Plant illustration">
        <rect width="100" height="100" rx="16" fill="#F7FEE7" />
        {/* Center tall blade */}
        <path d="M50 14 C56 40 58 68 54 88 L46 88 C42 68 44 40 50 14 Z" fill="#4D7C0F" stroke="#FDE047" strokeWidth="1.5" />
        {/* Left blade */}
        <path d="M34 26 C42 46 42 70 38 88 L32 88 C28 70 28 46 34 26 Z" fill="#65A30D" stroke="#FDE047" strokeWidth="1.5" />
        {/* Right blade */}
        <path d="M66 26 C72 46 72 70 68 88 L62 88 C58 70 58 46 66 26 Z" fill="#65A30D" stroke="#FDE047" strokeWidth="1.5" />
        {/* Stripes */}
        <path d="M46 35 H54 M45 50 H55 M44 65 H56 M47 78 H53" stroke="#365314" strokeWidth="1.5" strokeLinecap="round" />
        {/* Pot */}
        <path d="M26 86 L74 86 L68 96 L32 96 Z" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
      </svg>
    );
  }

  if (norm.includes('basil') || norm.includes('herb') || norm.includes('ocimum')) {
    return (
      <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Herb Basil illustration">
        <rect width="100" height="100" rx="16" fill="#F0FDF4" />
        <path d="M50 88 C50 60 50 40 50 28" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" />
        {/* Top pair */}
        <ellipse cx="44" cy="24" rx="8" ry="12" transform="rotate(-35 44 24)" fill="#22C55E" />
        <ellipse cx="56" cy="24" rx="8" ry="12" transform="rotate(35 56 24)" fill="#16A34A" />
        {/* Middle pair */}
        <ellipse cx="36" cy="45" rx="10" ry="15" transform="rotate(-50 36 45)" fill="#22C55E" />
        <ellipse cx="64" cy="45" rx="10" ry="15" transform="rotate(50 64 45)" fill="#15803D" />
        {/* Lower pair */}
        <ellipse cx="30" cy="68" rx="11" ry="17" transform="rotate(-65 30 68)" fill="#16A34A" />
        <ellipse cx="70" cy="68" rx="11" ry="17" transform="rotate(65 70 68)" fill="#166534" />
      </svg>
    );
  }

  // Default elegant tropical leaf
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Plant icon">
      <rect width="100" height="100" rx="16" fill="#ECFDF5" />
      <path d="M50 86 C50 60 50 36 50 20" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M50 20 C65 32 75 50 70 70 C60 84 50 86 50 86 C50 86 40 84 30 70 C25 50 35 32 50 20 Z"
        fill="#10B981"
      />
      <path d="M50 35 L62 44 M50 50 L64 60 M50 65 L60 72" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M50 35 L38 44 M50 50 L36 60 M50 65 L40 72" stroke="#A7F3D0" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};
