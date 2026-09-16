import React from 'react';

interface MissionBadgeProps {
  className?: string;
  size?: number;
}

/**
 * Aerospace Mission Badge (Monogram 76106)
 * A 36px x 36px circular dark glass badge (bg-cyan-950/40 border border-cyan-400/40 shadow-[0_0_15px_rgba(56,189,248,0.25)])
 * featuring an upward chevron 'A' merged with a central 'T' crossbar and a vivid electric cyan orbital chord tick.
 */
export const MissionBadge: React.FC<MissionBadgeProps> = ({
  className = '',
  size = 36,
}) => {
  return (
    <div
      id="aerospace-mission-badge"
      className={`relative rounded-full flex items-center justify-center shrink-0 bg-cyan-950/40 border border-cyan-400/40 shadow-[0_0_15px_rgba(56,189,248,0.25)] backdrop-blur-md overflow-hidden transition-all duration-300 group hover:border-cyan-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.45)] ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      role="img"
      aria-label="AstroTransit Aerospace Mission Emblem"
    >
      {/* Subtle radial inner glow */}
      <div 
        className="absolute inset-0 pointer-events-none rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 30%, rgba(0, 240, 255, 0.22) 0%, rgba(4, 9, 20, 0.6) 75%)',
        }}
      />

      {/* Razor-sharp Vector Monogram 76106 */}
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 p-1 select-none"
      >
        <defs>
          <filter id="badgeNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="chevronGrad" x1="18" y1="7" x2="18" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
          <linearGradient id="orbitalTickGrad" x1="6" y1="21" x2="30" y2="15" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.2" />
            <stop offset="60%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
        </defs>

        {/* Outer reticle tick ring */}
        <circle
          cx="18"
          cy="18"
          r="16"
          stroke="#00f0ff"
          strokeWidth="0.8"
          strokeDasharray="2 4"
          opacity="0.35"
        />

        {/* Upward Chevron 'A' Monogram: Peak at (18, 8.5), Left Foot (9.5, 27), Right Foot (26.5, 27) */}
        <path
          d="M 10 26.5 L 18 8.5 L 26 26.5"
          stroke="url(#chevronGrad)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Central 'T' Stem descending from apex down through center: (18, 8.5) to (18, 26) */}
        <line
          x1="18"
          y1="8.5"
          x2="18"
          y2="25"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Central 'T' Crossbar: Horizontally spanning (12.5, 18) to (23.5, 18) */}
        <line
          x1="12"
          y1="18"
          x2="24"
          y2="18"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Vivid Electric Cyan Orbital Chord Tick cutting dynamically across the chevron */}
        <path
          d="M 7.5 22.5 C 13.5 19 22.5 16.5 28.5 13.5"
          stroke="url(#orbitalTickGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#badgeNeonGlow)"
        />

        {/* Electric Cyan Occulting Celestial Beacon / Orbital Tick Focal Point */}
        <circle
          cx="24.5"
          cy="15.2"
          r="1.7"
          fill="#00F0FF"
          filter="url(#badgeNeonGlow)"
          className="animate-pulse"
        />
      </svg>
    </div>
  );
};
