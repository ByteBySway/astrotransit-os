import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TabType, TargetPlanet, AstrophysicsVettingResponse, PlanetClassificationType, getPlanetaryClassification } from './types';
import { TARGET_CATALOG, generateTargetFromNasaData } from './data/mockTargets';
import { BASELINE_TARGETS, EARTH_BASELINE, VENUS_BASELINE, MARS_BASELINE, BaselinePlanetKey } from './data/baselineTargets';
import { NavigationDock } from './components/NavigationDock';
import { Header } from './components/Header';
import { VettingTerminal } from './components/vetting/VettingTerminal';
import { OrbitSimulator } from './components/orbit/OrbitSimulator';
import { ArchiveExplorer } from './components/archive/ArchiveExplorer';
import { XAILab } from './components/xai/XAILab';
import { CommandPaletteModal } from './components/modals/CommandPaletteModal';
import { MissionTimelineModal } from './components/modals/MissionTimelineModal';
import { exportCandidateDossierPDF } from './utils/pdfExport';
import { PlanetHero } from './components/PlanetHero';
import { getSpectralTheme } from './utils/spectralTheme';

const INITIAL_CATALOG: TargetPlanet[] = [
  EARTH_BASELINE,
  VENUS_BASELINE,
  MARS_BASELINE,
  ...TARGET_CATALOG,
];

const PLANET_VIDEOS: Record<BaselinePlanetKey, { src: string; poster: string }> = {
  earth: {
    src: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_3ffb4889-c520-432d-8458-038009eb40df.mp4',
    poster: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_508c64b8-a31e-4290-bdfc-1187df70e0a6.png',
  },
  venus: {
    src: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_b211cd74-013b-4dd3-bfd0-64491d8696fa.mp4',
    poster: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_cf55d1d8-7b59-4a64-80da-d72052ae974e.png',
  },
  mars: {
    src: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202422_51eae59a-2459-4c84-907c-cc5edfe5fea7.mp4',
    poster: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260827_202133_0ba6de7c-285d-43dc-b7ab-8c54c73707cb.png',
  },
};

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('vetting');
  const [allTargets, setAllTargets] = useState<TargetPlanet[]>(INITIAL_CATALOG);
  const [activeCategory, setActiveCategory] = useState<PlanetClassificationType>('ALL');
  const [selectedBaseline, setSelectedBaseline] = useState<BaselinePlanetKey>('earth');
  const [selectedTarget, setSelectedTarget] = useState<TargetPlanet>(EARTH_BASELINE);
  
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMissionTimelineOpen, setIsMissionTimelineOpen] = useState(false);
  const [isWorkspaceVisible, setIsWorkspaceVisible] = useState(false);

  const earthVideoRef = useRef<HTMLVideoElement | null>(null);
  const venusVideoRef = useRef<HTMLVideoElement | null>(null);
  const marsVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoMap = {
      earth: earthVideoRef.current,
      venus: venusVideoRef.current,
      mars: marsVideoRef.current,
    };
    const activeVideo = videoMap[selectedBaseline];
    if (activeVideo) {
      activeVideo.play().catch(() => {});
    }
  }, [selectedBaseline]);

  useEffect(() => {
    earthVideoRef.current?.play().catch(() => {});
  }, []);

  const [nasaStatus, setNasaStatus] = useState<{
    status: 'SYNCED' | 'CACHED' | 'FALLBACK' | 'CONNECTING';
    latencyMs: number;
    timestamp: string;
    source: string;
  }>({
    status: 'SYNCED',
    latencyMs: 118,
    timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
    source: 'LIVE_NASA_TAP',
  });

  // Track dynamic scroll progression between Hero and Vetting Terminal
  useEffect(() => {
    const handleScroll = () => {
      setIsWorkspaceVisible(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCategoryChange = useCallback((newCategory: PlanetClassificationType) => {
    setActiveCategory(newCategory);
    if (newCategory !== 'ALL') {
      const matching = allTargets.filter((t) => {
        const cls = getPlanetaryClassification(t.planetRadius);
        return cls.type === newCategory;
      });
      if (matching.length > 0 && !matching.some((t) => t.id === selectedTarget.id)) {
        setSelectedTarget(matching[0]);
      }
    }
  }, [allTargets, selectedTarget.id]);

  // Rotate baseline from Hero planet cutouts
  const handleSelectBaseline = useCallback((planet: BaselinePlanetKey) => {
    setSelectedBaseline(planet);
  }, []);

  // When clicking GET STARTED or bottom chevron:
  // 1. Smoothly scroll down to #vetting-terminal-root
  // 2. Automatically populate Vetting Terminal with the selected planet's baseline parameters
  const handleInitializeTerminal = useCallback(() => {
    const baselineTarget = BASELINE_TARGETS[selectedBaseline];
    if (baselineTarget) {
      setSelectedTarget(baselineTarget);
      setAllTargets((prev) => {
        if (prev.some((t) => t.id === baselineTarget.id)) return prev;
        return [baselineTarget, ...prev];
      });
    }
    setActiveTab('vetting');
    const el = document.getElementById('vetting-terminal-root');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedBaseline]);

  // Navigate directly to a specific tab from Hero navbar
  const handleHeroNavigateToTab = useCallback((tab: TabType) => {
    const baselineTarget = BASELINE_TARGETS[selectedBaseline];
    if (baselineTarget) {
      setSelectedTarget(baselineTarget);
    }
    setActiveTab(tab);
    const el = document.getElementById('vetting-terminal-root');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedBaseline]);

  // Target selection handler
  const handleSelectTarget = useCallback((target: TargetPlanet) => {
    setSelectedTarget(target);
    // If the target is one of the baselines, sync selectedBaseline as well
    const targetIdLower = target.id.toLowerCase();
    if (targetIdLower.includes('earth')) setSelectedBaseline('earth');
    else if (targetIdLower.includes('venus')) setSelectedBaseline('venus');
    else if (targetIdLower.includes('mars')) setSelectedBaseline('mars');
  }, []);

  // NASA TAP Direct Query handler
  const handleSearchNasaTap = useCallback((adqlQuery: string) => {
    setNasaStatus((prev) => ({ ...prev, status: 'CONNECTING' }));
    setTimeout(() => {
      const match = adqlQuery.match(/pl_name\s*(?:ILIKE|=)\s*['"]%?([^'"%]+)%?['"]/i);
      const queryTerm = match ? match[1].trim() : 'Kepler-452b';
      
      const newTarget = generateTargetFromNasaData({
        pl_name: queryTerm,
        pl_orbper: 384.8,
        pl_rade: 1.06,
        st_teff: 5757,
        pl_trandep: 1400,
      }, queryTerm);
      
      setAllTargets((prev) => {
        const exists = prev.some((t) => t.id.toLowerCase() === newTarget.id.toLowerCase());
        if (exists) return prev;
        return [newTarget, ...prev];
      });
      setSelectedTarget(newTarget);
      setActiveTab('vetting');

      setNasaStatus({
        status: 'SYNCED',
        latencyMs: Math.floor(Math.random() * 80) + 85,
        timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
        source: 'LIVE_NASA_TAP',
      });
    }, 600);
  }, []);

  // Quick Action Dispatcher
  const handleRunVettingApi = useCallback(async (target: TargetPlanet): Promise<AstrophysicsVettingResponse | null> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const isTruePlanetary = target.disposition !== 'FALSE POSITIVE' && target.snr > 7.1;
        const confidence = isTruePlanetary 
          ? Math.min(0.994, target.mlConfidence + 0.02)
          : Math.max(0.08, target.mlConfidence - 0.15);

        const response: AstrophysicsVettingResponse = {
          targetId: target.id,
          mlConfidence: confidence,
          disposition: isTruePlanetary ? 'CONFIRMED' : 'FALSE POSITIVE',
          probabilities: {
            exoplanet: isTruePlanetary ? confidence * 100 : 8.4,
            eclipsingBinary: isTruePlanetary ? 2.1 : 89.2,
            stellarNoise: isTruePlanetary ? 0.9 : 2.4,
          },
          falsePositiveChecks: {
            oddEvenPass: target.oddEvenRatio >= 0.98 && target.oddEvenRatio <= 1.02,
            secondaryEclipsePass: target.secondaryEclipseDepth < 10,
            stellarDensityPass: true,
            centroidShiftPass: target.centroidOffset < 0.2,
            ephemerisMatchPass: true,
          },
          scientificVerdict: isTruePlanetary
            ? `Analytical Mandel-Agol fit yields planetary radius R_p = ${target.planetRadius.toFixed(2)} R⊕. No significant centroid offset or secondary eclipse detected. High scientific priority.`
            : `Vetting diagnostic flagged deep secondary occultation or transit symmetry asymmetry characteristic of background eclipsing binary (BEB). Rejected.`,
        };
        resolve(response);
      }, 750);
    });
  }, []);

  const spectralTheme = getSpectralTheme(selectedTarget.stellarParams?.spectralType);

  return (
    <div
      className="min-h-screen bg-transparent text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-900 relative"
      style={{
        '--spectral-aura': spectralTheme.auraGlow,
        '--spectral-border': spectralTheme.borderGlow,
        '--spectral-accent': spectralTheme.accentHex,
      } as React.CSSProperties}
    >
      {/* 1. Dynamic Cinematic Space Background (Behind Everything) */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden select-none"
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
        aria-hidden="true"
      >
        {(['earth', 'venus', 'mars'] as BaselinePlanetKey[]).map((planetKey) => {
          const videoRef =
            planetKey === 'earth'
              ? earthVideoRef
              : planetKey === 'venus'
              ? venusVideoRef
              : marsVideoRef;
          const isActive = selectedBaseline === planetKey;
          return (
            <video
              key={planetKey}
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              src={PLANET_VIDEOS[planetKey].src}
              poster={PLANET_VIDEOS[planetKey].poster}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            />
          );
        })}

        {/* Pure cosmic obsidian vignette scrim over the video so telemetry text stays 100% crisp and legible */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background:
              'radial-gradient(circle at 50% 40%, rgba(2, 6, 18, 0.45) 0%, rgba(2, 4, 9, 0.92) 85%)',
          }}
        />
      </div>

      {/* 2. Cinematic Astronomy Hero at the very top */}
      <PlanetHero
        selectedPlanet={selectedBaseline}
        onSelectPlanet={handleSelectBaseline}
        onGetStarted={handleInitializeTerminal}
      />

      {/* 3. Full AstroTransit OS Vetting Terminal Workspace */}
      <div
        id="vetting-terminal-root"
        className="min-h-screen flex relative overflow-x-hidden z-10"
      >
        {/* Left-Hand Vertical Dock Navigation (AstroPlus Luxury Style) */}
        <NavigationDock
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenMissionTimeline={() => setIsMissionTimelineOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          nasaStatus={nasaStatus}
          className={`transition-all duration-300 ${
            isWorkspaceVisible
              ? 'translate-x-0 opacity-100 pointer-events-auto'
              : '-translate-x-full md:-translate-x-full opacity-0 pointer-events-none'
          }`}
        />

        {/* Main OS Content Canvas (Padded for Left Navigation Dock) */}
        <div className="flex-1 flex flex-col min-w-0 pl-16 sm:pl-20 md:pl-64 relative z-10">
          {/* Top Control Bar & Universal Galactic Search */}
          <div className="p-3 sm:p-5 pb-0">
            <Header
              activeTab={activeTab}
              onTabChange={setActiveTab}
              selectedTarget={selectedTarget}
              onSelectTarget={handleSelectTarget}
              allTargets={allTargets}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              onOpenMissionTimeline={() => setIsMissionTimelineOpen(true)}
              nasaStatus={nasaStatus}
              onSearchNasaTap={handleSearchNasaTap}
              selectedBaseline={selectedBaseline}
              onSelectBaseline={handleSelectBaseline}
            />
          </div>

          {/* Dynamic Workspace Module Container */}
          <main className="flex-1 w-full max-w-[1600px] mx-auto p-3 sm:p-5">
            {activeTab === 'vetting' && (
              <VettingTerminal
                selectedTarget={selectedTarget}
                onSelectTarget={handleSelectTarget}
                allTargets={allTargets}
                activeCategory={activeCategory}
                onRunVettingApi={handleRunVettingApi}
              />
            )}

            {activeTab === 'orbit' && (
              <OrbitSimulator
                selectedTarget={selectedTarget}
                onSelectTarget={handleSelectTarget}
                allTargets={allTargets}
              />
            )}

            {activeTab === 'archive' && (
              <ArchiveExplorer
                allTargets={allTargets}
                selectedTarget={selectedTarget}
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                onSelectTarget={handleSelectTarget}
                onJumpToVetting={(target) => {
                  handleSelectTarget(target);
                  setActiveTab('vetting');
                }}
              />
            )}

            {activeTab === 'xai' && (
              <XAILab selectedTarget={selectedTarget} />
            )}
          </main>
        </div>
      </div>

      {/* Discover by Mission Epoch Modal (AISTARS Chronology) */}
      <MissionTimelineModal
        isOpen={isMissionTimelineOpen}
        onClose={() => setIsMissionTimelineOpen(false)}
        allTargets={allTargets}
        onSelectTarget={(target) => {
          handleSelectTarget(target);
          setActiveTab('vetting');
          const el = document.getElementById('vetting-terminal-root');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Universal Command Palette (Cmd + K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        allTargets={allTargets}
        onSelectTarget={(target) => {
          handleSelectTarget(target);
          setActiveTab('vetting');
          const el = document.getElementById('vetting-terminal-root');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onSwitchTab={(tab) => {
          setActiveTab(tab);
          const el = document.getElementById('vetting-terminal-root');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onExportPdf={() => {
          exportCandidateDossierPDF(selectedTarget);
        }}
        onRunVetting={() => {
          handleRunVettingApi(selectedTarget);
        }}
      />
    </div>
  );
}

export default App;
