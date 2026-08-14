import React, { useState } from 'react';
import { Volume2, VolumeX, Smartphone, Vibrate, Sliders, X, Check, Activity } from 'lucide-react';
import { AudioEngine, HapticEngine } from '../../utils/feedbackEngine';

interface HapticsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSfxMuted: boolean;
  onToggleSfx: () => void;
}

export const HapticsSettingsModal: React.FC<HapticsSettingsModalProps> = ({
  isOpen,
  onClose,
  isSfxMuted,
  onToggleSfx,
}) => {
  const [hapticsEnabled, setHapticsEnabled] = useState(HapticEngine.getIsEnabled());
  const [baseDuration, setBaseDuration] = useState(HapticEngine.getBaseDuration());
  const [volume, setVolume] = useState(AudioEngine.getVolume() * 100);
  const [hasVibrateSupport] = useState(() => typeof window !== 'undefined' && 'vibrate' in navigator);

  if (!isOpen) return null;

  const handleDurationChange = (newVal: number) => {
    setBaseDuration(newVal);
    HapticEngine.setBaseDuration(newVal);
    HapticEngine.lightTap();
    AudioEngine.playMicroTick();
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    AudioEngine.setVolume(newVol / 100);
    AudioEngine.playClick();
  };

  const handleToggleHaptics = () => {
    const next = !hapticsEnabled;
    setHapticsEnabled(next);
    HapticEngine.setEnabled(next);
    if (next) {
      HapticEngine.lightTap();
    }
    AudioEngine.playClick();
  };

  const handleTestChirp = () => {
    AudioEngine.playClick();
    HapticEngine.lightTap();
  };

  const handleTestScan = () => {
    AudioEngine.playDiagnosticScan();
    HapticEngine.successPulse();
  };

  const handleTestWarning = () => {
    AudioEngine.playFalsePositiveAlert();
    HapticEngine.warningBuzz();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-[#090f1d] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl shadow-cyan-950/50 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cyan-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">
                Haptics & Audio Synthesizer
              </h2>
              <p className="text-xs text-slate-400">Tactile pulse & procedural Web Audio feedback</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Section 1: Tactile Vibration Engine */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Vibrate className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-slate-200">Device Haptic Feedback</span>
              </div>
              <button
                onClick={handleToggleHaptics}
                disabled={!hasVibrateSupport}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  hapticsEnabled && hasVibrateSupport ? 'bg-cyan-500' : 'bg-slate-700'
                } ${!hasVibrateSupport ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    hapticsEnabled && hasVibrateSupport ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {!hasVibrateSupport && (
              <div className="text-[11px] text-amber-400/90 bg-amber-950/30 border border-amber-800/40 rounded-lg p-2 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Vibration API not active on this device/browser (mobile/tablet supported).</span>
              </div>
            )}

            {/* Base Duration Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Base Tap Duration</span>
                <span className="font-mono text-cyan-400 font-semibold">{baseDuration} ms</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={baseDuration}
                disabled={!hapticsEnabled || !hasVibrateSupport}
                onChange={(e) => handleDurationChange(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>5ms (Feather)</span>
                <span>12ms (Standard)</span>
                <span>50ms (Firm)</span>
              </div>
            </div>
          </div>

          {/* Section 2: Audio Synthesizer */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isSfxMuted ? (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                )}
                <span className="text-sm font-medium text-slate-200">Interface Audio Synthesizer</span>
              </div>
              <button
                onClick={onToggleSfx}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  !isSfxMuted ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    !isSfxMuted ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Synthesizer Gain Volume */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Synthesizer Gain</span>
                <span className="font-mono text-cyan-400 font-semibold">{Math.round(volume)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={volume}
                disabled={isSfxMuted}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>

          {/* Test Procedural Audio & Haptic Patterns */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Test Feedback Patterns
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleTestChirp}
                className="px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-cyan-950/70 border border-slate-700 hover:border-cyan-500/50 text-xs font-mono text-cyan-300 transition-colors"
              >
                UI Chirp
              </button>
              <button
                type="button"
                onClick={handleTestScan}
                className="px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-emerald-950/70 border border-slate-700 hover:border-emerald-500/50 text-xs font-mono text-emerald-300 transition-colors"
              >
                AI Scan
              </button>
              <button
                type="button"
                onClick={handleTestWarning}
                className="px-2.5 py-2 rounded-lg bg-slate-800/80 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-500/50 text-xs font-mono text-rose-300 transition-colors"
              >
                Warning
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-cyan-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-medium text-xs tracking-wide shadow-lg shadow-cyan-900/40 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
