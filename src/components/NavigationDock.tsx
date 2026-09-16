import React from 'react';
import { TabType } from '../types';
import { 
  Terminal, 
  Orbit, 
  Database, 
  BrainCircuit, 
  Telescope, 
  Search, 
  Sparkles,
  Radio
} from 'lucide-react';
import { MissionBadge } from './MissionBadge';
import { AudioEngine, HapticEngine } from '../utils/feedbackEngine';

interface NavigationDockProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenMissionTimeline: () => void;
  onOpenCommandPalette: () => void;
  nasaStatus: {
    status: 'SYNCED' | 'CACHED' | 'FALLBACK' | 'CONNECTING';
    latencyMs: number;
    timestamp: string;
    source: string;
  };
  className?: string;
}

export const NavigationDock: React.FC<NavigationDockProps> = ({
  activeTab,
  onTabChange,
  onOpenMissionTimeline,
  onOpenCommandPalette,
  nasaStatus,
  className = '',
}) => {
  const navItems = [
    {
      id: 'vetting' as TabType,
      label: 'Vetting Terminal',
      shortKey: '>_',
      icon: Terminal,
      description: '1D-CNN VetEngine & Photometry',
    },
    {
      id: 'orbit' as TabType,
      label: 'Orbit Sim 3D',
      shortKey: '3D',
      icon: Orbit,
      description: 'Habitable Zone Orbital Dynamics',
    },
    {
      id: 'archive' as TabType,
      label: 'MAST Catalog Archive',
      shortKey: 'DB',
      icon: Database,
      description: 'ADQL Multi-Mission Query Engine',
    },
    {
      id: 'xai' as TabType,
      label: 'XAI Latent Lab',
      shortKey: 'AI',
      icon: BrainCircuit,
      description: 'Integrated Gradients & UMAP Latent Space',
    },
  ];

  return (
    <aside 
      id="left-navigation-dock"
      className={`fixed left-0 top-0 bottom-0 w-16 sm:w-20 md:w-64 z-40 flex flex-col justify-between cosmic-glass p-3 transition-all duration-300 select-none ${className}`}
    >
      {/* Top OS Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-2 py-3 border-b border-cyan-500/20">
          <MissionBadge size={36} className="shrink-0" />

          <div className="hidden md:block">
            <div className="font-display text-base font-black tracking-widest text-white uppercase glow-cyan flex items-center gap-1.5">
              <span>ASTROTRANSIT</span>
              <span className="text-[#00f0ff] font-normal drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">OS</span>
            </div>
            <div className="text-[10px] font-mono-code text-cyan-400 tracking-tight">
              AstroPlus • NASA Ames Lab
            </div>
          </div>
        </div>

        {/* Primary Navigation Pills */}
        <nav className="mt-4 space-y-1.5 font-mono-code text-xs">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`dock-nav-${item.id}`}
                onClick={() => {
                  AudioEngine.playWoosh();
                  HapticEngine.lightTap();
                  onTabChange(item.id);
                }}
                className={`w-full group relative flex items-center gap-3 px-2.5 py-3 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#00f0ff] bg-cyan-950/80 text-cyan-200 shadow-[0_0_18px_rgba(0,240,255,0.45),inset_0_0_12px_rgba(0,240,255,0.2)] font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] hover:border-cyan-500/20'
                }`}
                title={item.label}
              >
                {/* Active Left Indicator Bar with Electric Cyan Drop Shadow */}
                {isActive && (
                  <span 
                    className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-[#00f0ff]"
                    style={{
                      boxShadow: '0 0 10px #00f0ff, 0 0 20px rgba(0, 240, 255, 0.7)',
                    }}
                  />
                )}

                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all ${
                  isActive
                    ? 'bg-cyan-500/25 text-[#00f0ff] border border-[#00f0ff]/60 shadow-[0_0_12px_rgba(0,240,255,0.5)]'
                    : 'bg-white/[0.03] text-slate-400 group-hover:text-cyan-300 group-hover:bg-cyan-950/40'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="hidden md:flex flex-col text-left truncate">
                  <span className={`text-xs tracking-wide leading-tight ${isActive ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans truncate">
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Utility & Mission Chronology Tools */}
      <div className="space-y-2 border-t border-cyan-500/20 pt-3">
        {/* Discover by Mission Epoch (AISTARS Feature) */}
        <button
          id="btn-mission-epochs-dock"
          onClick={() => {
            AudioEngine.playClick();
            HapticEngine.lightTap();
            onOpenMissionTimeline();
          }}
          className="w-full flex items-center gap-2.5 p-2 rounded-2xl border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 transition-all cursor-pointer shadow-md group"
          title="Discover by Mission Epoch (Kepler 2009, K2 2014, TESS 2018, Roman 2027)"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-900/60 border border-purple-400/40 text-purple-200">
            <Telescope className="h-4 w-4 group-hover:rotate-12 transition-transform" />
          </div>
          <div className="hidden md:flex flex-col text-left truncate">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <span>Mission Epochs</span>
              <Sparkles className="h-2.5 w-2.5 text-purple-400" />
            </span>
            <span className="text-[9px] font-mono-code text-purple-300/80">
              Kepler • K2 • TESS • JWST
            </span>
          </div>
        </button>

        {/* Global Quick Search Modal Trigger */}
        <button
          id="btn-quick-search-dock"
          onClick={() => {
            AudioEngine.playClick();
            HapticEngine.lightTap();
            onOpenCommandPalette();
          }}
          className="w-full flex items-center justify-between p-2 rounded-2xl border border-cyan-500/20 bg-[#040914]/85 hover:border-cyan-400/50 text-slate-300 hover:text-white transition-all cursor-pointer font-mono-code text-xs shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-[#00f0ff]" />
            <span className="hidden md:inline text-[11px] text-slate-200">Command Palette</span>
          </div>
          <span className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded bg-[#081224] border border-cyan-500/30 text-cyan-300 font-bold">
            ⌘K
          </span>
        </button>

        {/* Live NASA TAP Sync Status Pill */}
        <div className="rounded-2xl border border-cyan-500/20 bg-[#040914]/90 p-2.5 font-mono-code text-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${
                nasaStatus.status === 'SYNCED' ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse' : 'bg-[#00f0ff]'
              }`} />
              <span className="hidden md:inline text-slate-200 font-bold">NASA TAP</span>
            </div>
            <span className="text-[#00f0ff] font-bold drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]">{nasaStatus.latencyMs}ms</span>
          </div>
          <div className="hidden md:block text-[9px] text-slate-400 mt-1 truncate">
            {nasaStatus.source}
          </div>
        </div>
      </div>
    </aside>
  );
};
