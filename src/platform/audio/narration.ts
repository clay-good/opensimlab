/**
 * Spoken narration (spoken-narration-and-haptic-cues → speech).
 *
 * Speech reads text the screen already shows, so it is never the only
 * channel, and it is a presentation of events the engine produced anyway, so
 * the transcript records nothing about it. Only on-device voices are used; see
 * `narration-voices.ts` for why.
 */
import type { VoiceLike } from './narration-voices';

export type NarrationSource = 'beat' | 'tutor' | 'alarm' | 'summary';

export interface NarrationSettings {
  readonly enabled: boolean;
  /** 0.8 to 1.5, remembered on this device. */
  readonly rate: number;
  /** A local voice name, or null for the best match for the locale. */
  readonly voiceName: string | null;
  readonly sources: Readonly<Record<NarrationSource, boolean>>;
  /**
   * A screen-reader user already hears alarms and the state summary from the
   * live regions, so narration of those two is suppressed to avoid hearing
   * anything twice.
   */
  readonly screenReader: boolean;
}

export const NARRATION_RATES = [0.8, 1, 1.25, 1.5] as const;

export const DEFAULT_NARRATION_SETTINGS: NarrationSettings = {
  enabled: false, rate: 1, voiceName: null,
  sources: { beat: true, tutor: true, alarm: true, summary: true },
  screenReader: false,
};

export function isNarrationSettings(value: unknown): value is NarrationSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const sources = record.sources as Record<string, unknown> | undefined;
  return typeof record.enabled === 'boolean'
    && typeof record.rate === 'number' && record.rate >= 0.8 && record.rate <= 1.5
    && (record.voiceName === null || typeof record.voiceName === 'string')
    && typeof record.screenReader === 'boolean'
    && !!sources && typeof sources === 'object'
    && (['beat', 'tutor', 'alarm', 'summary'] as const).every((key) => typeof sources[key] === 'boolean');
}

export interface UtteranceLike {
  text: string;
  rate: number;
  voice: VoiceLike | null;
  onend: (() => void) | null;
}

export interface SpeechTarget {
  speak(utterance: UtteranceLike): void;
  cancel(): void;
  pause(): void;
  resume(): void;
}

/**
 * Who may interrupt whom. A new worked-example beat replaces the one being
 * read; a high-priority alarm replaces anything; everything else waits its turn.
 */
export class NarrationEngine {
  private speaking: NarrationSource | null = null;
  private paused = false;

  constructor(
    private readonly target: SpeechTarget | undefined,
    private readonly utterance: (text: string) => UtteranceLike,
    private settings: NarrationSettings = DEFAULT_NARRATION_SETTINGS,
    private voice: VoiceLike | null = null,
  ) {}

  configure(settings: NarrationSettings, voice: VoiceLike | null): void {
    const wasEnabled = this.settings.enabled;
    this.settings = settings;
    this.voice = voice;
    if (wasEnabled && !settings.enabled) this.stop();
  }

  /** Whether this source would be spoken under the current settings. */
  allows(source: NarrationSource): boolean {
    if (!this.target || !this.settings.enabled || !this.settings.sources[source]) return false;
    return !(this.settings.screenReader && (source === 'alarm' || source === 'summary'));
  }

  speak(source: NarrationSource, text: string, priority: 'high' | 'normal' = 'normal'): void {
    const line = text.trim();
    if (line === '' || !this.allows(source)) return;
    const interrupts = (source === 'alarm' && priority === 'high')
      || (source === 'beat' && this.speaking === 'beat');
    if (interrupts) this.target!.cancel();
    const utterance = this.utterance(line);
    utterance.rate = Math.min(1.5, Math.max(0.8, this.settings.rate));
    utterance.voice = this.voice;
    utterance.onend = () => { if (this.speaking === source) this.speaking = null; };
    this.speaking = source;
    this.target!.speak(utterance);
    if (this.paused) this.target!.pause();
  }

  /** Speech pauses with the clock, so a learner who stops to think is not spoken over. */
  pause(): void {
    if (this.paused) return;
    this.paused = true;
    this.target?.pause();
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.target?.resume();
  }

  stop(): void {
    this.target?.cancel();
    this.speaking = null;
  }
}
