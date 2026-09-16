import React, { useState } from 'react';
import { TargetPlanet } from '../../types';
import { AudioEngine, HapticEngine } from '../../utils/feedbackEngine';
import { BrainCircuit, Activity, BarChart2, Eye, Sparkles, Sliders } from 'lucide-react';

interface XAILabProps {
  selectedTarget: TargetPlanet;
}

export const XAILab: React.FC<XAILabProps> = ({ selectedTarget }) => {
  const [selectedLayer, setSelectedLayer] = useState<'CONV1' | 'CONV2' | 'DENSE'>('CONV1');
  const [hoverUmapPoint, setHoverUmapPoint] = useState<{ id: string; disp: string; x: number; y: number } | null>(null);

  // Integrated Gradients attention data (safe fallback if not explicitly provided)
  const rawAttribution = selectedTarget?.xaiAttribution && selectedTarget.xaiAttribution.length > 0
    ? selectedTarget.xaiAttribution
    : [
        0.04, 0.06, 0.08, 0.12, 0.28, 0.65, 0.94, 0.88, 0.62, 0.55, 0.52, 0.54, 0.58, 0.64, 0.89, 0.97, 0.72, 0.38, 0.18, 0.09, 0.05, 0.03
      ];

  const attributionData = rawAttribution.map((val, i) => {
    const total = rawAttribution.length;
    const fraction = total > 1 ? i / (total - 1) : 0;
    const time = -0.15 + fraction * 0.3; // -0.15 to +0.15 days
    return { time, val };
  });

  // Simulated 2D UMAP Latent Space points
  const umapPoints = [
    // Confirmed Exoplanets cluster (top right)
    { id: 'Kepler-90i', disp: 'CONFIRMED', x: 210, y: 70 },
    { id: 'TOI-700d', disp: 'CONFIRMED', x: 225, y: 60 },
    { id: 'Kepler-186f', disp: 'CONFIRMED', x: 195, y: 80 },
    { id: 'TRAPPIST-1e', disp: 'CONFIRMED', x: 215, y: 95 },
    { id: 'KOI-7923.01', disp: 'CONFIRMED', x: 185, y: 65 },
    { id: 'KIC-11442793', disp: 'CONFIRMED CANDIDATE', x: 175, y: 90 },

    // Eclipsing Binaries / False Positives (bottom left)
    { id: 'KOI-123.01', disp: 'FALSE POSITIVE', x: 60, y: 190 },
    { id: 'KOI-204.01', disp: 'FALSE POSITIVE', x: 80, y: 210 },
    { id: 'KOI-305.02', disp: 'FALSE POSITIVE', x: 45, y: 175 },
    { id: 'KIC-445678', disp: 'FALSE POSITIVE', x: 70, y: 225 },

    // Stellar Noise / Marginal (middle left)
    { id: 'KIC-884920', disp: 'MARGINAL', x: 110, y: 130 },
    { id: 'TOI-1290.01', disp: 'MARGINAL', x: 130, y: 145 },
    { id: 'KOI-556.01', disp: 'MARGINAL', x: 120, y: 115 },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* Top Banner matching screenshot 2 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-prata text-2xl sm:text-3xl tracking-wide text-slate-100 flex items-center gap-2">
            <span>Explainable AI (XAI) Interpretability Lab</span>
          </h1>
          <div className="text-xs font-mono-code text-slate-400 mt-1 uppercase tracking-wider">
            Model: <strong className="text-cyan-400">ResNet-1D / TransitNet-v4</strong> · Target: <strong className="text-slate-200">{selectedTarget.id} ({selectedTarget.name})</strong>
          </div>
        </div>

        {/* 3 Top Metrics matching screenshot 2 */}
        <div className="flex flex-wrap items-center gap-3 font-mono-code text-xs">
          <div className="rounded-sm cosmic-glass px-3.5 py-2 border border-white/[0.08]">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Symmetry Index</span>
            <span className="text-cyan-400 font-bold text-sm tabular-nums">0.984 ↑</span>
          </div>

          <div className="rounded-sm cosmic-glass px-3.5 py-2 border border-white/[0.08]">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Importance Peak</span>
            <span className="text-slate-200 font-bold text-sm tabular-nums">T-04:22:11</span>
          </div>

          <div className="rounded-sm cosmic-glass px-3.5 py-2 border border-white/[0.08]">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Uncertainty</span>
            <span className="text-cyan-300 font-bold text-sm tabular-nums">±0.018</span>
          </div>
        </div>
      </div>

      {/* Main Integrated Gradients Attention Plot matching screenshot 2 */}
      <div className="rounded-sm cosmic-glass p-4 border border-white/[0.08] shadow-xl">
        <div className="flex flex-wrap items-center justify-between pb-3 mb-2 border-b border-white/[0.08] text-xs font-mono-code">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span className="font-semibold text-slate-200 uppercase tracking-wider">Integrated Gradients Feature Attribution</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[10px] uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-sm bg-cyan-400" /> Ingress / Egress Attention
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-sm bg-teal-400" /> Flat-Bottom Transit Core
            </span>
          </div>
        </div>

        {/* Integrated Gradients SVG Bar / Area Visualizer */}
        <div className="h-56 w-full mt-2">
          <svg viewBox="0 0 700 200" className="w-full h-full select-none">
            <defs>
              <linearGradient id="attrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Grid */}
            <g className="opacity-15 stroke-cyan-500" strokeDasharray="3 3">
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <line key={`gh-${i}`} x1="50" y1={20 + pct * 140} x2="670" y2={20 + pct * 140} />
              ))}
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((pct, i) => (
                <line key={`gv-${i}`} x1="50 + pct * 620" y1="20" x2={50 + pct * 620} y2="160" />
              ))}
            </g>

            {/* Zero line */}
            <line x1="50" y1="160" x2="670" y2="160" stroke="#475569" strokeWidth="1" />

            {/* Area Path */}
            <path
              d={`M 50,160 ${attributionData
                .map((d, i) => {
                  const x = 50 + (i / (attributionData.length - 1)) * 620;
                  const y = 160 - d.val * 135;
                  return `L ${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(' ')} L 670,160 Z`}
              fill="url(#attrGradient)"
            />

            {/* Stroke Line */}
            <polyline
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.8"
              points={attributionData
                .map((d, i) => {
                  const x = 50 + (i / (attributionData.length - 1)) * 620;
                  const y = 160 - d.val * 135;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(' ')}
            />

            {/* Ingress Annotation Marker */}
            <line x1="260" y1="25" x2="260" y2="160" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
            <text x="260" y="20" textAnchor="middle" className="font-mono-code text-[9px] fill-cyan-300 font-bold uppercase tracking-wider">
              INGRESS GRADIENT PEAK
            </text>

            {/* Egress Annotation Marker */}
            <line x1="460" y1="25" x2="460" y2="160" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
            <text x="460" y="20" textAnchor="middle" className="font-mono-code text-[9px] fill-cyan-300 font-bold uppercase tracking-wider">
              EGRESS GRADIENT PEAK
            </text>

            {/* X-Axis labels */}
            <text x="50" y="180" className="font-mono-code text-[9px] fill-slate-400 tabular-nums uppercase tracking-wider" textAnchor="middle">-0.15 d</text>
            <text x="360" y="180" className="font-mono-code text-[9px] fill-slate-400 uppercase tracking-wider" textAnchor="middle">Transit Center (0.00 d)</text>
            <text x="670" y="180" className="font-mono-code text-[9px] fill-slate-400 tabular-nums uppercase tracking-wider" textAnchor="middle">+0.15 d</text>

            {/* Y-Axis title */}
            <text
              x="20"
              y="90"
              textAnchor="middle"
              transform="rotate(-90 20 90)"
              className="font-mono-code text-[9px] fill-slate-400 font-bold uppercase tracking-wider"
            >
              Attribution Weight
            </text>
          </svg>
        </div>
      </div>

      {/* Lower Row: 2D UMAP Latent Space & Layer Activations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. 2D UMAP Latent Space Embeddings */}
        <div className="rounded-sm cosmic-glass p-4 border border-white/[0.08] shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] text-xs font-mono-code">
              <span className="text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-semibold text-[11px]">
                <BrainCircuit className="h-3.5 w-3.5 text-cyan-400" />
                2D UMAP Latent Space Embedding
              </span>
              <span className="text-[10px] font-mono-code text-cyan-400 uppercase tracking-wider">Bottleneck: 64-dim</span>
            </div>

            {/* 2D UMAP Scatter Plot */}
            <div className="relative my-3 h-52 w-full">
              <svg viewBox="0 0 280 260" className="w-full h-full select-none">
                {/* Cluster regions shaded */}
                <ellipse cx="205" cy="75" rx="55" ry="40" fill="rgba(56, 189, 248, 0.05)" stroke="rgba(56, 189, 248, 0.25)" strokeDasharray="3 3" />
                <text x="205" y="30" textAnchor="middle" className="font-mono-code text-[8px] fill-cyan-400 font-bold uppercase tracking-wider">
                  PLANET CANDIDATES
                </text>

                <ellipse cx="65" cy="195" rx="45" ry="35" fill="rgba(244, 63, 94, 0.05)" stroke="rgba(244, 63, 94, 0.25)" strokeDasharray="3 3" />
                <text x="65" y="245" textAnchor="middle" className="font-mono-code text-[8px] fill-rose-400 font-bold uppercase tracking-wider">
                  ECLIPSING BINARIES
                </text>

                {/* Points */}
                {umapPoints.map((pt) => {
                  const isCurrent = pt.id === selectedTarget.id;
                  const isCandidate = pt.disp.includes('CONFIRMED');

                  return (
                    <g
                      key={pt.id}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoverUmapPoint(pt)}
                      onMouseLeave={() => setHoverUmapPoint(null)}
                    >
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isCurrent ? 5 : 3.5}
                        fill={isCandidate ? '#38bdf8' : pt.disp === 'MARGINAL' ? '#f59e0b' : '#f43f5e'}
                        stroke={isCurrent ? '#ffffff' : 'none'}
                        strokeWidth={1.5}
                      />
                      {isCurrent && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={9}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Hover details badge */}
              {hoverUmapPoint && (
                <div className="absolute top-2 left-2 rounded-sm border border-cyan-500/40 bg-[#060a14]/95 p-2 font-mono-code text-[10px] text-cyan-300 backdrop-blur-md">
                  <div>Target: <strong className="text-white">{hoverUmapPoint.id}</strong></div>
                  <div>Cluster: <strong className="text-cyan-400">{hoverUmapPoint.disp}</strong></div>
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] font-mono-code text-slate-400 pt-2 border-t border-white/[0.08] flex justify-between uppercase tracking-wider">
            <span>Projection: <strong className="text-cyan-400">Cosine Metric</strong></span>
            <span>Current: <strong className="text-slate-200">{selectedTarget.id}</strong></span>
          </div>
        </div>

        {/* 2. Convolutional Filter Activations */}
        <div className="rounded-sm cosmic-glass p-4 border border-white/[0.08] shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] text-xs font-mono-code">
              <span className="text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-semibold text-[11px]">
                <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                Layer Activations
              </span>
              <div className="flex items-center gap-1">
                {(['CONV1', 'CONV2', 'DENSE'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      AudioEngine.playClick();
                      HapticEngine.selectionTick();
                      setSelectedLayer(l);
                    }}
                    className={`px-2 py-0.5 rounded-sm text-[10px] font-mono-code uppercase tracking-wider font-bold cursor-pointer transition-colors ${
                      selectedLayer === l
                        ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Activations List */}
            <div className="my-3 space-y-3 font-mono-code text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1 text-[11px] uppercase tracking-wider">
                  <span>Filter #04: Ingress Slope Detector</span>
                  <span className="text-cyan-400 font-bold tabular-nums">0.942</span>
                </div>
                <div className="h-1.5 w-full rounded-none bg-slate-800/80 overflow-hidden">
                  <div className="h-full bg-cyan-400" style={{ width: '94.2%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1 text-[11px] uppercase tracking-wider">
                  <span>Filter #12: Flat-Bottom Limb Darkening</span>
                  <span className="text-cyan-400 font-bold tabular-nums">0.887</span>
                </div>
                <div className="h-1.5 w-full rounded-none bg-slate-800/80 overflow-hidden">
                  <div className="h-full bg-teal-400" style={{ width: '88.7%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1 text-[11px] uppercase tracking-wider">
                  <span>Filter #19: V-Shape EB Rejection</span>
                  <span className="text-slate-400 font-bold tabular-nums">0.034</span>
                </div>
                <div className="h-1.5 w-full rounded-none bg-slate-800/80 overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: '3.4%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1 text-[11px] uppercase tracking-wider">
                  <span>Filter #27: Stellar Flare Suppressor</span>
                  <span className="text-cyan-400 font-bold tabular-nums">0.761</span>
                </div>
                <div className="h-1.5 w-full rounded-none bg-slate-800/80 overflow-hidden">
                  <div className="h-full bg-sky-400" style={{ width: '76.1%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono-code text-slate-400 pt-2 border-t border-white/[0.08] flex justify-between uppercase tracking-wider">
            <span>Model Weights: <strong className="text-emerald-400">Calibrated</strong></span>
            <span>Kernel Size: <strong className="text-slate-200">5x1 1D-Conv</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
