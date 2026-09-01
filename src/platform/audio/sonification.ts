/**
 * The sound layer (cockpit/sonification).
 *
 * Everything is synthesized with the Web Audio API at runtime. There are no
 * encoded audio files anywhere in the bundle, so sound adds nothing measurable to
 * the download budget and works offline.
 *
 * Audio begins disabled and is enabled only by a deliberate learner action, which
 * also satisfies the browser autoplay policy. It is never the only channel
 * carrying information: `tests/unit/sonification.test.ts` asserts that every
 * audio event has a paired visual event.
 */

/**
 * The saturation-to-frequency mapping.
 *
 * ISO 80601-2-61 requires that where a pulse oximeter provides a variable-pitch
 * tone, the pitch FALLS as saturation falls. That is the behaviour an
 * anaesthetist actually tracks saturation by while looking at the surgical field.
 *
 * The mapping is declared explicitly rather than tuned by ear: a linear ramp in
 * SEMITONES, which is how pitch is perceived, from a reference at 100% down to
 * the bottom of the range. `tests/unit/sonification.test.ts` asserts it is
 * monotonic across the whole range.
 */
export const PULSE_TONE = {
  /** Frequency at a saturation of 100%, in hertz. */
  referenceHz: 880,
  /** Saturation at which the reference frequency applies. */
  referencePercent: 100,
  /** Semitones the pitch falls for each percentage point of saturation lost. */
  semitonesPerPercent: 0.5,
  /** The lowest frequency the tone will reach, in hertz. */
  floorHz: 180,
  /** Duration of one pulse beep, in seconds. */
  beepSeconds: 0.08,
} as const;

/**
 * Frequency of the pulse tone at a given saturation.
 * Monotonically increasing in saturation, so pitch falls as saturation falls.
 */
export function pulseToneFrequency(spo2Percent: number): number {
  const clamped = Math.min(Math.max(spo2Percent, 0), 100);
  const semitonesDown = (PULSE_TONE.referencePercent - clamped) * PULSE_TONE.semitonesPerPercent;
  const frequency = PULSE_TONE.referenceHz * Math.pow(2, -semitonesDown / 12);
  return Math.max(frequency, PULSE_TONE.floorHz);
}

/**
 * IEC 60601-1-8 alarm burst patterns.
 *
 * The standard specifies a burst of pulses per priority, with higher priority more
 * urgent in rate and pattern. Open Sim Lab follows the standard's CONVENTIONS for
 * educational fidelity; it is not a certified medical device and claims no
 * conformance.
 */
export interface BurstPattern {
  /** Pulses in one burst. */
  readonly pulses: number;
  /** Duration of each pulse, in seconds. */
  readonly pulseSeconds: number;
  /** Gap between pulses within a burst, in seconds. */
  readonly gapSeconds: number;
  /** Seconds between the start of one burst and the start of the next. */
  readonly burstIntervalSeconds: number;
  /** Fundamental frequency, inside the standard's stated range. */
  readonly frequencyHz: number;
  /** Bursts repeated per cycle before the pattern restarts. */
  readonly burstsPerCycle: number;
}

/**
 * How long one complete cycle of a pattern occupies, including its pause.
 *
 * `burstIntervalSeconds` is the intended gap between the START of one cycle and
 * the next, so a pattern with more than one burst per cycle needs the bursts
 * themselves counted before the gap can mean what it says.
 */
export function cycleSeconds(pattern: BurstPattern): number {
  const burst = burstDurationSeconds(pattern);
  const spacing = burst + pattern.gapSeconds * 2;
  return Math.max((pattern.burstsPerCycle - 1) * spacing + burst, pattern.burstIntervalSeconds);
}

export const ALARM_BURSTS: Record<'high' | 'medium' | 'low', BurstPattern> = {
  // High priority: ten pulses, as two bursts of five, repeating quickly.
  high: {
    pulses: 5, pulseSeconds: 0.12, gapSeconds: 0.06,
    burstIntervalSeconds: 1.2, frequencyHz: 960, burstsPerCycle: 2,
  },
  // Medium priority: three pulses, repeating slowly.
  medium: {
    pulses: 3, pulseSeconds: 0.16, gapSeconds: 0.12,
    burstIntervalSeconds: 6.0, frequencyHz: 640, burstsPerCycle: 1,
  },
  // Low priority: one or two pulses, or a steady indication only.
  low: {
    pulses: 1, pulseSeconds: 0.2, gapSeconds: 0,
    burstIntervalSeconds: 20, frequencyHz: 440, burstsPerCycle: 1,
  },
};

/** Total duration of one burst, in seconds. */
export function burstDurationSeconds(pattern: BurstPattern): number {
  return pattern.pulses * pattern.pulseSeconds + Math.max(pattern.pulses - 1, 0) * pattern.gapSeconds;
}

/**
 * An extended sonification cue: something no real monitor makes, provided so a
 * learner who cannot see the traces can still track the patient. It is timbrally
 * distinct from the clinical tones and documented as an Open Sim Lab affordance.
 */
export interface ExtendedCue {
  readonly id: string;
  readonly label: string;
  /** The state field this cue tracks. */
  readonly parameter: string;
  /** Waveform, chosen to be distinct from the clinical sine tones. */
  readonly timbre: 'triangle' | 'sawtooth' | 'square';
  readonly description: string;
}

export const EXTENDED_CUES: readonly ExtendedCue[] = [
  {
    id: 'map-drone', label: 'Blood pressure drone', parameter: 'meanArterialMmHg', timbre: 'triangle',
    description: 'A continuous low drone whose pitch follows mean arterial pressure. No real monitor '
      + 'makes this sound; it is an Open Sim Lab affordance.',
  },
  {
    id: 'etco2-pulse', label: 'Carbon dioxide breath cue', parameter: 'etco2MmHg', timbre: 'sawtooth',
    description: 'A short cue on each breath whose brightness follows end-tidal carbon dioxide. '
      + 'An Open Sim Lab affordance, not something to expect on real equipment.',
  },
  {
    id: 'depth-drone', label: 'Depth drone', parameter: 'depthIndex', timbre: 'square',
    description: 'A quiet continuous tone whose pitch follows the predicted depth index. '
      + 'An Open Sim Lab affordance.',
  },
];

/** No more than three continuous cues sound at once by default. */
export const MAX_SIMULTANEOUS_CUES = 3;

export interface AudioSettings {
  /** Master switch. Audio begins disabled. */
  enabled: boolean;
  /** 0 to 1. Pulse tone and alarms are controlled independently. */
  pulseVolume: number;
  alarmVolume: number;
  pulseMuted: boolean;
  alarmMuted: boolean;
  /** Ids of the extended cues the learner has switched on. */
  extendedCues: readonly string[];
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  enabled: false,
  pulseVolume: 0.35,
  alarmVolume: 0.5,
  pulseMuted: false,
  alarmMuted: false,
  extendedCues: [],
};

/**
 * The audio engine. It schedules everything ahead of time on the audio clock, so
 * nothing runs on the main thread's critical path and audio cannot cost frames.
 */
export class SonificationEngine {
  private context: AudioContext | null = null;
  private pulseGain: GainNode | null = null;
  private alarmGain: GainNode | null = null;
  private cueGain: GainNode | null = null;
  private settings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
  private lastAlarmBurstAt = 0;
  private activeCues = new Map<string, { oscillator: OscillatorNode; gain: GainNode }>();

  /**
   * Enable audio. Must be called from a user gesture so the browser's autoplay
   * policy is satisfied.
   */
  async enable(factory: () => AudioContext = () => new AudioContext()): Promise<void> {
    if (this.context) {
      await this.context.resume();
      this.settings = { ...this.settings, enabled: true };
      return;
    }
    const context = factory();
    this.context = context;
    this.pulseGain = context.createGain();
    this.alarmGain = context.createGain();
    this.cueGain = context.createGain();
    this.pulseGain.connect(context.destination);
    this.alarmGain.connect(context.destination);
    this.cueGain.connect(context.destination);
    this.applyGains();
    await context.resume();
    this.settings = { ...this.settings, enabled: true };
  }

  disable(): void {
    for (const cue of this.activeCues.values()) { cue.oscillator.stop(); }
    this.activeCues.clear();
    this.settings = { ...this.settings, enabled: false };
    void this.context?.suspend();
  }

  update(settings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...settings };
    this.applyGains();
  }

  get current(): AudioSettings { return this.settings; }

  private applyGains(): void {
    if (!this.context) return;
    if (this.pulseGain) this.pulseGain.gain.value = this.settings.pulseMuted ? 0 : this.settings.pulseVolume;
    if (this.alarmGain) this.alarmGain.gain.value = this.settings.alarmMuted ? 0 : this.settings.alarmVolume;
    if (this.cueGain) this.cueGain.gain.value = this.settings.pulseMuted ? 0 : this.settings.pulseVolume * 0.5;
  }

  /**
   * Sound one pulse beep at the pitch that saturation implies.
   * Called once per detected beat; the tone stops when the pulse does, because
   * nothing calls it.
   */
  pulse(spo2Percent: number): void {
    const context = this.context;
    if (!context || !this.settings.enabled || !this.pulseGain) return;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = pulseToneFrequency(spo2Percent);
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(1, now + 0.005);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + PULSE_TONE.beepSeconds);
    oscillator.connect(envelope);
    envelope.connect(this.pulseGain);
    oscillator.start(now);
    oscillator.stop(now + PULSE_TONE.beepSeconds + 0.01);
  }

  /** Sound an alarm burst if enough time has passed since the last one. */
  alarm(priority: 'high' | 'medium' | 'low'): void {
    const context = this.context;
    if (!context || !this.settings.enabled || !this.alarmGain) return;
    const pattern = ALARM_BURSTS[priority];
    const now = context.currentTime;
    // Gate on the whole CYCLE, not on `burstIntervalSeconds` alone.
    //
    // High priority is two bursts of five: one burst runs 0.84s, the second
    // starts at 0.96s and ends at 1.80s, and the gate re-fired at 1.2s. Two
    // oscillator trains therefore overlapped every cycle and high priority was
    // not the 5-then-5-then-pause pattern the comment above describes; it was a
    // continuous tone. That is the single loudest thing in the product, and it
    // was a rounding error rather than a decision.
    if (now - this.lastAlarmBurstAt < cycleSeconds(pattern)) return;
    this.lastAlarmBurstAt = now;

    for (let burst = 0; burst < pattern.burstsPerCycle; burst += 1) {
      const burstStart = now + burst * (burstDurationSeconds(pattern) + pattern.gapSeconds * 2);
      for (let pulse = 0; pulse < pattern.pulses; pulse += 1) {
        const start = burstStart + pulse * (pattern.pulseSeconds + pattern.gapSeconds);
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = pattern.frequencyHz;
        envelope.gain.setValueAtTime(0, start);
        envelope.gain.linearRampToValueAtTime(1, start + 0.01);
        envelope.gain.setValueAtTime(1, start + pattern.pulseSeconds - 0.01);
        envelope.gain.linearRampToValueAtTime(0, start + pattern.pulseSeconds);
        oscillator.connect(envelope);
        envelope.connect(this.alarmGain);
        oscillator.start(start);
        oscillator.stop(start + pattern.pulseSeconds + 0.01);
      }
    }
  }

  /** Start or update an extended sonification cue. */
  setCue(cueId: string, active: boolean, normalizedValue: number): void {
    const context = this.context;
    if (!context || !this.cueGain) return;
    const definition = EXTENDED_CUES.find((cue) => cue.id === cueId);
    if (!definition) return;

    if (!active || !this.settings.enabled) {
      const existing = this.activeCues.get(cueId);
      if (existing) { existing.oscillator.stop(); this.activeCues.delete(cueId); }
      return;
    }
    if (this.activeCues.size >= MAX_SIMULTANEOUS_CUES && !this.activeCues.has(cueId)) return;

    let entry = this.activeCues.get(cueId);
    if (!entry) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = definition.timbre;
      gain.gain.value = 0.12;
      oscillator.connect(gain);
      gain.connect(this.cueGain);
      oscillator.start();
      entry = { oscillator, gain };
      this.activeCues.set(cueId, entry);
    }
    // A two-octave sweep across the parameter's range.
    entry.oscillator.frequency.value = 160 * Math.pow(2, Math.min(Math.max(normalizedValue, 0), 1) * 2);
  }

  /** For tests and for the settings panel: which cues are sounding. */
  get soundingCues(): string[] {
    return [...this.activeCues.keys()];
  }
}
