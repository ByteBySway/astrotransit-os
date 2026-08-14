import React, { useState, useEffect } from 'react';
import { TargetPlanet, MissionEpoch, TabType } from '../../types';
import { MISSION_EPOCHS } from '../../data/mockTargets';
import { 
  X, 
  Calendar, 
  Sparkles, 
  Rocket, 
  Telescope, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Orbit, 
  Compass, 
  Flame, 
  Radio
} from 'lucide-react';

interface MissionTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTargets: TargetPlanet[];
  selectedTarget: TargetPlanet;
  onSelectTarget: (target: TargetPlanet) => void;
  onJumpToTab: (tab: TabType) => void;
}

export const MissionTimelineModal: React.FC<MissionTimelineModalProps> = ({
  isOpen,
  onClose,
  allTargets,
  selectedTarget,
  onSelectTarget,
  onJumpToTab,
}) => {
  const [activeEpochIndex, setActiveEpochIndex] = useState(0);
  const [animatedYear, setAnimatedYear] = useState(MISSION_EPOCHS[0].launchYear);

  const currentEpoch = MISSION_EPOCHS[activeEpochIndex] || MISSION_EPOCHS[0];

  // Kinetic rolling number reel animation when epoch changes
  useEffect(() => {
    if (!isOpen) return;
    const targetYear = currentEpoch.launchYear;
    setAnimatedYear(targetYear);
  }, [isOpen, currentEpoch.launchYear]);

  if (!isOpen) return null;

  // Find target planets that match this mission epoch
  const matchingPlanets = allTargets.filter((planet) => {
    if (currentEpoch.associatedTargets.includes(planet.id)) return true;
    if (currentEpoch.id === 'KEPLER' && (planet.id.startsWith('Kepler-') || planet.id.startsWith('KIC-') || planet.id.startsWith('KOI-'))) return true;
    if (currentEpoch.id === 'K2' && (planet.id.startsWith('K2-') || planet.id.startsWith('EPIC-'))) return true;
    if (currentEpoch.id === 'TESS' && (planet.id.startsWith('TOI-') || planet.id === 'LHS-1140b' || planet.id === 'Proxima-b' || planet.id === 'WASP-12b')) return true;
    if (currentEpoch.id === 'JWST' && (planet.id === 'TRAPPIST-1e' || planet.id === 'K2-18b' || planet.id === 'WASP-12b')) return true;
    return false;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-fadeIn">
      {/* Outer Modal Container */}
      <div className="relative w-full max-w-5xl rounded-3xl border border-cyan-500/30 bg-[#070b16]/95 p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Background Ambient Cosmic Flares */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Header */}
        <div className="relative flex items-center justify-between pb-4 border-b border-white/[0.08] z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-md">
              <Telescope className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wider text-white uppercase">
                  Discover by Mission Epoch
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/40 bg-cyan-950/70 text-cyan-300 font-mono-code font-bold">
                  AISTARS CHRONOLOGY
                </span>
              </div>
              <p className="text-xs font-mono-code text-slate-400">
                Explore transiting exoplanet discoveries indexed by observatory mission era
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] bg-[#0c1220] text-slate-400 hover:text-white hover:border-cyan-400 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Kinetic Odometer Mission Timeline Bar */}
        <div className="relative py-4 border-b border-white/[0.08] z-10">
          {/* Mission Epoch Selectors */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {MISSION_EPOCHS.map((epoch, idx) => {
              const isSelected = idx === activeEpochIndex;
              return (
                <button
                  key={epoch.id}
                  onClick={() => setActiveEpochIndex(idx)}
                  className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/60 shadow-lg shadow-cyan-900/30'
                      : 'border-white/[0.06] bg-[#090e1c] hover:bg-[#0f172a] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono-code text-slate-400 mb-1">
                    <span>{epoch.activeYears}</span>
                    {epoch.status === 'OPERATIONAL' && (
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </div>
                  <div className="font-display text-sm font-bold text-white uppercase tracking-wide">
                    {epoch.shortName}
                  </div>
                  <div className="mt-1 text-[10px] font-mono-code text-cyan-300 font-semibold">
                    {epoch.launchYear} Launch
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Mission Epoch Spotlight & Target Planets */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 z-10">
          {/* Hero Banner for Selected Epoch */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0b1122]/80 p-5 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl font-black text-cyan-300 glow-cyan">
                  {currentEpoch.name}
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono-code font-bold uppercase ${currentEpoch.badgeColor}`}>
                  {currentEpoch.status}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {currentEpoch.description}
              </p>
              <div className="flex items-center gap-2 text-xs font-mono-code text-cyan-400">
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                <span>Benchmark Discoveries: <strong>{currentEpoch.keyHighlight}</strong></span>
              </div>
            </div>

            {/* Kinetic Rolling Year Reel */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#060a14] border border-cyan-500/30 min-w-[140px] text-center shadow-inner">
              <span className="text-[10px] font-mono-code text-slate-400 uppercase tracking-widest">
                LAUNCH EPOCH
              </span>
              <span className="font-display text-4xl font-black text-white glow-cyan my-1">
                {animatedYear}
              </span>
              <span className="text-[10px] font-mono-code text-emerald-400 font-bold">
                {currentEpoch.targetCount}
              </span>
            </div>
          </div>

          {/* Section: Discovered Exoplanets in this Epoch */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono-code text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Rocket className="h-4 w-4 text-cyan-400" />
                Cataloged Targets in this Mission Era ({matchingPlanets.length})
              </span>
              <span className="text-[11px] font-mono-code text-slate-400">
                Click target to instantly load into Photometric Vetting Terminal
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {matchingPlanets.map((planet) => {
                const isCurrent = planet.id === selectedTarget.id;
                return (
                  <div
                    key={planet.id}
                    className={`rounded-2xl border p-3.5 transition-all flex flex-col justify-between ${
                      isCurrent
                        ? 'border-cyan-400 bg-cyan-950/70 shadow-lg shadow-cyan-900/40'
                        : 'border-white/[0.08] bg-[#090f1e]/90 hover:border-cyan-500/40 hover:bg-[#0e162c]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-display text-sm font-bold text-white">
                          {planet.name}
                        </span>
                        <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-950/80 text-cyan-300 font-bold">
                          {planet.planetRadius.toFixed(2)} R⊕
                        </span>
                      </div>

                      <div className="text-[11px] font-mono-code text-slate-400 mb-2">
                        {planet.systemName}
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono-code bg-[#060a14] p-2 rounded-xl border border-white/[0.04] mb-3">
                        <div>
                          <span className="text-slate-500">Period: </span>
                          <strong className="text-slate-200">{planet.orbitalPeriod.toFixed(2)} d</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">Depth: </span>
                          <strong className="text-cyan-300">{planet.transitDepth.toLocaleString()} ppm</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">T_eq: </span>
                          <strong className="text-slate-200">{planet.equilibriumTemp} K</strong>
                        </div>
                        <div>
                          <span className="text-slate-500">ML Match: </span>
                          <strong className="text-emerald-400">{(planet.mlConfidence * 100).toFixed(0)}%</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onSelectTarget(planet);
                        onJumpToTab('vetting');
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/90 text-cyan-300 hover:bg-cyan-900/70 hover:text-white font-mono-code text-xs font-bold transition-all cursor-pointer"
                    >
                      <span>Load Into Vetting OS</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}

              {matchingPlanets.length === 0 && (
                <div className="col-span-3 rounded-2xl border border-dashed border-slate-800 p-8 text-center font-mono-code text-xs text-slate-500">
                  No direct targets cataloged in current preview partition. Target will be queryable via NASA TAP sync.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono-code text-slate-400 z-10">
          <div>
            Active Focus: <strong className="text-cyan-300">{selectedTarget.name}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-white/[0.1] bg-[#0c1220] text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            Close Chronology
          </button>
        </div>
      </div>
    </div>
  );
};
