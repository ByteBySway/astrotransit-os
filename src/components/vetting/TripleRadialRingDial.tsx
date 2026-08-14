import React from 'react';
import { TargetPlanet, DispositionType } from '../../types';
import { ShieldCheck, Cpu, CheckCircle2, AlertTriangle, XCircle, Sparkles } from 'lucide-react';

interface TripleRadialRingDialProps {
  target: TargetPlanet;
  confidence: number;
  oddEvenRatio: number;
  centroidOffset: number;
  disposition: DispositionType;
  onOpenSchema?: () => void;
}

export const TripleRadialRingDial: React.FC<TripleRadialRingDialProps> = ({
  target,
  confidence,
  oddEvenRatio,
  centroidOffset,
  disposition,
  onOpenSchema,
}) => {
  // 1. Outer Ring: ML Transit Confidence (0.0 to 1.0)
  const outerPct = Math.min(1, Math.max(0, confidence));

  // 2. Middle Ring: Odd/Even Transit Depth Symmetry (Ideal ratio = 1.0, deviation reduces %)
  const oddEvenDev = Math.abs(oddEvenRatio - 1.0);
  const middlePct = Math.max(0, Math.min(1, 1 - oddEvenDev * 4));

  // 3. Inner Ring: Centroid Astrometric Stability (Ideal offset = 0.0", >0.25" is threshold)
  const innerPct = Math.max(0, Math.min(1, 1 - (centroidOffset / 0.35)));

  // SVG Geometry Dimensions
  const size = 180;
  const center = size / 2;

  // Ring Radii
  const rOuter = 76;
  const rMiddle = 62;
  const rInner = 48;
  const strokeWidth = 7;

  const getCircumference = (r: number) => 2 * Math.PI * r;
  const cOuter = getCircumference(rOuter);
  const cMiddle = getCircumference(rMiddle);
  const cInner = getCircumference(rInner);

  const offsetOuter = cOuter * (1 - outerPct);
  const offsetMiddle = cMiddle * (1 - middlePct);
  const offsetInner = cInner * (1 - innerPct);

  // Status tag styling
  const isConfirmed = disposition === 'CONFIRMED' || disposition === 'CONFIRMED CANDIDATE';
  const isCandidate = disposition === 'CANDIDATE' || disposition === 'MARGINAL CANDIDATE';

  return (
    <div className="flex flex-col items-center">
      {/* Concentric 3-Ring SVG Dial */}
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <defs>
            {/* Outer Ring Gradient (Emerald) */}
            <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>

            {/* Middle Ring Gradient (Electric Cyan) */}
            <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>

            {/* Inner Ring Gradient (Violet) */}
            <linearGradient id="violetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>

            {/* Subtle glow filter */}
            <filter id="dialGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Track Backgrounds */}
          <circle cx={center} cy={center} r={rOuter} className="stroke-slate-800/60" strokeWidth={strokeWidth} fill="transparent" />
          <circle cx={center} cy={center} r={rMiddle} className="stroke-slate-800/60" strokeWidth={strokeWidth} fill="transparent" />
          <circle cx={center} cy={center} r={rInner} className="stroke-slate-800/60" strokeWidth={strokeWidth} fill="transparent" />

          {/* 2. Outer Ring: ML Transit Confidence */}
          <circle
            cx={center}
            cy={center}
            r={rOuter}
            stroke="url(#emeraldGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={cOuter}
            strokeDashoffset={offsetOuter}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
            filter="url(#dialGlow)"
          />

          {/* 3. Middle Ring: Odd/Even Symmetry */}
          <circle
            cx={center}
            cy={center}
            r={rMiddle}
            stroke="url(#cyanGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={cMiddle}
            strokeDashoffset={offsetMiddle}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />

          {/* 4. Inner Ring: Centroid Astrometry */}
          <circle
            cx={center}
            cy={center}
            r={rInner}
            stroke="url(#violetGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={cInner}
            strokeDashoffset={offsetInner}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Dial Center Status Hub */}
        <div className="absolute flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="font-display text-2xl font-black text-white glow-cyan tracking-tight">
            {(confidence * 100).toFixed(1)}%
          </span>
          <span className="text-[9px] font-mono-code text-cyan-300 uppercase tracking-wider font-bold">
            VET SCORE
          </span>
        </div>
      </div>

      {/* Ring Legends & Status Badges */}
      <div className="w-full mt-3 space-y-1.5 font-mono-code text-[11px]">
        {/* Outer Ring Legend */}
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#060c18] border border-emerald-500/20">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <span className="text-slate-300">Outer Ring: ML Transit Match</span>
          </div>
          <strong className="text-emerald-400 font-bold">{(outerPct * 100).toFixed(1)}%</strong>
        </div>

        {/* Middle Ring Legend */}
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#060c18] border border-cyan-500/20">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/50" />
            <span className="text-slate-300">Middle Ring: Odd/Even Symmetry</span>
          </div>
          <strong className="text-cyan-300 font-bold">{(middlePct * 100).toFixed(1)}%</strong>
        </div>

        {/* Inner Ring Legend */}
        <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#060c18] border border-purple-500/20">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-400 shadow-sm shadow-purple-400/50" />
            <span className="text-slate-300">Inner Ring: Centroid Stability</span>
          </div>
          <strong className="text-purple-300 font-bold">{(innerPct * 100).toFixed(1)}%</strong>
        </div>
      </div>

      {/* Primary Disposition Badge */}
      <div className="mt-3 flex items-center justify-center">
        <span
          className={`inline-flex items-center gap-1.5 font-mono-code text-xs font-bold px-3.5 py-1 rounded-full border uppercase tracking-wider ${
            isConfirmed
              ? 'border-emerald-500/50 bg-emerald-950/70 text-emerald-300 shadow-sm shadow-emerald-900/40'
              : isCandidate
              ? 'border-cyan-500/50 bg-cyan-950/70 text-cyan-300 shadow-sm shadow-cyan-900/40'
              : 'border-rose-500/50 bg-rose-950/70 text-rose-300 shadow-sm shadow-rose-900/40'
          }`}
        >
          {isConfirmed ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          ) : isCandidate ? (
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-rose-400" />
          )}
          {disposition}
        </span>
      </div>
    </div>
  );
};
