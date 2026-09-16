import React, { useState } from 'react';
import { TargetPlanet, AstrophysicsVettingResponse, PlanetClassificationType, getPlanetaryClassification } from '../../types';
import { LightCurveViewer } from './LightCurveViewer';
import { PhaseFoldedViewer } from './PhaseFoldedViewer';
import { TpfCcdViewer } from './TpfCcdViewer';
import { HeroPlanetaryGlobe } from './HeroPlanetaryGlobe';
import { TripleRadialRingDial } from './TripleRadialRingDial';
import { exportCandidateDossierPDF } from '../../utils/pdfExport';
import { AudioEngine, HapticEngine } from '../../utils/feedbackEngine';
import { RollingOdometer } from '../common/RollingOdometer';
import { HudCornerBrackets } from '../common/HudCornerBrackets';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Sliders, 
  Cpu, 
  Download, 
  Flag, 
  Send,
  RefreshCw,
  Info,
  FileText,
  ShieldCheck,
  Layers,
  Compass,
  Telescope,
  Atom,
  Flame
} from 'lucide-react';

interface VettingTerminalProps {
  selectedTarget: TargetPlanet;
  onSelectTarget: (target: TargetPlanet) => void;
  allTargets: TargetPlanet[];
  activeCategory?: PlanetClassificationType;
  onOpenJsonModal?: () => void;
  onRunVettingApi: (target: TargetPlanet) => Promise<AstrophysicsVettingResponse | null>;
}

export const VettingTerminal: React.FC<VettingTerminalProps> = ({
  selectedTarget,
  onSelectTarget,
  allTargets,
  activeCategory = 'ALL',
  onOpenJsonModal,
  onRunVettingApi,
}) => {
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isVettingLoading, setIsVettingLoading] = useState(false);
  const [vettingResult, setVettingResult] = useState<AstrophysicsVettingResponse | null>(null);
  const [isFlagged, setIsFlagged] = useState(false);
  const [showTelemetryTuner, setShowTelemetryTuner] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Filter target chips according to active planetary classification
  const visibleTargets = allTargets.filter((t) => {
    if (activeCategory === 'ALL') return true;
    const classification = getPlanetaryClassification(t.planetRadius);
    return classification.type === activeCategory;
  });

  // Custom adjustable parameters for interactive vetting experimentation
  const [customParams, setCustomParams] = useState({
    orbitalPeriod: selectedTarget.orbitalPeriod,
    transitDepth: selectedTarget.transitDepth,
    planetRadius: selectedTarget.planetRadius,
    oddEvenRatio: selectedTarget.oddEvenRatio,
    secondaryEclipseDepth: selectedTarget.secondaryEclipseDepth,
    centroidOffset: selectedTarget.centroidOffset,
  });

  const activeRadiusClassification = getPlanetaryClassification(customParams.planetRadius);

  const handleRunVetting = async () => {
    AudioEngine.playDiagnosticScan();
    HapticEngine.selectionTick();
    setIsVettingLoading(true);

    const modifiedTarget: TargetPlanet = {
      ...selectedTarget,
      orbitalPeriod: customParams.orbitalPeriod,
      transitDepth: customParams.transitDepth,
      planetRadius: customParams.planetRadius,
      oddEvenRatio: customParams.oddEvenRatio,
      secondaryEclipseDepth: customParams.secondaryEclipseDepth,
      centroidOffset: customParams.centroidOffset,
    };

    const res = await onRunVettingApi(modifiedTarget);
    if (res) {
      setVettingResult(res);
      if (res.disposition === 'CONFIRMED' || res.disposition === 'CONFIRMED CANDIDATE') {
        AudioEngine.playConfirmedChime();
        HapticEngine.successPulse();
      } else {
        AudioEngine.playFalsePositiveAlert();
        HapticEngine.warningBuzz();
      }
    }
    setIsVettingLoading(false);
  };

  const handleExportPDF = () => {
    AudioEngine.playClick();
    HapticEngine.lightTap();
    setIsExportingPdf(true);
    try {
      exportCandidateDossierPDF(selectedTarget, vettingResult);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setTimeout(() => setIsExportingPdf(false), 800);
    }
  };

  // Sync tuner when target changes
  React.useEffect(() => {
    setCustomParams({
      orbitalPeriod: selectedTarget.orbitalPeriod,
      transitDepth: selectedTarget.transitDepth,
      planetRadius: selectedTarget.planetRadius,
      oddEvenRatio: selectedTarget.oddEvenRatio,
      secondaryEclipseDepth: selectedTarget.secondaryEclipseDepth,
      centroidOffset: selectedTarget.centroidOffset,
    });
    setVettingResult(null);
  }, [selectedTarget.id]);

  // Derived values (from either live vetting result or target data)
  const confidence = vettingResult
    ? vettingResult.mlConfidence
    : selectedTarget.mlConfidence;

  const disposition = vettingResult
    ? vettingResult.disposition
    : selectedTarget.disposition;

  const pExoplanet = vettingResult
    ? vettingResult.probabilities.exoplanet
    : (confidence * 100);

  const pEB = vettingResult
    ? vettingResult.probabilities.eclipsingBinary
    : selectedTarget.disposition === 'FALSE POSITIVE'
    ? 94.2
    : 2.1;

  const pNoise = vettingResult
    ? vettingResult.probabilities.stellarNoise
    : 1.5;

  // Strict physical thresholds
  const oddEvenPass = customParams.oddEvenRatio >= 0.95 && customParams.oddEvenRatio <= 1.05;
  const secPass = customParams.secondaryEclipseDepth < 15;
  const centroidPass = customParams.centroidOffset < 0.25;
  const snrPass = (selectedTarget.snr || 32.4) >= 7.1;

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      {/* Title Bar & Target Switcher Pills */}
      <div className="rounded-sm cosmic-glass p-4 border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-white uppercase flex items-center gap-2">
              <span>Photometric Vetting Terminal</span>
            </h1>
            <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-sm bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold uppercase tracking-wider">
              1D-CNN VetEngine
            </span>
          </div>
          <p className="text-xs font-mono-code text-slate-400 mt-0.5">
            Mandel-Agol Analytical Transit Fit • Astrophysical Validation &amp; 3D Morphometry
          </p>
        </div>

        {/* Quick Targets Flight Tags & PDF Export */}
        <div className="flex flex-wrap items-center gap-2">
          {visibleTargets.slice(0, 5).map((target) => {
            const isSel = selectedTarget.id === target.id;
            return (
              <button
                key={target.id}
                id={`target-pill-${target.id}`}
                onClick={() => onSelectTarget(target)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-mono-code uppercase tracking-wider transition-all cursor-pointer ${
                  isSel
                    ? 'border border-cyan-400 bg-cyan-950/90 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.3)] font-bold'
                    : 'border border-white/10 bg-[#070b16]/70 text-slate-400 hover:text-slate-200 hover:border-white/20'
                }`}
              >
                <Sparkles className="h-3 w-3 text-cyan-400" />
                <span>{target.name}</span>
              </button>
            );
          })}

          <button
            onClick={() => setShowTelemetryTuner(!showTelemetryTuner)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-mono-code uppercase tracking-wider border transition-all cursor-pointer ${
              showTelemetryTuner
                ? 'border-cyan-400 bg-cyan-950/90 text-cyan-300 font-bold shadow-[0_0_12px_rgba(56,189,248,0.3)]'
                : 'border-white/10 bg-[#070b16]/70 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span>Tune Telemetry</span>
          </button>

          {/* Export PDF Dossier Action */}
          <button
            id="btn-export-dossier-pdf"
            onClick={handleExportPDF}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 px-3 py-1 rounded-sm text-[11px] font-mono-code font-bold uppercase tracking-wider border border-cyan-500/50 bg-cyan-950/80 text-cyan-300 hover:bg-cyan-900/80 hover:text-white transition-all shadow-sm cursor-pointer"
            title="Export full candidate dossier as PDF"
          >
            {isExportingPdf ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-cyan-400" />}
            <span>Export Dossier (PDF)</span>
          </button>
        </div>
      </div>

      {/* Telemetry Tuner Drawer */}
      {showTelemetryTuner && (
        <div className="rounded-sm cosmic-glass p-4 border border-white/[0.08] font-mono-code text-xs animate-fadeIn">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/[0.08]">
            <span className="text-cyan-300 font-bold flex items-center gap-2 uppercase tracking-wider text-[11px]">
              <Sliders className="h-4 w-4 text-cyan-400" />
              Interactive Telemetry Injector (Simulate Astrometric / Transit Variations)
            </span>
            <button
              onClick={() => {
                setCustomParams({
                  orbitalPeriod: selectedTarget.orbitalPeriod,
                  transitDepth: selectedTarget.transitDepth,
                  planetRadius: selectedTarget.planetRadius,
                  oddEvenRatio: selectedTarget.oddEvenRatio,
                  secondaryEclipseDepth: selectedTarget.secondaryEclipseDepth,
                  centroidOffset: selectedTarget.centroidOffset,
                });
              }}
              className="text-slate-400 hover:text-cyan-300 cursor-pointer uppercase text-[10px] tracking-wider"
            >
              Reset to Actual
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-slate-400 block mb-1 text-[10px] uppercase tracking-wider">Period (days)</label>
              <input
                type="number"
                step="0.01"
                value={customParams.orbitalPeriod}
                onChange={(e) => setCustomParams({ ...customParams, orbitalPeriod: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-sm bg-[#050914] border border-white/[0.08] p-2 text-cyan-300 font-bold outline-none focus:border-cyan-400 tabular-nums"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 text-[10px] uppercase tracking-wider">Depth (ppm)</label>
              <input
                type="number"
                step="10"
                value={customParams.transitDepth}
                onChange={(e) => setCustomParams({ ...customParams, transitDepth: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-sm bg-[#050914] border border-white/[0.08] p-2 text-cyan-300 font-bold outline-none focus:border-cyan-400 tabular-nums"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 text-[10px] uppercase tracking-wider">Radius (R⊕)</label>
              <input
                type="number"
                step="0.1"
                value={customParams.planetRadius}
                onChange={(e) => setCustomParams({ ...customParams, planetRadius: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-sm bg-[#050914] border border-white/[0.08] p-2 text-cyan-300 font-bold outline-none focus:border-cyan-400 tabular-nums"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 text-[10px] uppercase tracking-wider">Odd/Even Ratio</label>
              <input
                type="number"
                step="0.01"
                value={customParams.oddEvenRatio}
                onChange={(e) => setCustomParams({ ...customParams, oddEvenRatio: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-sm bg-[#050914] border border-white/[0.08] p-2 text-cyan-300 font-bold outline-none focus:border-cyan-400 tabular-nums"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 text-[10px] uppercase tracking-wider">Secondary (ppm)</label>
              <input
                type="number"
                step="1"
                value={customParams.secondaryEclipseDepth}
                onChange={(e) => setCustomParams({ ...customParams, secondaryEclipseDepth: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-sm bg-[#050914] border border-white/[0.08] p-2 text-cyan-300 font-bold outline-none focus:border-cyan-400 tabular-nums"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1 text-[10px] uppercase tracking-wider">Centroid Offset (&quot;)</label>
              <input
                type="number"
                step="0.01"
                value={customParams.centroidOffset}
                onChange={(e) => setCustomParams({ ...customParams, centroidOffset: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-sm bg-[#050914] border border-white/[0.08] p-2 text-cyan-300 font-bold outline-none focus:border-cyan-400 tabular-nums"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={handleRunVetting}
              disabled={isVettingLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-sm border border-cyan-400 bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 font-mono-code text-xs uppercase tracking-wider font-bold transition-all shadow-sm cursor-pointer"
            >
              {isVettingLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>Run AI Vetting Engine</span>
            </button>
          </div>
        </div>
      )}

      {/* Luxury Telemetry Metric Cards (AstroPlus Aerospace Glass with HUD Corner Brackets & Rolling Odometer) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Orbital Period */}
        <div className="relative rounded-sm cosmic-glass p-4 border border-white/[0.08] flex flex-col justify-between spectral-reactive-aura overflow-hidden group">
          <HudCornerBrackets watermark="EPOCH: J2026.5 // NASA-AMES" />
          <div className="text-[10px] font-mono-code text-slate-400 uppercase tracking-widest">
            ORBITAL PERIOD [P]
          </div>
          <div className="mt-2 flex items-baseline justify-between z-10">
            <span className="font-mono-code tabular-nums text-2xl sm:text-3xl font-black text-cyan-300 glow-cyan">
              <RollingOdometer
                value={customParams.orbitalPeriod}
                decimals={4}
                durationMs={300}
              />
            </span>
            <span className="font-mono-code text-xs text-slate-400/60 uppercase">d</span>
          </div>
        </div>

        {/* Transit Depth */}
        <div className="relative rounded-sm cosmic-glass p-4 border border-white/[0.08] flex flex-col justify-between spectral-reactive-aura overflow-hidden group">
          <HudCornerBrackets watermark="INSTRUMENT: TESS/KEPLER" />
          <div className="text-[10px] font-mono-code text-slate-400 uppercase tracking-widest">
            TRANSIT DEPTH [δ]
          </div>
          <div className="mt-2 flex items-baseline justify-between z-10">
            <span className="font-mono-code tabular-nums text-2xl sm:text-3xl font-black text-cyan-300 glow-cyan">
              <RollingOdometer
                value={customParams.transitDepth}
                formatLocale={true}
                durationMs={300}
              />
            </span>
            <span className="font-mono-code text-xs text-slate-400/60 uppercase">ppm</span>
          </div>
        </div>

        {/* Planet Radius */}
        <div className="relative rounded-sm cosmic-glass p-4 border border-white/[0.08] flex flex-col justify-between spectral-reactive-aura overflow-hidden group">
          <HudCornerBrackets watermark="CALIBRATED // ST_RAD" />
          <div className="flex items-center justify-between gap-1 text-[10px] font-mono-code text-slate-400 uppercase tracking-widest">
            <span>PLANET RADIUS [Rp]</span>
            <span
              id="badge-planet-radius-class"
              className={`text-[9px] px-1.5 py-0.5 rounded-sm border font-mono-code font-bold uppercase tracking-wider ${activeRadiusClassification.borderClass} ${activeRadiusClassification.bgClass} ${activeRadiusClassification.colorClass}`}
            >
              {activeRadiusClassification.badgeLabel.replace('CLASS: ', '')}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between z-10">
            <span className="font-mono-code tabular-nums text-2xl sm:text-3xl font-black text-cyan-300 glow-cyan">
              <RollingOdometer
                value={customParams.planetRadius}
                decimals={2}
                durationMs={300}
              />
            </span>
            <span className="font-mono-code text-xs text-slate-400/60 uppercase">R⊕</span>
          </div>
        </div>

        {/* Equilibrium Temp */}
        <div className="relative rounded-sm cosmic-glass p-4 border border-white/[0.08] flex flex-col justify-between spectral-reactive-aura overflow-hidden group">
          <HudCornerBrackets watermark="ALBEDO: 0.3 // STELLAR_TEFF" />
          <div className="flex items-center justify-between text-[10px] font-mono-code text-slate-400 uppercase tracking-widest">
            <span>EQUILIBRIUM TEMP [Teq]</span>
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline justify-between z-10">
            <span className="font-mono-code tabular-nums text-2xl sm:text-3xl font-black text-cyan-300 glow-cyan">
              <RollingOdometer
                value={selectedTarget.equilibriumTemp}
                decimals={0}
                durationMs={300}
              />
            </span>
            <span className="font-mono-code text-xs text-slate-400/60 uppercase">K</span>
          </div>
        </div>
      </div>

      {/* Main Analysis Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Light Curve Viewer + 3D Planetary Globe & Phase Folding */}
        <div className="lg:col-span-2 space-y-4">
          <LightCurveViewer target={selectedTarget} />

          {/* Side-by-side Hero 3D Globe (AstroPlus Wireframe Split) and Phase-Folded Viewer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HeroPlanetaryGlobe target={selectedTarget} />
            <PhaseFoldedViewer target={selectedTarget} />
          </div>

          {/* Full-width TPF 5x5 CCD Flux Matrix with Centroid Drift Vector */}
          <TpfCcdViewer target={selectedTarget} />
        </div>

        {/* Right 1 Col: Triple Concentric Radial Ring Dial, False-Positive Matrix & Scientific Verdict */}
        <div className="space-y-4">
          {/* Concentric 3-Ring Radial Dial Card */}
          <div className="rounded-sm cosmic-glass p-4 border border-white/[0.08] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <span className="font-mono-code text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                1D-CNN VetEngine Evaluation
              </span>
              <button
                onClick={onOpenJsonModal}
                className="text-slate-400 hover:text-cyan-300 cursor-pointer"
                title="Inspect raw schema"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Triple Concentric Radial Ring Component */}
            <div className="my-2">
              <TripleRadialRingDial
                target={selectedTarget}
                confidence={confidence}
                oddEvenRatio={customParams.oddEvenRatio}
                centroidOffset={customParams.centroidOffset}
                disposition={disposition}
                onOpenSchema={onOpenJsonModal}
              />
            </div>

            {/* Probabilities Progress Bars */}
            <div className="mt-3 pt-3 border-t border-white/[0.08] space-y-2.5 font-mono-code text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1 text-[11px]">
                  <span>Planet Model Match</span>
                  <span className="text-cyan-400 font-bold tabular-nums">{(pExoplanet / 100).toFixed(3)}</span>
                </div>
                <div className="h-1.5 w-full rounded-sm bg-slate-900 border border-white/5 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-sm transition-all duration-700"
                    style={{ width: `${Math.min(100, pExoplanet)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1 text-[11px]">
                  <span>Eclipsing Binary</span>
                  <span className="text-amber-400 font-bold tabular-nums">{(pEB / 100).toFixed(3)}</span>
                </div>
                <div className="h-1.5 w-full rounded-sm bg-slate-900 border border-white/5 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-sm transition-all duration-700"
                    style={{ width: `${Math.min(100, pEB)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1 text-[11px]">
                  <span>Instrumental Noise</span>
                  <span className="text-slate-400 font-bold tabular-nums">{(pNoise / 100).toFixed(3)}</span>
                </div>
                <div className="h-1.5 w-full rounded-sm bg-slate-900 border border-white/5 overflow-hidden">
                  <div
                    className="h-full bg-slate-500 rounded-sm transition-all duration-700"
                    style={{ width: `${Math.min(100, pNoise)}%` }}
                  />
                </div>
              </div>
            </div>

            {vettingResult && (
              <div className="mt-3 p-3 rounded-sm bg-cyan-950/50 border border-cyan-500/40 text-[11px] font-mono-code text-cyan-200">
                <div className="font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Astrophysics Engine Verdict:</span>
                </div>
                <div className="leading-relaxed text-slate-200">{vettingResult.scientificVerdict}</div>
              </div>
            )}
          </div>

          {/* False-Positive Matrix with Strict NASA Ames Thresholds */}
          <div className="rounded-sm cosmic-glass p-4 border border-white/[0.08] space-y-2.5">
            <div className="font-mono-code text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-white/[0.08] flex items-center justify-between">
              <span>False-Positive Matrix</span>
              <span className="text-[10px] text-cyan-400 font-normal">NASA Ames Protocols</span>
            </div>

            <div className="space-y-2 font-mono-code text-xs">
              {/* Odd/Even Ratio */}
              <div className="flex items-center justify-between p-2.5 rounded-sm border border-white/[0.06] bg-[#060b16]/70">
                <div>
                  <div className="text-slate-300 font-medium">Odd/Even Depth Test</div>
                  <div className="text-[10px] text-slate-500 tabular-nums">Ratio: {customParams.oddEvenRatio.toFixed(3)} (0.95 - 1.05)</div>
                </div>
                {oddEvenPass ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono-code font-bold uppercase tracking-wider">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> PASS
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px] font-mono-code font-bold uppercase tracking-wider">
                    <XCircle className="h-3.5 w-3.5 text-rose-400" /> FAIL
                  </span>
                )}
              </div>

              {/* Secondary Eclipse */}
              <div className="flex items-center justify-between p-2.5 rounded-sm border border-white/[0.06] bg-[#060b16]/70">
                <div>
                  <div className="text-slate-300 font-medium">Secondary Eclipse</div>
                  <div className="text-[10px] text-slate-500 tabular-nums">Depth: {customParams.secondaryEclipseDepth} ppm (&lt; 15 ppm)</div>
                </div>
                {secPass ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono-code font-bold uppercase tracking-wider">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> PASS
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px] font-mono-code font-bold uppercase tracking-wider">
                    <XCircle className="h-3.5 w-3.5 text-rose-400" /> FAIL
                  </span>
                )}
              </div>

              {/* Centroid Astrometric Offset */}
              <div className="flex items-center justify-between p-2.5 rounded-sm border border-white/[0.06] bg-[#060b16]/70">
                <div>
                  <div className="text-slate-300 font-medium">Centroid Astrometry</div>
                  <div className="text-[10px] text-slate-500 tabular-nums">Offset: {customParams.centroidOffset.toFixed(2)}&quot; (&lt; 0.25&quot;)</div>
                </div>
                {centroidPass ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono-code font-bold uppercase tracking-wider">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> PASS
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono-code font-bold uppercase tracking-wider">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> SHIFT
                  </span>
                )}
              </div>

              {/* Transit Signal-to-Noise Ratio (SNR) */}
              <div className="flex items-center justify-between p-2.5 rounded-sm border border-white/[0.06] bg-[#060b16]/70">
                <div>
                  <div className="text-slate-300 font-medium">Photometric SNR</div>
                  <div className="text-[10px] text-slate-500 tabular-nums">MES / SNR: {selectedTarget.snr || '34.2'} (&gt; 7.1)</div>
                </div>
                {snrPass ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono-code font-bold uppercase tracking-wider">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> PASS
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-sm bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px] font-mono-code font-bold uppercase tracking-wider">
                    <XCircle className="h-3.5 w-3.5 text-rose-400" /> FAIL
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Command Bar & Stellar Host Telemetry Strip */}
      <div className="rounded-sm cosmic-glass p-4 border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
        {/* Left Telemetry Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-sm border border-white/[0.08] bg-[#060a14] p-0.5 font-mono-code text-xs">
            <button
              onClick={() => setIsLiveMode(true)}
              className={`px-2.5 py-1 rounded-sm text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                isLiveMode
                  ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              LIVE
            </button>
            <button
              onClick={() => setIsLiveMode(false)}
              className={`px-2.5 py-1 rounded-sm text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
                !isLiveMode
                  ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CACHED
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono-code text-slate-300 border-l border-white/[0.08] pl-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-semibold tracking-wider">PIPELINE SYNCED</span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-400 font-bold tracking-wider">SECTOR 7G</span>
          </div>
        </div>

        {/* Right Actions & Stellar Host Data */}
        <div className="flex flex-wrap items-center gap-4 font-mono-code text-xs">
          {/* Stellar Parameters Readout */}
          <div className="flex flex-wrap items-center gap-4 text-slate-400 border-r border-white/[0.08] pr-4 text-[11px]">
            <div>
              <span className="text-slate-500">• T_eff </span>
              <strong className="text-slate-200 tabular-nums">{selectedTarget.stellarParams.teff} ± {selectedTarget.stellarParams.teffErr}</strong> K
            </div>
            <div>
              <span className="text-slate-500">• log(g) </span>
              <strong className="text-slate-200 tabular-nums">{selectedTarget.stellarParams.logg.toFixed(2)} ± {selectedTarget.stellarParams.loggErr.toFixed(2)}</strong>
            </div>
            <div>
              <span className="text-slate-500">• [Fe/H] </span>
              <strong className="text-slate-200 tabular-nums">{selectedTarget.stellarParams.feh >= 0 ? `+${selectedTarget.stellarParams.feh.toFixed(2)}` : selectedTarget.stellarParams.feh.toFixed(2)} ± {selectedTarget.stellarParams.fehErr.toFixed(2)}</strong>
            </div>
            <div>
              <span className="text-slate-500">• Host Mass </span>
              <strong className="text-slate-200 tabular-nums">{selectedTarget.stellarParams.mass.toFixed(2)}</strong> M☉
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify(selectedTarget, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selectedTarget.id}_telemetry.json`;
                a.click();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-white/[0.1] bg-[#070b16] text-slate-300 hover:text-white hover:border-cyan-400/40 transition-colors cursor-pointer text-xs uppercase tracking-wider"
            >
              <Download className="h-3.5 w-3.5" />
              <span>DATA</span>
            </button>

            <button
              onClick={() => setIsFlagged(!isFlagged)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border transition-colors cursor-pointer text-xs uppercase tracking-wider ${
                isFlagged
                  ? 'border-amber-500/60 bg-amber-950/50 text-amber-300'
                  : 'border-white/[0.1] bg-[#070b16] text-slate-300 hover:text-white'
              }`}
            >
              <Flag className="h-3.5 w-3.5" />
              <span>FLAG</span>
            </button>

            <button
              id="btn-validate-export"
              onClick={handleRunVetting}
              disabled={isVettingLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-sm border border-cyan-400 bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 font-mono-code text-xs uppercase tracking-wider font-bold transition-all shadow-sm shadow-cyan-950/60 cursor-pointer"
            >
              {isVettingLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>VALIDATE &amp; VET</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
