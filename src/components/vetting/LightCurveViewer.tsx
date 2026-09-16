import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TargetPlanet } from '../../types';
import { Activity, ZoomIn, ZoomOut, RotateCcw, Crosshair, HelpCircle, Sparkles, Sliders } from 'lucide-react';
import { AudioEngine, HapticEngine } from '../../utils/feedbackEngine';
import { HudCornerBrackets } from '../common/HudCornerBrackets';

interface LightCurveViewerProps {
  target: TargetPlanet;
}

export const LightCurveViewer: React.FC<LightCurveViewerProps> = ({ target }) => {
  const [activeMode, setActiveMode] = useState<'RAW' | 'DETRENDED' | 'RESIDUALS'>('DETRENDED');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showErrorBars, setShowErrorBars] = useState<boolean>(true);
  const [showTransitPhases, setShowTransitPhases] = useState<boolean>(true);
  
  // Interactive Zoom & Pan State
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<number>(0);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastHapticIdxRef = useRef<number | null>(null);
  const lastSnapRegionRef = useRef<string | null>(null);
  const data = target.lightCurve;

  // Reset zoom & pan when target changes
  useEffect(() => {
    setZoomScale(1.0);
    setPanOffset(0);
    setHoverIndex(null);
  }, [target.id]);

  const { minFlux, maxFlux, minTime, maxTime, timeSpan } = useMemo(() => {
    let minF = Infinity;
    let maxF = -Infinity;
    data.forEach((d) => {
      const val =
        activeMode === 'RAW'
          ? d.rawFlux
          : activeMode === 'DETRENDED'
          ? d.detrendedFlux
          : d.residual;
      if (val < minF) minF = val;
      if (val > maxF) maxF = val;
    });

    const tMin = data[0]?.time || 0;
    const tMax = data[data.length - 1]?.time || 4;
    const tSpan = tMax - tMin || 1;

    const pad = (maxF - minF) * 0.15 || 0.0005;
    return {
      minFlux: minF - pad,
      maxFlux: maxF + pad,
      minTime: tMin,
      maxTime: tMax,
      timeSpan: tSpan,
    };
  }, [data, activeMode]);

  // Coordinate space bounds
  const width = 840;
  const height = 300;
  const padLeft = 68;
  const padRight = 24;
  const padTop = 32;
  const padBottom = 44;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  // Calculate visible time window accounting for zoom and pan
  const visibleSpan = timeSpan / zoomScale;
  const minPan = 0;
  const maxPan = timeSpan - visibleSpan;
  const clampedPan = Math.max(minPan, Math.min(panOffset, maxPan));

  const viewStartTime = minTime + clampedPan;
  const viewEndTime = viewStartTime + visibleSpan;

  const getX = (time: number) => {
    const norm = (time - viewStartTime) / (visibleSpan || 1);
    return padLeft + norm * plotW;
  };

  const getY = (val: number) => {
    const norm = (val - minFlux) / (maxFlux - minFlux || 1);
    return padTop + (1 - norm) * plotH;
  };

  // Zoom preset handlers
  const handleTransitFocus = () => {
    AudioEngine.playClick();
    HapticEngine.selectionTick();
    setZoomScale(3.2);
    setPanOffset(timeSpan * 0.22);
  };

  const handleZoomIn = () => {
    AudioEngine.playClick();
    HapticEngine.selectionTick();
    setZoomScale((prev) => Math.min(prev * 1.5, 8.0));
  };

  const handleZoomOut = () => {
    AudioEngine.playClick();
    HapticEngine.selectionTick();
    setZoomScale((prev) => {
      const next = Math.max(prev / 1.5, 1.0);
      if (next === 1.0) setPanOffset(0);
      return next;
    });
  };

  const handleResetZoom = () => {
    AudioEngine.playClick();
    HapticEngine.selectionTick();
    setZoomScale(1.0);
    setPanOffset(0);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Check boundary crossing for haptic double-tap (t1, t2, t0, t3, t4)
  const checkBoundaryHaptics = (targetTime: number) => {
    const transitCenterTime = minTime + timeSpan * 0.375;
    const transitDurationDays = 3.2 / 24;
    const ingressDurationDays = 0.35 / 24;
    const t0 = transitCenterTime;
    const t1 = t0 - transitDurationDays / 2;
    const t2 = t1 + ingressDurationDays;
    const t3 = t0 + transitDurationDays / 2 - ingressDurationDays;
    const t4 = t0 + transitDurationDays / 2;

    const threshold = visibleSpan * 0.015; // 1.5% of visible span proximity
    let currentRegion: string | null = null;

    if (Math.abs(targetTime - t0) < threshold) currentRegion = 't0_center';
    else if (Math.abs(targetTime - t1) < threshold) currentRegion = 't1_ingress_start';
    else if (Math.abs(targetTime - t2) < threshold) currentRegion = 't2_ingress_end';
    else if (Math.abs(targetTime - t3) < threshold) currentRegion = 't3_egress_start';
    else if (Math.abs(targetTime - t4) < threshold) currentRegion = 't4_egress_end';

    if (currentRegion && currentRegion !== lastSnapRegionRef.current) {
      lastSnapRegionRef.current = currentRegion;
      HapticEngine.snapDoubleTap(); // Double-tap haptic cue at phase phi=0.0 or ingress/egress boundaries
    } else if (!currentRegion) {
      lastSnapRegionRef.current = null;
    }
  };

  // Common coordinate scrubber for mouse & touch
  const handleScrubAtClientX = (clientX: number, rect: DOMRect) => {
    const mouseX = ((clientX - rect.left) / rect.width) * width;
    if (mouseX >= padLeft && mouseX <= width - padRight) {
      const fraction = (mouseX - padLeft) / plotW;
      const targetTime = viewStartTime + fraction * visibleSpan;
      
      let closestIdx = 0;
      let closestDist = Infinity;
      data.forEach((d, i) => {
        const dist = Math.abs(d.time - targetTime);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      });

      setHoverIndex(closestIdx);

      // Micro-vibration (6ms) on scrub tick transition
      if (lastHapticIdxRef.current !== closestIdx) {
        lastHapticIdxRef.current = closestIdx;
        HapticEngine.scrubTick();
      }

      // Check boundary crossings for double-tap cue
      checkBoundaryHaptics(targetTime);
    }
  };

  // Mouse drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale > 1.0) {
      setIsPanning(true);
      setPanStart(e.clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && zoomScale > 1.0) {
      const deltaX = e.clientX - panStart;
      const timeDelta = -(deltaX / plotW) * visibleSpan;
      setPanOffset((prev) => Math.max(0, Math.min(prev + timeDelta, maxPan)));
      setPanStart(e.clientX);
      HapticEngine.scrubTick();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    handleScrubAtClientX(e.clientX, rect);
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Touch handlers for mobile & tablet scrubbing
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setPanStart(touch.clientX);
      const rect = e.currentTarget.getBoundingClientRect();
      handleScrubAtClientX(touch.clientX, rect);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (zoomScale > 1.0) {
        const deltaX = touch.clientX - panStart;
        const timeDelta = -(deltaX / plotW) * visibleSpan;
        setPanOffset((prev) => Math.max(0, Math.min(prev + timeDelta, maxPan)));
        setPanStart(touch.clientX);
        HapticEngine.scrubTick();
      }
      const rect = e.currentTarget.getBoundingClientRect();
      handleScrubAtClientX(touch.clientX, rect);
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  const visibleData = useMemo(() => {
    return data.filter(
      (d) => d.time >= viewStartTime - visibleSpan * 0.05 && d.time <= viewEndTime + visibleSpan * 0.05
    );
  }, [data, viewStartTime, viewEndTime, visibleSpan]);

  const polylinePoints = useMemo(() => {
    return visibleData
      .map((d) => {
        const val =
          activeMode === 'RAW'
            ? d.rawFlux
            : activeMode === 'DETRENDED'
            ? d.detrendedFlux
            : d.residual;
        return `${getX(d.time).toFixed(1)},${getY(val).toFixed(1)}`;
      })
      .join(' ');
  }, [visibleData, activeMode, minFlux, maxFlux, viewStartTime, visibleSpan]);

  // Transit Phase Timing Calculators (t1: first contact, t2: full ingress, t0: midpoint, t3: egress start, t4: fourth contact)
  const transitCenterTime = minTime + timeSpan * 0.375;
  const transitHalfWidth = (plotW * 0.09) * zoomScale;
  const transitDurationDays = (3.2 / 24); // ~3.2 hours in days
  const ingressDurationDays = (0.35 / 24); // ~21 minutes in days

  const t0 = transitCenterTime;
  const t1 = t0 - transitDurationDays / 2;
  const t2 = t1 + ingressDurationDays;
  const t3 = t0 + transitDurationDays / 2 - ingressDurationDays;
  const t4 = t0 + transitDurationDays / 2;

  const t0X = getX(t0);
  const t1X = getX(t1);
  const t2X = getX(t2);
  const t3X = getX(t3);
  const t4X = getX(t4);

  const hoveredPoint = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="relative rounded-2xl cosmic-glass p-4 spectral-reactive-aura overflow-hidden">
      <HudCornerBrackets watermark="EPOCH: J2026.5 // NASA-AMES // CALIBRATED" />
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 font-mono-code text-xs">
          {(['RAW', 'DETRENDED', 'RESIDUALS'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                AudioEngine.playClick();
                HapticEngine.lightTap();
                setActiveMode(mode);
              }}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                activeMode === mode
                  ? 'border border-cyan-400/80 bg-cyan-950/90 text-cyan-300 font-bold shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                  : 'border border-white/10 bg-[#070c18]/70 text-slate-400 hover:text-slate-200 hover:bg-[#0c1426]'
              }`}
            >
              {mode}
            </button>
          ))}
          
          <button
            onClick={() => {
              AudioEngine.playClick();
              HapticEngine.lightTap();
              setShowErrorBars(!showErrorBars);
            }}
            className={`px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
              showErrorBars
                ? 'border-cyan-500/40 bg-cyan-950/60 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                : 'border-white/10 bg-[#070c18]/70 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Photometric Error Bars (±1σ)"
          >
            ±σ Bars
          </button>

          <button
            onClick={() => {
              AudioEngine.playClick();
              HapticEngine.lightTap();
              setShowTransitPhases(!showTransitPhases);
            }}
            className={`px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
              showTransitPhases
                ? 'border-purple-500/40 bg-purple-950/60 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                : 'border-white/10 bg-[#070c18]/70 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Transit Contacts (t1, t2, t0, t3, t4)"
          >
            t1-t4 Phases
          </button>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-2 text-xs font-mono-code text-slate-400">
          <button
            onClick={handleTransitFocus}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-cyan-500/40 bg-cyan-950/50 text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 transition-all cursor-pointer shadow-sm"
            title="Auto-Focus Transit Window"
          >
            <Sparkles className="h-3 w-3 text-cyan-400" />
            <span>Transit Focus</span>
          </button>

          <div className="flex items-center gap-1 pl-2 border-l border-white/[0.08]">
            <span className="text-[11px] text-slate-400 mr-1">{zoomScale.toFixed(1)}x</span>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-300 hover:text-cyan-300 cursor-pointer"
              title="Zoom In (or Scroll Wheel)"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-300 hover:text-cyan-300 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 rounded-lg hover:bg-white/[0.08] text-slate-300 hover:text-cyan-300 cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Light Curve SVG Plot */}
      <div 
        ref={containerRef}
        className={`relative mt-2 w-full overflow-hidden select-none ${zoomScale > 1.0 ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}`}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onMouseLeave={() => {
            setHoverIndex(null);
            setIsPanning(false);
          }}
        >
          <defs>
            <linearGradient id="transitShade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.01" />
            </linearGradient>

            <linearGradient id="curveGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#00f0ff" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>

            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          <g className="opacity-15 stroke-cyan-500" strokeDasharray="3 3">
            {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
              <line
                key={`h-${i}`}
                x1={padLeft}
                y1={padTop + pct * plotH}
                x2={width - padRight}
                y2={padTop + pct * plotH}
              />
            ))}
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((pct, i) => (
              <line
                key={`v-${i}`}
                x1={padLeft + pct * plotW}
                y1={padTop}
                x2={padLeft + pct * plotW}
                y2={height - padBottom}
              />
            ))}
          </g>

          {/* Transit Ingress / Egress Shaded Window & Ingress-Egress Boundary Markers */}
          {activeMode !== 'RESIDUALS' && showTransitPhases && (
            <g>
              {/* Shaded Transit Region */}
              <rect
                x={Math.max(padLeft, t1X)}
                y={padTop}
                width={Math.max(0, Math.min(plotW, t4X - t1X))}
                height={plotH}
                fill="url(#transitShade)"
                opacity="0.9"
              />

              {/* t1: First Contact (Ingress Start) */}
              {t1X >= padLeft && t1X <= width - padRight && (
                <g>
                  <line x1={t1X} y1={padTop} x2={t1X} y2={height - padBottom} stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 3" opacity="0.75" />
                  <text x={t1X} y={padTop + 12} textAnchor="middle" className="font-mono-code text-[8px] font-bold fill-sky-300">t1</text>
                </g>
              )}

              {/* t2: Second Contact (Full Ingress) */}
              {t2X >= padLeft && t2X <= width - padRight && (
                <g>
                  <line x1={t2X} y1={padTop} x2={t2X} y2={height - padBottom} stroke="#00f0ff" strokeWidth="1" strokeDasharray="3 2" opacity="0.85" />
                  <text x={t2X} y={padTop + 12} textAnchor="middle" className="font-mono-code text-[8px] font-bold fill-cyan-300">t2</text>
                </g>
              )}

              {/* t0: Mid-Transit Centerline */}
              {t0X >= padLeft && t0X <= width - padRight && (
                <g>
                  <line x1={t0X} y1={padTop} x2={t0X} y2={height - padBottom} stroke="#00f0ff" strokeWidth="1.8" strokeDasharray="2 2" filter="url(#neonGlow)" />
                  <g>
                    <rect x={t0X - 36} y={padTop + 4} width="72" height="15" rx="4" fill="#060c18" stroke="#00f0ff" strokeWidth="1" />
                    <text x={t0X} y={padTop + 15} textAnchor="middle" className="font-mono-code text-[9px] font-bold fill-cyan-300">TRANSIT t0</text>
                  </g>
                </g>
              )}

              {/* t3: Third Contact (Egress Start) */}
              {t3X >= padLeft && t3X <= width - padRight && (
                <g>
                  <line x1={t3X} y1={padTop} x2={t3X} y2={height - padBottom} stroke="#00f0ff" strokeWidth="1" strokeDasharray="3 2" opacity="0.85" />
                  <text x={t3X} y={padTop + 12} textAnchor="middle" className="font-mono-code text-[8px] font-bold fill-cyan-300">t3</text>
                </g>
              )}

              {/* t4: Fourth Contact (Exit) */}
              {t4X >= padLeft && t4X <= width - padRight && (
                <g>
                  <line x1={t4X} y1={padTop} x2={t4X} y2={height - padBottom} stroke="#38bdf8" strokeWidth="1" strokeDasharray="4 3" opacity="0.75" />
                  <text x={t4X} y={padTop + 12} textAnchor="middle" className="font-mono-code text-[8px] font-bold fill-sky-300">t4</text>
                </g>
              )}
            </g>
          )}

          {/* Baseline Reference Line */}
          {activeMode !== 'RESIDUALS' && (
            <line
              x1={padLeft}
              y1={getY(1.0)}
              x2={width - padRight}
              y2={getY(1.0)}
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.8"
            />
          )}

          {/* Photometric Error Bars */}
          {showErrorBars &&
            visibleData.map((d, i) => {
              const val =
                activeMode === 'RAW'
                  ? d.rawFlux
                  : activeMode === 'DETRENDED'
                  ? d.detrendedFlux
                  : d.residual;
              const cx = getX(d.time);
              const err = d.error || 0.00006;
              const yTop = getY(val + err);
              const yBot = getY(val - err);

              if (cx < padLeft || cx > width - padRight) return null;

              return (
                <g key={`err-${i}`} opacity="0.35" stroke="#38bdf8" strokeWidth="0.8">
                  <line x1={cx} y1={yTop} x2={cx} y2={yBot} />
                  <line x1={cx - 1.5} y1={yTop} x2={cx + 1.5} y2={yTop} />
                  <line x1={cx - 1.5} y1={yBot} x2={cx + 1.5} y2={yBot} />
                </g>
              );
            })}

          {/* Theoretical Mandel-Agol Transit Model Line Overlay */}
          {activeMode === 'DETRENDED' && (
            <g className="glow-cyan-neon">
              {/* Outer neon halo */}
              <polyline
                fill="none"
                stroke="#00f0ff"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
                opacity="0.35"
                filter="url(#neonGlow)"
              />
              {/* Core radiant laser curve */}
              <polyline
                fill="none"
                stroke="url(#curveGlow)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
                filter="url(#neonGlow)"
                className="drop-shadow-[0_0_12px_rgba(0,240,255,0.7)]"
              />
            </g>
          )}

          {/* Scatter dots for photometric observations */}
          {visibleData.map((d, i) => {
            const val =
              activeMode === 'RAW'
                ? d.rawFlux
                : activeMode === 'DETRENDED'
                ? d.detrendedFlux
                : d.residual;
            const cx = getX(d.time);
            const cy = getY(val);
            const isHovered = hoveredPoint?.time === d.time;

            if (cx < padLeft || cx > width - padRight) return null;

            return (
              <circle
                key={`pt-${i}`}
                cx={cx}
                cy={cy}
                r={isHovered ? 4.5 : 1.6}
                fill={isHovered ? '#ffffff' : '#00f0ff'}
                stroke={isHovered ? '#00f0ff' : 'none'}
                strokeWidth={1.5}
                opacity={isHovered ? 1 : 0.8}
              />
            );
          })}

          {/* Hover Crosshairs & Guides */}
          {hoveredPoint && (
            <g>
              <line
                x1={getX(hoveredPoint.time)}
                y1={padTop}
                x2={getX(hoveredPoint.time)}
                y2={height - padBottom}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle
                cx={getX(hoveredPoint.time)}
                cy={getY(
                  activeMode === 'RAW'
                    ? hoveredPoint.rawFlux
                    : activeMode === 'DETRENDED'
                    ? hoveredPoint.detrendedFlux
                    : hoveredPoint.residual
                )}
                r="6"
                fill="#ffffff"
                stroke="#00f0ff"
                strokeWidth="2.5"
                className="animate-pulse"
              />
            </g>
          )}

          {/* Y-Axis Labels */}
          <g className="font-mono-code text-[10px] fill-slate-400" textAnchor="end">
            <text x={padLeft - 8} y={padTop + 8}>
              {maxFlux.toFixed(4)}
            </text>
            <text x={padLeft - 8} y={padTop + plotH / 2 + 4}>
              {((maxFlux + minFlux) / 2).toFixed(4)}
            </text>
            <text x={padLeft - 8} y={height - padBottom}>
              {minFlux.toFixed(4)}
            </text>
            <text
              x={18}
              y={height / 2}
              textAnchor="middle"
              transform={`rotate(-90 18 ${height / 2})`}
              className="fill-slate-400 font-bold uppercase tracking-wider text-[9px]"
            >
              Rel Flux
            </text>
          </g>

          {/* X-Axis Labels */}
          <g className="font-mono-code text-[10px] fill-slate-400" textAnchor="middle">
            <text x={padLeft} y={height - padBottom + 18}>
              {viewStartTime.toFixed(2)}
            </text>
            <text x={padLeft + plotW / 2} y={height - padBottom + 18}>
              {((viewStartTime + viewEndTime) / 2).toFixed(2)}
            </text>
            <text x={width - padRight} y={height - padBottom + 18}>
              {viewEndTime.toFixed(2)}
            </text>
            <text
              x={padLeft + plotW / 2}
              y={height - 6}
              className="fill-slate-400 font-bold uppercase tracking-wider text-[10px]"
            >
              Time (BJD - 2454833) {zoomScale > 1.0 ? `[Zoomed ${zoomScale.toFixed(1)}x - Drag to Pan]` : ''}
            </text>
          </g>
        </svg>

        {/* Live Hover Tooltip Panel */}
        {hoveredPoint && (
          <div className="absolute top-2 right-2 rounded-2xl border border-cyan-500/50 bg-[#071124]/95 px-3.5 py-2.5 font-mono-code text-xs text-cyan-200 shadow-2xl backdrop-blur-xl animate-fadeIn">
            <div className="flex items-center justify-between gap-4 pb-1 border-b border-cyan-900/50 mb-1">
              <span className="text-slate-400 text-[10px]">TIME (BJD)</span>
              <strong className="text-white">{hoveredPoint.time.toFixed(4)} d</strong>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <div>
                <span className="text-slate-400">Obs Flux: </span>
                <strong className="text-cyan-300">{hoveredPoint.detrendedFlux.toFixed(5)}</strong>
              </div>
              <div>
                <span className="text-slate-400">Error: </span>
                <strong className="text-slate-300">±{(hoveredPoint.error || 0.00006).toFixed(5)}</strong>
              </div>
              <div>
                <span className="text-slate-400">Phase: </span>
                <strong className="text-slate-300">{hoveredPoint.phase.toFixed(4)}</strong>
              </div>
              <div>
                <span className="text-slate-400">Residual: </span>
                <strong className="text-amber-300">{hoveredPoint.residual.toFixed(5)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer telemetry details */}
      <div className="mt-3 flex flex-wrap items-center justify-between border-t border-white/[0.08] pt-2.5 text-[11px] font-mono-code text-slate-400">
        <div className="flex items-center gap-4">
          <span>Transit Depth: <strong className="text-cyan-400">{target.transitDepth.toLocaleString()} ppm</strong></span>
          <span>Transit Duration: <strong className="text-slate-200">3.2 hrs</strong></span>
          <span>Sampling: <strong className="text-slate-200">29.4 min Cadence</strong></span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>Target: <strong className="text-cyan-300">{target.name}</strong></span>
          <span className="text-slate-600">|</span>
          <span>Host: <strong className="text-slate-200">{target.stellarParams.spectralType}</strong></span>
        </div>
      </div>
    </div>
  );
};
