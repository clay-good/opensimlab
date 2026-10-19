/**
 * Choosing a voice for spoken narration (spoken-narration-and-haptic-cues →
 * speech).
 *
 * Only on-device voices are offered. A network voice sends the narrated text,
 * which includes what the learner did, to a speech service, and practice here
 * is meant to be unobservable. When no local voice exists, narration is
 * unavailable and says so.
 */

export interface VoiceLike {
  readonly name: string;
  readonly lang: string;
  readonly localService: boolean;
  readonly default?: boolean;
}

export interface VoiceChoice<V extends VoiceLike = VoiceLike> {
  /** The best local voice for the locale, or null when there is no local voice at all. */
  readonly preferred: V | null;
  /** Every other local voice, so a learner can choose. Network voices never appear. */
  readonly others: readonly V[];
}

export const NO_LOCAL_VOICE_REASON =
  'No on-device voice is installed, so narration is unavailable. Network voices are not used, '
  + 'because they would send what you do to a speech service.';

const language = (tag: string) => tag.toLowerCase().split(/[-_]/)[0] ?? '';

/** Exact locale first, then the same language, then the platform default, then the rest. */
export function selectVoices<V extends VoiceLike>(voices: readonly V[], locale: string): VoiceChoice<V> {
  const local = voices.filter((voice) => voice.localService);
  const wanted = locale.toLowerCase().replace('_', '-');
  const rank = (voice: V) => {
    const tag = voice.lang.toLowerCase().replace('_', '-');
    if (tag === wanted) return 0;
    if (language(tag) === language(wanted)) return 1;
    if (voice.default === true) return 2;
    return 3;
  };
  const ordered = [...local].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  return { preferred: ordered[0] ?? null, others: ordered.slice(1) };
}

export interface VoiceSource<V extends VoiceLike = VoiceLike> {
  getVoices(): V[];
  addEventListener(type: 'voiceschanged', listener: () => void): void;
  removeEventListener(type: 'voiceschanged', listener: () => void): void;
}

/**
 * The voice list, once the platform has it. Some browsers return an empty list
 * until `voiceschanged` fires; give up after `timeoutMs` and report what exists.
 */
export function voicesWhenReady<V extends VoiceLike>(source: VoiceSource<V>, timeoutMs = 1500): Promise<V[]> {
  const now = source.getVoices();
  if (now.length > 0) return Promise.resolve(now);
  return new Promise((resolve) => {
    const finish = () => {
      source.removeEventListener('voiceschanged', finish);
      clearTimeout(timer);
      resolve(source.getVoices());
    };
    const timer = setTimeout(finish, timeoutMs);
    source.addEventListener('voiceschanged', finish);
  });
}
