// Procedural Web Audio Synthesizer & Haptic Feedback Engine for AstroTransit OS

// ==========================================
// 1. WEB AUDIO SYNTHESIZER ENGINE
// ==========================================

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private volume: number = 0.10; // Soft, non-intrusive default

  constructor() {
    // Lazy AudioContext initialization on first user interaction
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('astrotransit_sfx_muted');
      this.isMuted = savedMute === 'true';
    }
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('astrotransit_sfx_muted', String(muted));
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  // 1. UI Click / Preset Select: Clean, high-frequency mechanical chirp (850Hz -> 1400Hz, 40ms decay)
  public playClick() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.038);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.040);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.042);
    } catch {
      // AudioContext failure recovery
    }
  }

  // 2. Workstation Switch: Soft spatial low-pass air woosh (Bandpass noise sweep, 80ms)
  public playWoosh() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    try {
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      const now = ctx.currentTime;
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + 0.04);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.08);
      filter.Q.setValueAtTime(3.0, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      whiteNoise.start(now);
      whiteNoise.stop(now + 0.082);
    } catch {
      // AudioContext fallback
    }
  }

  // 3. AI Validation Scan: Resonant ascending diagnostic hum (180 Hz -> 650 Hz with subtle resonant filter over 350ms)
  public playDiagnosticScan() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    try {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + 0.35);
      filter.Q.setValueAtTime(4.5, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.37);
    } catch {
      // AudioContext fallback
    }
  }

  // 4. Gauge Value Spin: Rapid rhythmic micro-tick
  public playMicroTick() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime;

      osc.type = 'square';
      osc.frequency.setValueAtTime(1800, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.008);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.01);
    } catch {
      // AudioContext fallback
    }
  }

  // 5. False-Positive Alert: Damped dual-frequency pulse (440 Hz + 310 Hz)
  public playFalsePositiveAlert() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      [440, 310].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now);
        osc.stop(now + 0.29);
      });
    } catch {
      // AudioContext fallback
    }
  }

  // 6. Confirmed Candidate Chime: Harmonious Major Third ping (523.25 Hz + 659.25 Hz)
  public playConfirmedChime() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx || !this.masterGain) return;

    try {
      const now = ctx.currentTime;
      [523.25, 659.25, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);

        gain.gain.setValueAtTime(0.2, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.36);
      });
    } catch {
      // AudioContext fallback
    }
  }
}

export const AudioEngine = new SoundEngine();


// ==========================================
// 2. HAPTIC FEEDBACK ENGINE (navigator.vibrate)
// ==========================================

class TactileFeedbackEngine {
  private isEnabled: boolean = true;
  private baseDurationMs: number = 12; // 5ms - 50ms range (default 12ms)

  constructor() {
    if (typeof window !== 'undefined') {
      const savedEnabled = localStorage.getItem('astrotransit_haptics_enabled');
      const savedDuration = localStorage.getItem('astrotransit_haptics_duration');
      if (savedEnabled !== null) this.isEnabled = savedEnabled === 'true';
      if (savedDuration) {
        const parsed = parseInt(savedDuration, 10);
        if (!isNaN(parsed) && parsed >= 5 && parsed <= 50) {
          this.baseDurationMs = parsed;
        }
      }
    }
  }

  private canVibrate(): boolean {
    return (
      this.isEnabled &&
      !AudioEngine.getIsMuted() &&
      typeof window !== 'undefined' &&
      'navigator' in window &&
      'vibrate' in navigator
    );
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('astrotransit_haptics_enabled', String(enabled));
    }
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public setBaseDuration(durationMs: number) {
    this.baseDurationMs = Math.max(5, Math.min(50, durationMs));
    if (typeof window !== 'undefined') {
      localStorage.setItem('astrotransit_haptics_duration', String(this.baseDurationMs));
    }
  }

  public getBaseDuration(): number {
    return this.baseDurationMs;
  }

  // 1. Light Tap: Standard button presses, category switch, dock icons (scales with base duration)
  public lightTap() {
    if (!this.canVibrate()) return;
    try {
      navigator.vibrate(this.baseDurationMs);
    } catch {}
  }

  // 2. Selection Tick: Telemetry scrubbers or autocomplete navigation
  public selectionTick() {
    if (!this.canVibrate()) return;
    try {
      const tick = Math.max(4, Math.round(this.baseDurationMs * 0.65));
      navigator.vibrate(tick);
    } catch {}
  }

  // 3. AI Success Pulse: Double-pulse confirmation for confirmed candidates
  public successPulse() {
    if (!this.canVibrate()) return;
    try {
      const p1 = Math.round(this.baseDurationMs * 2.0);
      const gap = Math.round(this.baseDurationMs * 3.0);
      const p2 = Math.round(this.baseDurationMs * 2.5);
      navigator.vibrate([p1, gap, p2]);
    } catch {}
  }

  // 4. Warning Buzz: Damped dual-vibration pulse for False-Positive or Eclipsing Binary
  public warningBuzz() {
    if (!this.canVibrate()) return;
    try {
      const p1 = Math.round(this.baseDurationMs * 4.5);
      const gap = Math.round(this.baseDurationMs * 5.0);
      const p2 = Math.round(this.baseDurationMs * 4.5);
      navigator.vibrate([p1, gap, p2]);
    } catch {}
  }

  // 5. Transit Boundary Snap / Alignment Double-tap
  public snapDoubleTap() {
    if (!this.canVibrate()) return;
    try {
      navigator.vibrate([8, 25, 8]);
    } catch {}
  }

  // 6. Scrub / Drag Micro-Tick (6ms micro-vibration during touch scrub / drag)
  public scrubTick() {
    if (!this.canVibrate()) return;
    try {
      navigator.vibrate(6);
    } catch {}
  }
}

export const HapticEngine = new TactileFeedbackEngine();
