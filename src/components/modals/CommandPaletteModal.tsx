import React, { useState, useEffect } from 'react';
import { TargetPlanet, TabType } from '../../types';
import { 
  Search, 
  Terminal, 
  Orbit, 
  Database, 
  BrainCircuit, 
  Sparkles, 
  FileText, 
  Download, 
  X, 
  Zap,
  Radio,
  Sliders
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  allTargets: TargetPlanet[];
  selectedTarget: TargetPlanet;
  onSelectTarget: (target: TargetPlanet) => void;
  onTabChange: (tab: TabType) => void;
  onRunVetting: () => void;
  onExportPDF: () => void;
  onSearchNasaTap: (query: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  allTargets,
  selectedTarget,
  onSelectTarget,
  onTabChange,
  onRunVetting,
  onExportPDF,
  onSearchNasaTap,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or toggle
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const qLower = query.toLowerCase();

  const filteredTargets = allTargets.filter(
    (t) =>
      t.id.toLowerCase().includes(qLower) ||
      t.name.toLowerCase().includes(qLower) ||
      t.systemName.toLowerCase().includes(qLower) ||
      t.disposition.toLowerCase().includes(qLower)
  );

  const actions = [
    {
      id: 'tab-vetting',
      title: 'Switch to Photometric Vetting Terminal',
      category: 'Navigation',
      icon: <Terminal className="h-4 w-4 text-cyan-400" />,
      run: () => {
        onTabChange('vetting');
        onClose();
      },
    },
    {
      id: 'tab-orbit',
      title: 'Switch to 3D Habitable Zone Orbit Simulator',
      category: 'Navigation',
      icon: <Orbit className="h-4 w-4 text-cyan-400" />,
      run: () => {
        onTabChange('orbit');
        onClose();
      },
    },
    {
      id: 'tab-archive',
      title: 'Switch to MAST / NASA Archive Explorer',
      category: 'Navigation',
      icon: <Database className="h-4 w-4 text-cyan-400" />,
      run: () => {
        onTabChange('archive');
        onClose();
      },
    },
    {
      id: 'tab-xai',
      title: 'Switch to Explainable AI (XAI) Diagnostic Lab',
      category: 'Navigation',
      icon: <BrainCircuit className="h-4 w-4 text-cyan-400" />,
      run: () => {
        onTabChange('xai');
        onClose();
      },
    },
    {
      id: 'action-vet',
      title: `Run AI Physics Vetting on ${selectedTarget.name}`,
      category: 'Astrophysics Engine',
      icon: <Zap className="h-4 w-4 text-emerald-400" />,
      run: () => {
        onRunVetting();
        onClose();
      },
    },
    {
      id: 'action-pdf',
      title: `Export Candidate Dossier (PDF) for ${selectedTarget.id}`,
      category: 'Reports & Export',
      icon: <FileText className="h-4 w-4 text-amber-400" />,
      run: () => {
        onExportPDF();
        onClose();
      },
    },
    {
      id: 'action-nasa',
      title: `Query NASA TAP API: "${query || selectedTarget.name}"`,
      category: 'NASA TAP Synchronization',
      icon: <Radio className="h-4 w-4 text-blue-400" />,
      run: () => {
        onSearchNasaTap(query || selectedTarget.name);
        onClose();
      },
    },
  ].filter((a) => a.title.toLowerCase().includes(qLower) || a.category.toLowerCase().includes(qLower));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-cyan-500/40 bg-[#070d1a] shadow-2xl shadow-cyan-950/80 overflow-hidden font-mono-code">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-[#091224]/80">
          <Search className="h-5 w-5 text-cyan-400 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type target name (e.g. TRAPPIST-1e, Kepler-186f), command, or NASA TAP query..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
          <kbd className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 mr-2">
            ESC
          </kbd>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Actions Section */}
          {actions.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                Quick Actions &amp; Workspaces
              </div>
              <div className="mt-1 space-y-1">
                {actions.map((act) => (
                  <button
                    key={act.id}
                    onClick={act.run}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs text-slate-200 hover:bg-cyan-950/50 hover:text-cyan-300 hover:border hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      {act.icon}
                      <span>{act.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800">
                      {act.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Targets Section */}
          <div>
            <div className="px-2.5 py-1 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              Planetary Targets &amp; Candidates ({filteredTargets.length})
            </div>
            <div className="mt-1 space-y-1">
              {filteredTargets.map((target) => (
                <button
                  key={target.id}
                  onClick={() => {
                    onSelectTarget(target);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                    selectedTarget.id === target.id
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-semibold'
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="font-bold">{target.name}</span>
                    <span className="text-slate-400 text-[11px]">({target.id})</span>
                    <span className="text-slate-400 text-[11px] hidden sm:inline">P: {target.orbitalPeriod.toFixed(2)}d</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
                        target.disposition === 'CONFIRMED'
                          ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                          : target.disposition === 'FALSE POSITIVE'
                          ? 'border-rose-500/40 bg-rose-950/40 text-rose-300'
                          : 'border-cyan-500/40 bg-cyan-950/40 text-cyan-300'
                      }`}
                    >
                      {target.disposition}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {(target.mlConfidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </button>
              ))}

              {filteredTargets.length === 0 && (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  No local targets matched. Press{' '}
                  <button
                    onClick={() => {
                      onSearchNasaTap(query);
                      onClose();
                    }}
                    className="text-cyan-400 underline font-bold"
                  >
                    Query NASA TAP API for &quot;{query}&quot;
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#050a14] border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div className="text-cyan-400">AstroTransit OS Command Suite</div>
        </div>
      </div>
    </div>
  );
};
