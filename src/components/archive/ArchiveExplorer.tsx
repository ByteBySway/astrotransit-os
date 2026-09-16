import React, { useState } from 'react';
import { TargetPlanet, PlanetClassificationType, getPlanetaryClassification } from '../../types';
import { AudioEngine, HapticEngine } from '../../utils/feedbackEngine';
import { 
  Database, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  CheckSquare, 
  Square, 
  ExternalLink,
  Play,
  Sparkles,
  RefreshCw,
  Layers
} from 'lucide-react';

interface ArchiveExplorerProps {
  allTargets: TargetPlanet[];
  selectedTarget: TargetPlanet;
  activeCategory?: PlanetClassificationType;
  onCategoryChange?: (cat: PlanetClassificationType) => void;
  onSelectTarget: (target: TargetPlanet) => void;
  onJumpToVetting: (target: TargetPlanet) => void;
}

export const ArchiveExplorer: React.FC<ArchiveExplorerProps> = ({
  allTargets,
  selectedTarget,
  activeCategory = 'ALL',
  onCategoryChange,
  onSelectTarget,
  onJumpToVetting,
}) => {
  const [adqlQuery, setAdqlQuery] = useState('SELECT * FROM kepler_koi WHERE snr > 10.0 AND pradius < 3.0');
  const [filterDisposition, setFilterDisposition] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [sortField, setSortField] = useState<'id' | 'period' | 'depth' | 'radius' | 'snr' | 'confidence'>('confidence');
  const [sortAsc, setSortAsc] = useState(false);

  // Filter & Search Logic
  const filteredList = allTargets.filter((target) => {
    if (filterDisposition !== 'ALL' && target.disposition !== filterDisposition) {
      return false;
    }
    if (activeCategory !== 'ALL') {
      const cls = getPlanetaryClassification(target.planetRadius);
      if (cls.type !== activeCategory) return false;
    }
    if (searchFilter) {
      const match =
        target.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
        target.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        target.systemName.toLowerCase().includes(searchFilter.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  // Sort
  const sortedList = [...filteredList].sort((a, b) => {
    let vA = 0;
    let vB = 0;
    if (sortField === 'id') return sortAsc ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
    if (sortField === 'period') { vA = a.orbitalPeriod; vB = b.orbitalPeriod; }
    if (sortField === 'depth') { vA = a.transitDepth; vB = b.transitDepth; }
    if (sortField === 'radius') { vA = a.planetRadius; vB = b.planetRadius; }
    if (sortField === 'snr') { vA = a.snr; vB = b.snr; }
    if (sortField === 'confidence') { vA = a.mlConfidence; vB = b.mlConfidence; }

    return sortAsc ? vA - vB : vB - vA;
  });

  const handleExecuteADQL = () => {
    AudioEngine.playDiagnosticScan();
    HapticEngine.selectionTick();
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      AudioEngine.playConfirmedChime();
      HapticEngine.lightTap();
    }, 350);
  };

  const handleToggleSelectAll = () => {
    AudioEngine.playClick();
    HapticEngine.selectionTick();
    if (selectedRowIds.length === sortedList.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(sortedList.map((t) => t.id));
    }
  };

  const handleToggleRow = (id: string) => {
    AudioEngine.playClick();
    HapticEngine.selectionTick();
    if (selectedRowIds.includes(id)) {
      setSelectedRowIds(selectedRowIds.filter((r) => r !== id));
    } else {
      setSelectedRowIds([...selectedRowIds, id]);
    }
  };

  const handleExportCSV = () => {
    AudioEngine.playClick();
    HapticEngine.lightTap();
    const targetsToExport = selectedRowIds.length > 0
      ? allTargets.filter((t) => selectedRowIds.includes(t.id))
      : sortedList;

    const headers = 'TargetID,Name,Period_d,Depth_ppm,Radius_Rearth,SNR,ML_Confidence,Disposition\n';
    const rows = targetsToExport
      .map(
        (t) =>
          `"${t.id}","${t.name}",${t.orbitalPeriod},${t.transitDepth},${t.planetRadius},${t.snr},${t.mlConfidence},"${t.disposition}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MAST_AstroTransit_Export_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Banner matching screenshot 3 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-wide text-slate-100 flex items-center gap-2">
            <span>MAST Archive Explorer</span>
            <span className="text-xs font-mono-code px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-normal">
              Mikulski Archive Integration
            </span>
          </h1>
          <div className="text-xs font-mono-code text-slate-400 mt-1">
            Showing {sortedList.length} of 1,420 targets screened · <strong className="text-cyan-400">{allTargets.filter(t => t.disposition === 'CONFIRMED' || t.disposition === 'CONFIRMED CANDIDATE').length} Candidates Flagged</strong>
          </div>
        </div>

        {/* Uplink status & export */}
        <div className="flex items-center gap-3 font-mono-code text-xs">
          <div className="flex items-center gap-2 rounded-xl cosmic-glass px-3 py-1.5 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connection: STScI Uplink Active</span>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 transition-colors shadow-lg cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV ({selectedRowIds.length || sortedList.length})</span>
          </button>
        </div>
      </div>

      {/* ADQL Query Console matching screenshot 3 */}
      <div className="rounded-2xl cosmic-glass p-4 shadow-xl">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 text-xs font-mono-code">
          <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5" />
            ADQL / TAP Synchronous Query
          </span>
          <span className="text-slate-400">Target Catalog: <strong className="text-slate-200">Kepler KOI DR25 + TESS TOI</strong></span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={adqlQuery}
              onChange={(e) => setAdqlQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-[#060a14] px-3 py-2 font-mono-code text-xs text-cyan-300 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleExecuteADQL}
            disabled={isExecuting}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-cyan-400 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono-code text-xs font-bold transition-all shadow-md shadow-cyan-900/40"
          >
            {isExecuting ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            <span>EXECUTE</span>
          </button>
        </div>

        {/* Quick Filter Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-mono-code">
          <span className="text-slate-400 text-[11px]">Quick Filters:</span>
          <button
            onClick={() => {
              setAdqlQuery('SELECT * FROM kepler_koi WHERE snr > 15.0');
              handleExecuteADQL();
            }}
            className="px-2 py-0.5 rounded border border-slate-800 bg-[#060b16] text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300"
          >
            SNR &gt; 15
          </button>
          <button
            onClick={() => {
              setAdqlQuery('SELECT * FROM kepler_koi WHERE pradius < 1.5');
              handleExecuteADQL();
            }}
            className="px-2 py-0.5 rounded border border-slate-800 bg-[#060b16] text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300"
          >
            Earth Candidates (R &lt; 1.5)
          </button>
          <button
            onClick={() => {
              setFilterDisposition('CONFIRMED');
            }}
            className="px-2 py-0.5 rounded border border-slate-800 bg-[#060b16] text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300"
          >
            Confirmed Only
          </button>
          <button
            onClick={() => {
              setFilterDisposition('ALL');
              setSearchFilter('');
            }}
            className="px-2 py-0.5 rounded border border-slate-800 bg-[#060b16] text-slate-400 hover:text-slate-200"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Main Filter & Interactive Data Table */}
      <div className="rounded-2xl cosmic-glass overflow-hidden shadow-2xl">
        {/* Table controls */}
        <div className="p-3 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs font-mono-code">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter targets..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-44 rounded-lg border border-slate-800 bg-[#060b16] pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1">
              {(['ALL', 'CONFIRMED', 'CONFIRMED CANDIDATE', 'FALSE POSITIVE'] as const).map((disp) => (
                <button
                  key={disp}
                  onClick={() => setFilterDisposition(disp)}
                  className={`px-2.5 py-1 rounded text-[11px] transition-colors ${
                    filterDisposition === disp
                      ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {disp}
                </button>
              ))}
            </div>
          </div>

          <div className="text-slate-400 text-[11px]">
            Selected: <strong className="text-cyan-400">{selectedRowIds.length}</strong> targets
          </div>
        </div>

        {/* Data Table matching screenshot 3 */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono-code text-xs">
            <thead className="bg-[#060b16] text-slate-400 border-b border-slate-800/80 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3 w-10 text-center">
                  <button onClick={handleToggleSelectAll} className="text-slate-400 hover:text-cyan-300">
                    {selectedRowIds.length === sortedList.length && sortedList.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-cyan-400" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th
                  onClick={() => {
                    setSortField('id');
                    setSortAsc(!sortAsc);
                  }}
                  className="p-3 cursor-pointer hover:text-cyan-300"
                >
                  <div className="flex items-center gap-1">
                    <span>TARGET ID</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortField('period');
                    setSortAsc(!sortAsc);
                  }}
                  className="p-3 cursor-pointer hover:text-cyan-300"
                >
                  <div className="flex items-center gap-1">
                    <span>PERIOD (d)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortField('depth');
                    setSortAsc(!sortAsc);
                  }}
                  className="p-3 cursor-pointer hover:text-cyan-300"
                >
                  <div className="flex items-center gap-1">
                    <span>DEPTH (ppm)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortField('radius');
                    setSortAsc(!sortAsc);
                  }}
                  className="p-3 cursor-pointer hover:text-cyan-300"
                >
                  <div className="flex items-center gap-1">
                    <span>RADIUS (R⊕)</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="p-3 text-center">TRANSIT SIG</th>
                <th
                  onClick={() => {
                    setSortField('snr');
                    setSortAsc(!sortAsc);
                  }}
                  className="p-3 cursor-pointer hover:text-cyan-300"
                >
                  <div className="flex items-center gap-1">
                    <span>SNR</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortField('confidence');
                    setSortAsc(!sortAsc);
                  }}
                  className="p-3 cursor-pointer hover:text-cyan-300"
                >
                  <div className="flex items-center gap-1">
                    <span>ML CONF</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="p-3">DISPOSITION</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/50">
              {sortedList.map((target) => {
                const isSelected = selectedRowIds.includes(target.id);
                const isCurrent = selectedTarget.id === target.id;

                return (
                  <tr
                    key={target.id}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-cyan-950/40 text-cyan-200'
                        : isSelected
                        ? 'bg-slate-900/60 text-slate-200'
                        : 'hover:bg-slate-900/40 text-slate-300'
                    }`}
                  >
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleRow(target.id)}
                        className="text-slate-400 hover:text-cyan-300"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-cyan-400" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>

                    <td className="p-3 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="text-cyan-400">{target.id}</span>
                        {isCurrent && (
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">{target.name}</div>
                    </td>

                    <td className="p-3">{target.orbitalPeriod.toFixed(4)}</td>
                    <td className="p-3">{target.transitDepth.toLocaleString()}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200">{target.planetRadius.toFixed(2)}</span>
                        {(() => {
                          const cls = getPlanetaryClassification(target.planetRadius);
                          return (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded border font-semibold ${cls.borderClass} ${cls.bgClass} ${cls.colorClass}`}>
                              {cls.badgeLabel.replace('CLASS: ', '')}
                            </span>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Sparkline Transit Signature */}
                    <td className="p-3 text-center">
                      <div className="inline-block w-20 h-6">
                        <svg viewBox="0 0 80 24" className="w-full h-full">
                          <polyline
                            fill="none"
                            stroke={target.disposition === 'FALSE POSITIVE' ? '#f43f5e' : '#00f0ff'}
                            strokeWidth="1.5"
                            points="0,6 25,6 35,18 45,18 55,6 80,6"
                          />
                        </svg>
                      </div>
                    </td>

                    <td className="p-3 font-semibold text-slate-200">{target.snr.toFixed(1)}</td>

                    {/* ML Confidence Badge */}
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold ${
                          target.mlConfidence > 0.85
                            ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-500/40'
                            : target.mlConfidence > 0.5
                            ? 'text-amber-300 bg-amber-950/60 border border-amber-500/40'
                            : 'text-rose-300 bg-rose-950/60 border border-rose-500/40'
                        }`}
                      >
                        {(target.mlConfidence * 100).toFixed(1)}%
                      </span>
                    </td>

                    {/* Disposition Pill */}
                    <td className="p-3">
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
                          target.disposition === 'CONFIRMED'
                            ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30'
                            : target.disposition === 'FALSE POSITIVE'
                            ? 'text-rose-400 bg-rose-950/40 border border-rose-500/30'
                            : 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/30'
                        }`}
                      >
                        {target.disposition}
                      </span>
                    </td>

                    {/* Quick Load / Jump button */}
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          AudioEngine.playClick();
                          HapticEngine.lightTap();
                          onSelectTarget(target);
                          onJumpToVetting(target);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-700 bg-[#060a14] text-xs font-semibold text-cyan-300 hover:border-cyan-400 hover:bg-cyan-950/60 transition-colors"
                      >
                        <span>Load</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
