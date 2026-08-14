import React, { useState, useEffect, useCallback } from 'react';
import { TabType, TargetPlanet, AstrophysicsVettingResponse, PlanetClassificationType, getPlanetaryClassification } from './types';
import { TARGET_CATALOG, generateTargetFromNasaData } from './data/mockTargets';
import { NavigationDock } from './components/NavigationDock';
import { Header } from './components/Header';
import { VettingTerminal } from './components/vetting/VettingTerminal';
import { OrbitSimulator } from './components/orbit/OrbitSimulator';
import { ArchiveExplorer } from './components/archive/ArchiveExplorer';
import { XAILab } from './components/xai/XAILab';
import { VettingJsonModal } from './components/modals/VettingJsonModal';
import { CommandPaletteModal } from './components/modals/CommandPaletteModal';
import { MissionTimelineModal } from './components/modals/MissionTimelineModal';
import { exportCandidateDossierPDF } from './utils/pdfExport';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('vetting');
  const [allTargets, setAllTargets] = useState<TargetPlanet[]>(TARGET_CATALOG);
  const [activeCategory, setActiveCategory] = useState<PlanetClassificationType>('ALL');
  const [selectedTarget, setSelectedTarget] = useState<TargetPlanet>(
    TARGET_CATALOG.find((t) => t.id === 'Kepler-90i') || TARGET_CATALOG[0]
  );
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMissionTimelineOpen, setIsMissionTimelineOpen] = useState(false);
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

  const handleCategoryChange = useCallback((newCategory: PlanetClassificationType) => {
    setActiveCategory(newCategory);
    if (newCategory !== 'ALL') {
      const matching = allTargets.filter((t) => {
        const cls = getPlanetaryClassification(t.planetRadius);
        return cls.type === newCategory;
      });
      if (matching.length > 0) {
        setSelectedTarget(matching[0]);
      }
    }
  }, [allTargets]);

  // Global Ctrl+K / Cmd+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch initial targets from backend
  useEffect(() => {
    const t0 = performance.now();
    fetch('/api/targets')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const latency = Math.round(performance.now() - t0);
        if (data && Array.isArray(data) && data.length > 0) {
          setAllTargets(data);
          setNasaStatus({
            status: 'SYNCED',
            latencyMs: latency,
            timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
            source: 'LIVE_NASA_TAP',
          });
        }
      })
      .catch((err) => {
        console.log('Using local catalog dataset fallback:', err);
        setNasaStatus({
          status: 'CACHED',
          latencyMs: 12,
          timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
          source: 'LOCAL_STANDARDS',
        });
      });
  }, []);

  // Search NASA TAP Endpoint with latency tracking & fallback
  const handleSearchNasaTap = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setNasaStatus((prev) => ({ ...prev, status: 'CONNECTING' }));
    const t0 = performance.now();

    try {
      const res = await fetch(`/api/nasa-tap?target=${encodeURIComponent(query)}`);
      const latency = Math.round(performance.now() - t0);

      if (res.ok) {
        const json = await res.json();
        if (json && json.data && json.data.length > 0) {
          const rawPlanet = json.data[0];
          const newTarget = generateTargetFromNasaData(rawPlanet, query);

          setAllTargets((prev) => {
            const exists = prev.find((t) => t.id === newTarget.id || t.name === newTarget.name);
            if (exists) return prev;
            return [newTarget, ...prev];
          });

          setSelectedTarget(newTarget);
          setNasaStatus({
            status: json.source === 'NASA_TAP_SYNC' ? 'SYNCED' : 'FALLBACK',
            latencyMs: latency,
            timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
            source: json.source || 'LIVE_NASA_TAP',
          });
          return;
        }
      }

      // Check existing catalog
      const match = allTargets.find(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.id.toLowerCase().includes(query.toLowerCase())
      );
      if (match) {
        setSelectedTarget(match);
        setNasaStatus({
          status: 'CACHED',
          latencyMs: latency,
          timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
          source: 'LOCAL_CATALOG',
        });
      }
    } catch (err) {
      console.error('NASA TAP Query error:', err);
      const match = allTargets.find(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.id.toLowerCase().includes(query.toLowerCase())
      );
      if (match) {
        setSelectedTarget(match);
      }
      setNasaStatus({
        status: 'FALLBACK',
        latencyMs: Math.round(performance.now() - t0),
        timestamp: new Date().toISOString().slice(11, 19) + ' UTC',
        source: 'VERIFIED_CONSTANTS',
      });
    }
  }, [allTargets]);

  // Invokes the Core Astrophysics Vetting API
  const handleRunVettingApi = async (target: TargetPlanet): Promise<AstrophysicsVettingResponse | null> => {
    try {
      const response = await fetch('/api/vet-transit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: target.id,
          orbitalPeriod: target.orbitalPeriod,
          transitDepth: target.transitDepth,
          planetRadius: target.planetRadius,
          oddEvenRatio: target.oddEvenRatio,
          secondaryEclipseDepth: target.secondaryEclipseDepth,
          centroidOffset: target.centroidOffset,
          snr: target.snr,
          stellarParams: target.stellarParams,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data: AstrophysicsVettingResponse = await response.json();
      return data;
    } catch (err) {
      console.error('Error invoking /api/vet-transit:', err);
      return null;
    }
  };

  const handleExportPDF = () => {
    exportCandidateDossierPDF(selectedTarget, null);
  };

  return (
    <div className="min-h-screen bg-[#05070D] text-slate-100 flex font-sans selection:bg-cyan-500 selection:text-slate-900 relative overflow-x-hidden">
      {/* AstroPlus Luxury Cosmic Flares */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        {/* Subtle Violet Top-Left Ambient Flare */}
        <div className="absolute -top-40 -left-40 w-[650px] h-[650px] rounded-full bg-purple-600/10 blur-[130px]" />
        {/* Electric Cyan Bottom-Right Ambient Flare */}
        <div className="absolute -bottom-40 -right-40 w-[650px] h-[650px] rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      {/* Left-Hand Vertical Dock Navigation (AstroPlus Luxury Style) */}
      <NavigationDock
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenJsonModal={() => setIsJsonModalOpen(true)}
        onOpenMissionTimeline={() => setIsMissionTimelineOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        nasaStatus={nasaStatus}
      />

      {/* Main OS Content Canvas (Padded for Left Navigation Dock) */}
      <div className="flex-1 flex flex-col min-w-0 pl-16 sm:pl-20 md:pl-64 relative z-10">
        {/* Top Control Bar & Universal Galactic Search */}
        <div className="p-3 sm:p-5 pb-0">
          <Header
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedTarget={selectedTarget}
            onSelectTarget={setSelectedTarget}
            allTargets={allTargets}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            onOpenJsonModal={() => setIsJsonModalOpen(true)}
            onOpenMissionTimeline={() => setIsMissionTimelineOpen(true)}
            nasaStatus={nasaStatus}
            onSearchNasaTap={handleSearchNasaTap}
          />
        </div>

        {/* Dynamic Workspace Module Container */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-3 sm:p-5">
          {activeTab === 'vetting' && (
            <VettingTerminal
              selectedTarget={selectedTarget}
              onSelectTarget={setSelectedTarget}
              allTargets={allTargets}
              activeCategory={activeCategory}
              onOpenJsonModal={() => setIsJsonModalOpen(true)}
              onRunVettingApi={handleRunVettingApi}
            />
          )}

          {activeTab === 'orbit' && (
            <OrbitSimulator
              selectedTarget={selectedTarget}
              onSelectTarget={setSelectedTarget}
              allTargets={allTargets}
            />
          )}

          {activeTab === 'archive' && (
            <ArchiveExplorer
              allTargets={allTargets}
              selectedTarget={selectedTarget}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              onSelectTarget={setSelectedTarget}
              onJumpToVetting={(target) => {
                setSelectedTarget(target);
                setActiveTab('vetting');
              }}
            />
          )}

          {activeTab === 'xai' && (
            <XAILab selectedTarget={selectedTarget} />
          )}
        </main>
      </div>

      {/* Discover by Mission Epoch Modal (AISTARS Chronology) */}
      <MissionTimelineModal
        isOpen={isMissionTimelineOpen}
        onClose={() => setIsMissionTimelineOpen(false)}
        allTargets={allTargets}
        selectedTarget={selectedTarget}
        onSelectTarget={setSelectedTarget}
        onJumpToTab={setActiveTab}
      />

      {/* Global Command Palette Modal (⌘K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        allTargets={allTargets}
        selectedTarget={selectedTarget}
        onSelectTarget={(t) => {
          setSelectedTarget(t);
        }}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
        onRunVetting={() => {
          setActiveTab('vetting');
        }}
        onExportPDF={handleExportPDF}
        onSearchNasaTap={handleSearchNasaTap}
      />

      {/* Strict Backend JSON Schema Inspector Modal */}
      <VettingJsonModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        target={selectedTarget}
        onRunVetting={handleRunVettingApi}
      />
    </div>
  );
}

export default App;
