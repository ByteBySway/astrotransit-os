import React, { useState, useRef } from 'react';
import { TabType, TargetPlanet, PlanetClassificationType, getPlanetaryClassification } from '../types';
import { 
  Search, 
  Globe, 
  ChevronDown, 
  Sparkles, 
  Layers,
  Filter,
  Check,
  Telescope,
  Compass,
  Volume2,
  VolumeX,
  Settings
} from 'lucide-react';
import { AudioEngine, HapticEngine } from '../utils/feedbackEngine';
import { HapticsSettingsModal } from './modals/HapticsSettingsModal';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  selectedTarget: TargetPlanet;
  onSelectTarget: (target: TargetPlanet) => void;
  allTargets: TargetPlanet[];
  activeCategory: PlanetClassificationType;
  onCategoryChange: (cat: PlanetClassificationType) => void;
  onOpenJsonModal: () => void;
  onOpenMissionTimeline?: () => void;
  nasaStatus?: {
    status: 'SYNCED' | 'CACHED' | 'FALLBACK' | 'CONNECTING';
    latencyMs: number;
    timestamp: string;
    source: string;
  };
  onSearchNasaTap?: (query: string) => void;
}

const CATEGORY_OPTIONS: { type: PlanetClassificationType; label: string; range: string; badge: string; color: string }[] = [
  { type: 'ALL', label: 'All Classes', range: 'Complete Catalog', badge: 'ALL', color: 'text-slate-300' },
  { type: 'TERRESTRIAL', label: 'Terrestrial / Earth-like', range: 'Rp < 1.25 R⊕', badge: 'TERRESTRIAL', color: 'text-emerald-400' },
  { type: 'SUPER_EARTH', label: 'Super-Earth', range: '1.25 R⊕ ≤ Rp < 2.0 R⊕', badge: 'SUPER-EARTH', color: 'text-cyan-400' },
  { type: 'NEPTUNIAN', label: 'Neptunian / Sub-Neptune', range: '2.0 R⊕ ≤ Rp < 6.0 R⊕', badge: 'SUB-NEPTUNE', color: 'text-blue-400' },
  { type: 'JOVIAN', label: 'Gas Giant / Jovian', range: 'Rp ≥ 6.0 R⊕', badge: 'GAS GIANT', color: 'text-amber-400' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  selectedTarget,
  onSelectTarget,
  allTargets,
  activeCategory,
  onCategoryChange,
  onOpenJsonModal,
  onOpenMissionTimeline,
  nasaStatus = {
    status: 'SYNCED',
    latencyMs: 118,
    timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
    source: 'LIVE_NASA_TAP'
  },
  onSearchNasaTap,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(AudioEngine.getIsMuted());
  const [isHapticsModalOpen, setIsHapticsModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleSfx = () => {
    const nextMuted = !isSfxMuted;
    setIsSfxMuted(nextMuted);
    AudioEngine.setMuted(nextMuted);
    if (!nextMuted) {
      AudioEngine.playClick();
      HapticEngine.lightTap();
    }
  };

  // Filter targets by both active planetary classification and search query
  const categoryFilteredTargets = allTargets.filter((t) => {
    if (activeCategory === 'ALL') return true;
    const classification = getPlanetaryClassification(t.planetRadius);
    return classification.type === activeCategory;
  });

  const matchingTargets = categoryFilteredTargets.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.systemName.toLowerCase().includes(q) ||
      (t.greenhouseAlert && t.greenhouseAlert.toLowerCase().includes(q))
    );
  });

  const activeCategoryObj = CATEGORY_OPTIONS.find((c) => c.type === activeCategory) || CATEGORY_OPTIONS[0];

  const handleTriggerSearch = () => {
    if (searchQuery.trim()) {
      if (onSearchNasaTap) {
        onSearchNasaTap(searchQuery.trim());
      }
    } else {
      setIsSearchOpen((prev) => !prev);
      if (!isSearchOpen && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };

  return (
    <header className="w-full">
      <div className="rounded-2xl border border-white/[0.08] bg-[#0d121e]/80 p-3 sm:p-3.5 shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Target Breadcrumb & Telemetry Anchor */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-950/80 border border-cyan-400/40 text-cyan-400 shadow-md">
              <Compass className="h-4 w-4 animate-spin-slow text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                  {selectedTarget.name}
                </span>
                {(() => {
                  const cls = getPlanetaryClassification(selectedTarget.planetRadius);
                  return (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full border font-mono-code font-bold uppercase ${cls.borderClass} ${cls.bgClass} ${cls.colorClass}`}>
                      {cls.badgeLabel.replace('CLASS: ', '')}
                    </span>
                  );
                })()}
              </div>
              <div className="text-[10px] font-mono-code text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                {selectedTarget.systemName}
              </div>
            </div>
          </div>

          {/* NASA TAP Live Network Status Indicator */}
          <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-white/[0.08] text-[11px] font-mono-code">
            <span
              className={`flex h-2 w-2 rounded-full ${
                nasaStatus.status === 'SYNCED'
                  ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400'
                  : nasaStatus.status === 'CACHED'
                  ? 'bg-amber-400'
                  : 'bg-cyan-400'
              }`}
            />
            <span className="text-slate-300 font-semibold">
              ● NASA TAP: <span className="text-emerald-400">{nasaStatus.status}</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-400 font-bold">{nasaStatus.latencyMs} ms</span>
          </div>

          {/* Audio Synthesizer Toggle */}
          <button
            id="btn-header-sfx-toggle"
            onClick={toggleSfx}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono-code transition-all cursor-pointer shadow-sm ${
              !isSfxMuted
                ? 'border-cyan-400/50 bg-cyan-950/70 text-cyan-300 shadow-cyan-900/30'
                : 'border-slate-800 bg-slate-900/50 text-slate-500 hover:text-slate-300'
            }`}
            title={!isSfxMuted ? 'Mute Interface SFX & Haptics' : 'Unmute Procedural Audio SFX & Haptics'}
          >
            {!isSfxMuted ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                <span className="hidden sm:inline font-bold">SFX ON</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden sm:inline font-medium">SFX OFF</span>
              </>
            )}
          </button>

          {/* Haptics & Feedback Settings Modal Trigger */}
          <button
            id="btn-header-haptics-settings"
            onClick={() => {
              setIsHapticsModalOpen(true);
              AudioEngine.playClick();
              HapticEngine.lightTap();
            }}
            className="flex items-center justify-center p-1.5 rounded-xl border border-white/[0.08] bg-[#070b16] hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300 transition-all cursor-pointer"
            title="Haptics & Procedural Audio Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        {/* Right Tools: Discover by Mission Epoch, Category Filter, Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Discover by Mission Epoch (AISTARS Style) */}
          {onOpenMissionTimeline && (
            <button
              id="header-btn-mission-timeline"
              onClick={() => {
                AudioEngine.playClick();
                HapticEngine.lightTap();
                onOpenMissionTimeline();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/40 bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 text-xs font-mono-code transition-all shadow-sm cursor-pointer group"
              title="Discover exoplanets by mission epoch (Kepler, K2, TESS, JWST, Roman)"
            >
              <Telescope className="h-3.5 w-3.5 text-purple-300 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline font-bold">Mission Epochs</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900/70 border border-purple-400/30 text-purple-200">
                2009–2027
              </span>
            </button>
          )}

          {/* Planetary Classification Quick-Filter Dropdown */}
          <div className="relative">
            <button
              id="btn-category-dropdown"
              onClick={() => {
                AudioEngine.playClick();
                HapticEngine.lightTap();
                setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                setIsSearchOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/[0.08] bg-[#070b16] hover:border-cyan-500/50 text-slate-200 text-xs font-mono-code transition-all shadow-sm cursor-pointer"
              title="Filter catalog by planetary classification"
            >
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden md:inline text-slate-400">Class:</span>
              <span className={`font-bold ${activeCategoryObj.color}`}>{activeCategoryObj.badge}</span>
              <ChevronDown className="h-3 w-3 text-slate-400 ml-0.5" />
            </button>

            {isCategoryDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsCategoryDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 z-30 w-72 rounded-2xl border border-white/[0.1] bg-[#070b16]/98 p-2.5 shadow-2xl font-mono-code text-xs backdrop-blur-2xl">
                  <div className="px-2 py-1.5 text-[10px] text-slate-400 uppercase tracking-wider border-b border-white/[0.08] mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Filter className="h-3 w-3 text-cyan-400" />
                      Planetary Radius Class
                    </span>
                    <span className="text-cyan-400 text-[10px]">{allTargets.length} targets</span>
                  </div>

                  <div className="space-y-1">
                    {CATEGORY_OPTIONS.map((opt) => {
                      const isSelected = activeCategory === opt.type;
                      return (
                        <button
                          key={opt.type}
                          id={`cat-opt-${opt.type}`}
                          onClick={() => {
                            AudioEngine.playClick();
                            HapticEngine.lightTap();
                            onCategoryChange(opt.type);
                            setIsCategoryDropdownOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/40'
                              : 'text-slate-300 hover:bg-white/[0.04] hover:text-white'
                          }`}
                        >
                          <div>
                            <div className="font-semibold flex items-center gap-1.5">
                              <span className={opt.color}>{opt.label}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">{opt.range}</div>
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Universal Target Search Input with Autocomplete & Radius Circles */}
          <div className="relative">
            <div className="flex items-center rounded-xl border border-white/[0.08] bg-[#070b16] pl-2.5 pr-1 py-1 text-xs text-slate-300 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-500/40 shadow-inner">
              <Search className="mr-1.5 h-3.5 w-3.5 text-slate-400 shrink-0" />
              <input
                ref={searchInputRef}
                id="header-target-search"
                type="text"
                value={searchQuery}
                onFocus={() => {
                  setIsSearchOpen(true);
                  setIsCategoryDropdownOpen(false);
                }}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                  HapticEngine.selectionTick();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (searchQuery.trim() && onSearchNasaTap) {
                      AudioEngine.playClick();
                      HapticEngine.lightTap();
                      onSearchNasaTap(searchQuery.trim());
                      setIsSearchOpen(false);
                    } else if (matchingTargets.length > 0) {
                      AudioEngine.playClick();
                      HapticEngine.lightTap();
                      onSelectTarget(matchingTargets[0]);
                      setIsSearchOpen(false);
                    }
                  }
                }}
                placeholder="Search Exoplanet..."
                className="w-24 sm:w-36 md:w-44 bg-transparent font-mono-code text-xs text-slate-200 placeholder-slate-500 outline-none"
              />

              {/* Glowing [ Search ] Action Trigger Button */}
              <button
                id="btn-active-search-trigger"
                onClick={() => {
                  AudioEngine.playClick();
                  HapticEngine.lightTap();
                  handleTriggerSearch();
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/60 text-cyan-300 hover:text-white font-mono-code font-bold text-[11px] transition-all shadow-sm cursor-pointer"
                title="Execute Search / Query Target"
              >
                <span>Search</span>
              </button>
            </div>

            {/* Universal Galactic Autocomplete Dropdown with Scaled Radius Indicators */}
            {isSearchOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setIsSearchOpen(false)}
                />
                <div className="absolute right-0 mt-2 z-30 w-80 sm:w-96 max-h-96 overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#070b16]/98 p-2.5 shadow-2xl font-mono-code text-xs backdrop-blur-2xl">
                  <div className="flex items-center justify-between px-2 py-1.5 text-[10px] text-slate-400 uppercase tracking-wider border-b border-white/[0.08] mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-cyan-400" />
                      Galactic Exoplanet Index ({matchingTargets.length})
                    </span>
                    <span className="text-cyan-400">Click to Synchronize</span>
                  </div>

                  {matchingTargets.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs">
                      No local target match for &quot;{searchQuery}&quot;.
                      {searchQuery.trim() && (
                        <div className="mt-1 text-[11px] text-cyan-300">
                          Query live NASA Exoplanet Archive below:
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {matchingTargets.map((target) => {
                        const classification = getPlanetaryClassification(target.planetRadius);
                        const isSelected = selectedTarget.id === target.id;
                        
                        // Scaled visual circle indicator for planet radius
                        const circleSize = Math.max(10, Math.min(24, Math.round(target.planetRadius * 7)));

                        return (
                          <button
                            key={target.id}
                            id={`autocomplete-item-${target.id}`}
                            onClick={() => {
                              AudioEngine.playClick();
                              HapticEngine.lightTap();
                              onSelectTarget(target);
                              setIsSearchOpen(false);
                              setSearchQuery('');
                            }}
                            className={`w-full text-left px-2.5 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-400/50 shadow-md'
                                : 'text-slate-300 hover:bg-white/[0.05] hover:text-white border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {/* Visual Radius Circle */}
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                                <div
                                  className={`rounded-full border border-white/40 shadow-sm ${
                                    classification.type === 'TERRESTRIAL'
                                      ? 'bg-emerald-500/80 shadow-emerald-500/40'
                                      : classification.type === 'SUPER_EARTH'
                                      ? 'bg-cyan-500/80 shadow-cyan-500/40'
                                      : classification.type === 'NEPTUNIAN'
                                      ? 'bg-blue-500/80 shadow-blue-500/40'
                                      : 'bg-amber-500/80 shadow-amber-500/40'
                                  }`}
                                  style={{ width: `${circleSize}px`, height: `${circleSize}px` }}
                                  title={`Visual radius scale: ${target.planetRadius} R⊕`}
                                />
                              </div>

                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-bold text-xs">{target.name}</span>
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${classification.borderClass} ${classification.bgClass} ${classification.colorClass}`}>
                                    {classification.badgeLabel.replace('CLASS: ', '')}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                  <span>P: {target.orbitalPeriod.toFixed(2)}d</span>
                                  <span>·</span>
                                  <span>Rp: {target.planetRadius.toFixed(2)} R⊕</span>
                                  <span>·</span>
                                  <span>{target.equilibriumTemp} K</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-0.5">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                  target.disposition === 'CONFIRMED' || target.disposition === 'CONFIRMED CANDIDATE'
                                    ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-500/40'
                                    : target.disposition === 'FALSE POSITIVE'
                                    ? 'text-rose-300 bg-rose-950/60 border border-rose-500/40'
                                    : 'text-cyan-300 bg-cyan-950/60 border border-cyan-500/40'
                                }`}
                              >
                                {(target.mlConfidence * 100).toFixed(0)}%
                              </span>
                              <span className="text-[9px] text-slate-500">{target.id}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Direct NASA TAP Query Option */}
                  {searchQuery.trim() && (
                    <button
                      onClick={() => {
                        AudioEngine.playClick();
                        HapticEngine.lightTap();
                        if (onSearchNasaTap) onSearchNasaTap(searchQuery.trim());
                        setIsSearchOpen(false);
                      }}
                      className="w-full mt-2 p-2.5 rounded-xl border border-cyan-500/40 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      <Globe className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Query NASA TAP Archive for &quot;{searchQuery}&quot;</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Haptics & Audio Customization Modal */}
      <HapticsSettingsModal
        isOpen={isHapticsModalOpen}
        onClose={() => setIsHapticsModalOpen(false)}
        isSfxMuted={isSfxMuted}
        onToggleSfx={toggleSfx}
      />
    </header>
  );
};

