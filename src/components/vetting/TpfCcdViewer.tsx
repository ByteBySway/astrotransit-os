import React from 'react';
import { TargetPlanet } from '../../types';
import { Grid, AlertTriangle, CheckCircle } from 'lucide-react';

interface TpfCcdViewerProps {
  target: TargetPlanet;
}

export const TpfCcdViewer: React.FC<TpfCcdViewerProps> = ({ target }) => {
  const matrix = target.tpfMatrix;
  const centroid = target.centroidCoord;
  const isAlert = target.centroidOffset > 0.10;

  // Find min and max in matrix for colormap
  let min = Infinity;
  let max = -Infinity;
  matrix.forEach((row) => {
    row.forEach((v) => {
      if (v < min) min = v;
      if (v > max) max = v;
    });
  });

  const getColor = (val: number) => {
    const norm = (val - min) / (max - min || 1);
    // Cyan - Deep Navy to Bright Turquoise
    if (norm < 0.25) return `rgba(15, 23, 42, 0.9)`;
    if (norm < 0.5) return `rgba(8, 76, 97, ${0.4 + norm})`;
    if (norm < 0.75) return `rgba(0, 180, 216, ${0.6 + norm * 0.4})`;
    return `rgba(0, 240, 255, ${0.85 + norm * 0.15})`;
  };

  return (
    <div className="relative rounded-2xl cosmic-glass p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-1.5 text-xs font-mono-code text-cyan-400 font-semibold">
          <Grid className="h-3.5 w-3.5" />
          <span>TPF 5x5 CCD</span>
        </div>
        <div
          className={`flex items-center gap-1 text-[10px] font-mono-code px-2 py-0.5 rounded-full border ${
            isAlert
              ? 'border-amber-500/50 bg-amber-950/30 text-amber-300'
              : 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300'
          }`}
        >
          {isAlert ? <AlertTriangle className="h-3 w-3 text-amber-400" /> : <CheckCircle className="h-3 w-3 text-emerald-400" />}
          <span>Δ Centroid: {target.centroidOffset.toFixed(2)}px</span>
        </div>
      </div>

      {/* 5x5 Grid Container */}
      <div className="my-auto py-2 flex items-center justify-center">
        <div className="relative grid grid-cols-5 gap-1 p-2 rounded-xl border border-white/10 bg-[#060b16]/80 backdrop-blur-md">
          {matrix.map((row, y) =>
            row.map((val, x) => (
              <div
                key={`${x}-${y}`}
                className="relative h-7 w-7 sm:h-8 sm:w-8 rounded-sm transition-all duration-300 flex items-center justify-center text-[8px] font-mono-code text-cyan-200/50"
                style={{
                  backgroundColor: getColor(val),
                  boxShadow: val > max * 0.8 ? '0 0 10px rgba(0, 240, 255, 0.4)' : 'none',
                }}
              >
                {/* Center target indicator */}
                {x === 2 && y === 2 && (
                  <div className="h-2 w-2 rounded-full bg-white shadow-md animate-pulse" />
                )}
              </div>
            ))
          )}

          {/* Sub-pixel Centroid Offset Indicator Point */}
          <div
            className="absolute h-3 w-3 rounded-full border border-rose-400 bg-rose-500/80 shadow-md transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-500"
            style={{
              left: `${((2.5 + centroid.x) / 5) * 100}%`,
              top: `${((2.5 + centroid.y) / 5) * 100}%`,
            }}
            title={`Centroid position: Δx=${centroid.x.toFixed(2)}, Δy=${centroid.y.toFixed(2)}`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] font-mono-code text-slate-400 pt-2 border-t border-white/[0.08]">
        <span>Pixel Scale: 3.98&quot; / px</span>
        <span className={isAlert ? 'text-amber-400' : 'text-emerald-400'}>
          {isAlert ? 'Marginal blend risk' : 'Direct host centering'}
        </span>
      </div>
    </div>
  );
};
