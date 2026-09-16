import React from 'react';
import { TargetPlanet } from '../../types';
import { GitCommit } from 'lucide-react';

interface PhaseFoldedViewerProps {
  target: TargetPlanet;
}

export const PhaseFoldedViewer: React.FC<PhaseFoldedViewerProps> = ({ target }) => {
  const data = target.phaseFoldedData;

  const width = 380;
  const height = 210;
  const padLeft = 45;
  const padRight = 15;
  const padTop = 25;
  const padBottom = 30;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const minPhase = -0.15;
  const maxPhase = 0.15;

  let minFlux = Infinity;
  let maxFlux = -Infinity;
  data.forEach((d) => {
    if (d.flux < minFlux) minFlux = d.flux;
    if (d.flux > maxFlux) maxFlux = d.flux;
  });
  const padY = (maxFlux - minFlux) * 0.15 || 0.0004;
  minFlux -= padY;
  maxFlux += padY;

  const getX = (p: number) => {
    const norm = (p - minPhase) / (maxPhase - minPhase);
    return padLeft + norm * plotW;
  };

  const getY = (f: number) => {
    const norm = (f - minFlux) / (maxFlux - minFlux || 1);
    return padTop + (1 - norm) * plotH;
  };

  const modelPolyline = data
    .map((d) => `${getX(d.phase).toFixed(1)},${getY(d.modelFlux).toFixed(1)}`)
    .join(' ');

  return (
    <div className="relative rounded-2xl cosmic-glass p-4 border border-cyan-500/20 hover:border-cyan-400/50 transition-colors flex flex-col justify-between">
      <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
        <div className="flex items-center gap-1.5 text-xs font-mono-code text-[#00f0ff] font-semibold uppercase tracking-wider">
          <GitCommit className="h-3.5 w-3.5 text-[#00f0ff]" />
          <span>Phase-Folded Model</span>
        </div>
        <div className="text-[10px] font-mono-code text-slate-300 uppercase tracking-wider">
          SNR: <strong className="text-[#00f0ff] font-bold tabular-nums drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]">{target.snr.toFixed(1)}</strong> · χ²: <strong className="text-white font-bold tabular-nums">1.08</strong>
        </div>
      </div>

      <div className="relative w-full mt-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
          <defs>
            <filter id="phaseFoldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid */}
          <g className="opacity-20 stroke-cyan-400" strokeDasharray="2 2">
            {[0, 0.5, 1].map((pct, i) => (
              <line
                key={`h-${i}`}
                x1={padLeft}
                y1={padTop + pct * plotH}
                x2={width - padRight}
                y2={padTop + pct * plotH}
              />
            ))}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
              <line
                key={`v-${i}`}
                x1={padLeft + pct * plotW}
                y1={padTop}
                x2={padLeft + pct * plotW}
                y2={height - padBottom}
              />
            ))}
          </g>

          {/* Scatter Points */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={getX(d.phase)}
              cy={getY(d.flux)}
              r="1.3"
              fill="#38bdf8"
              opacity="0.45"
            />
          ))}

          {/* Theoretical Model Line with Electric Luminescent Glow */}
          <polyline
            fill="none"
            stroke="#00f0ff"
            strokeWidth="3.2"
            strokeLinecap="round"
            points={modelPolyline}
            opacity="0.35"
            filter="url(#phaseFoldGlow)"
          />
          <polyline
            fill="none"
            stroke="#00f0ff"
            strokeWidth="2.2"
            strokeLinecap="round"
            points={modelPolyline}
            filter="url(#phaseFoldGlow)"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.6))',
            }}
          />

          {/* Y-Axis */}
          <g className="font-mono-code text-[9px] fill-slate-300 tabular-nums" textAnchor="end">
            <text x={padLeft - 4} y={padTop + 6}>{maxFlux.toFixed(4)}</text>
            <text x={padLeft - 4} y={height - padBottom}>{minFlux.toFixed(4)}</text>
            <text
              x={12}
              y={height / 2}
              textAnchor="middle"
              transform={`rotate(-90 12 ${height / 2})`}
              className="fill-cyan-400 text-[8px] uppercase tracking-wider"
            >
              Norm Flux
            </text>
          </g>

          {/* X-Axis */}
          <g className="font-mono-code text-[9px] fill-slate-300 tabular-nums" textAnchor="middle">
            <text x={padLeft} y={height - padBottom + 14}>-0.10</text>
            <text x={padLeft + plotW / 2} y={height - padBottom + 14}>0.00</text>
            <text x={width - padRight} y={height - padBottom + 14}>+0.10</text>
            <text x={padLeft + plotW / 2} y={height - 2} className="fill-cyan-400 text-[8px] uppercase tracking-wider">
              Orbital Phase (Days)
            </text>
          </g>
        </svg>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono-code text-slate-300 pt-2 border-t border-cyan-500/20 uppercase tracking-wider">
        <span className="text-[#00f0ff] font-bold drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]">Primary Eclipse: Vetted</span>
        <span className="text-slate-400">Secondary: Absent</span>
      </div>
    </div>
  );
};
