import React from 'react';

interface HudCornerBracketsProps {
  watermark?: string;
  borderColor?: string;
  className?: string;
}

export const HudCornerBrackets: React.FC<HudCornerBracketsProps> = ({
  watermark = 'EPOCH: J2026.5 // NASA-AMES // CALIBRATED',
  borderColor = '#00f0ff',
  className = '',
}) => {
  return (
    <>
      {/* Top-Left Corner Bracket (2px micro-thin accent) */}
      <span
        className="hud-corner-bracket hud-corner-tl"
        style={{ borderTopColor: borderColor, borderLeftColor: borderColor }}
      />
      {/* Top-Right Corner Bracket */}
      <span
        className="hud-corner-bracket hud-corner-tr"
        style={{ borderTopColor: borderColor, borderRightColor: borderColor }}
      />
      {/* Bottom-Left Corner Bracket */}
      <span
        className="hud-corner-bracket hud-corner-bl"
        style={{ borderBottomColor: borderColor, borderLeftColor: borderColor }}
      />
      {/* Bottom-Right Corner Bracket */}
      <span
        className="hud-corner-bracket hud-corner-br"
        style={{ borderBottomColor: borderColor, borderRightColor: borderColor }}
      />

      {/* Optical Instrument Coordinate Readout Watermark */}
      {watermark && (
        <span
          className={`absolute bottom-1 right-2 font-mono-code text-[8px] tracking-wider pointer-events-none select-none z-10 text-[rgba(121,220,232,0.45)] uppercase ${className}`}
        >
          {watermark}
        </span>
      )}
    </>
  );
};
