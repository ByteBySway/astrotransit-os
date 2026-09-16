import React from 'react';

interface AstroTransitLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  strokeWidth?: number;
  planetColor?: string;
  lineColor?: string;
}

/**
 * AstroTransit OS Official Logo
 * Pure Mandel–Agol transit light curve baseline with centered laser-cyan occulting exoplanet.
 */
export const AstroTransitLogo: React.FC<AstroTransitLogoProps> = ({
  className = 'w-7 h-7',
  strokeWidth = 2.6,
  planetColor = '#38BDF8',
  lineColor = '#FFFFFF',
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="AstroTransit OS Transit Light Curve Logo"
      {...props}
    >
      {/* Symmetrical Mandel-Agol photometric transit baseline with smooth U-curve trough */}
      <path
        d="M 14 39 L 34 39 C 39.5 39 41.5 43 42.5 49 C 43.5 56 45.8 61.5 50 61.5 C 54.2 61.5 56.5 56 57.5 49 C 58.5 43 60.5 39 66 39 L 86 39"
        stroke={lineColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Laser-cyan occulting planet nestled within the transit minimum */}
      <circle cx="50" cy="55.5" r="2.9" fill={planetColor} />
    </svg>
  );
};

export default AstroTransitLogo;
