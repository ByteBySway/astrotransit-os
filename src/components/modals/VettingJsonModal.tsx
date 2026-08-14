import React, { useState } from 'react';
import { TargetPlanet, AstrophysicsVettingResponse } from '../../types';
import { Code2, X, Copy, Check, Send, RefreshCw, Terminal } from 'lucide-react';

interface VettingJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: TargetPlanet;
  onRunVetting: (target: TargetPlanet) => Promise<AstrophysicsVettingResponse | null>;
}

export const VettingJsonModal: React.FC<VettingJsonModalProps> = ({
  isOpen,
  onClose,
  target,
  onRunVetting,
}) => {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<AstrophysicsVettingResponse | null>(null);

  if (!isOpen) return null;

  const defaultSchemaSample: AstrophysicsVettingResponse = {
    targetId: target.id || 'KIC-11442793',
    mlConfidence: target.mlConfidence || 0.964,
    disposition: (target.disposition === 'CONFIRMED' || target.disposition === 'CONFIRMED CANDIDATE') ? 'CONFIRMED CANDIDATE' : target.disposition as any,
    probabilities: {
      exoplanet: +(target.mlConfidence * 100).toFixed(1),
      eclipsingBinary: target.disposition === 'FALSE POSITIVE' ? 94.2 : 2.8,
      stellarNoise: 0.8,
    },
    falsePositiveChecks: {
      oddEvenPass: Math.abs(target.oddEvenRatio - 1.0) < 0.08,
      secondaryEclipsePass: target.secondaryEclipseDepth === 0,
      stellarDensityPass: target.planetRadius < 25.0 && target.snr > 7.1,
    },
    scientificVerdict: target.disposition === 'FALSE POSITIVE'
      ? 'Pronounced odd-even transit depth discrepancy detected, indicative of an eclipsing binary.'
      : 'Clear U-shaped flat bottom transit without significant odd-even depth variation. High probability planetary candidate.',
  };

  const currentJson = apiResponse || defaultSchemaSample;
  const jsonString = JSON.stringify(currentJson, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerApi = async () => {
    setIsLoading(true);
    const res = await onRunVetting(target);
    if (res) {
      setApiResponse(res);
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-cyan-500/50 bg-[#090f1d] p-6 shadow-2xl font-mono-code text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <span className="font-bold text-sm text-cyan-300">
              Core Astrophysics Backend Engine — JSON Output Schema
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Info text */}
        <div className="my-3 text-slate-400 text-[11px] leading-relaxed">
          The astrophysics backend processes telemetry parameters (<code className="text-cyan-300">orbitalPeriod</code>, <code className="text-cyan-300">transitDepth</code>, <code className="text-cyan-300">radius</code>, <code className="text-cyan-300">oddEvenRatio</code>) and returns strict JSON adhering to the AstroTransit OS schema.
        </div>

        {/* JSON Code Box */}
        <div className="relative my-3 rounded-xl border border-slate-800 bg-[#050811] p-4 text-cyan-300 overflow-x-auto max-h-80 scrollbar-thin">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white text-[10px] transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>

          <pre className="text-[11px] leading-relaxed font-mono-code text-emerald-400">
            {jsonString}
          </pre>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="text-[11px] text-slate-400">
            Endpoint: <code className="text-cyan-400 font-bold">POST /api/vet-transit</code>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTriggerApi}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-400 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-all shadow-md shadow-cyan-900/40"
            >
              {isLoading ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>Invoke Live Endpoint</span>
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
