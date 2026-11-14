/**
 * The transcript scrubber (learning/facilitation → bookmarks and scrubbing).
 *
 * A completed run already has a timeline of marks a reader can click. What it
 * had no way to do was stop between them: an instructor wanting the moment
 * thirty seconds before the alarm had to describe it rather than show it.
 *
 * The scrubber is a range input over the recorded ticks, so it is operable from
 * the keyboard without anything custom — arrow keys step, Home and End jump to
 * the ends, and the browser's own semantics carry it to assistive technology.
 * Moving it announces the patient's state at that moment through a live region,
 * so the information is not only in the pixels.
 *
 * It reads the recorded history and nothing else. It cannot run the engine,
 * cannot change the run, and shows no value the run did not already produce.
 */
import type { HistorySample } from '@platform/session/session-store';
import { formatElapsed } from '@platform/clock/simulation-clock';
import { t } from '@platform/i18n/messages';
import '@platform/i18n/messages-session';

/**
 * The parameters a reviewer is read back, in this order, and only where the
 * sample has them. Deliberately short: a scrubber that recites twenty-seven
 * numbers on every arrow key is one nobody listens to twice.
 */
export const SCRUBBED_PARAMETERS: readonly { readonly key: string; readonly label: string }[] = [
  { key: 'heartRateBpm', label: 'heart rate' },
  { key: 'meanArterialMmHg', label: 'mean arterial pressure' },
  { key: 'spo2Percent', label: 'oxygen saturation' },
  { key: 'etco2MmHg', label: 'end-tidal CO2' },
  { key: 'respiratoryRateBpm', label: 'respiratory rate' },
];

/** The latest recorded sample at or before this tick. */
export function sampleAt(
  history: readonly HistorySample[],
  tick: number,
): HistorySample | undefined {
  let found: HistorySample | undefined;
  for (const sample of history) {
    if (sample.tick > tick) break;
    found = sample;
  }
  return found ?? history[0];
}

/** What the live region says: the moment, then the numbers the sample has. */
export function scrubbedSummary(
  history: readonly HistorySample[],
  tick: number,
): string {
  const sample = sampleAt(history, tick);
  if (sample === undefined) return t('scrub.empty');
  const parts = SCRUBBED_PARAMETERS
    .filter(({ key }) => typeof sample.state[key] === 'number' && Number.isFinite(sample.state[key]))
    .map(({ key, label }) => `${label} ${Math.round(sample.state[key]!)}`);
  return parts.length === 0
    ? t('scrub.at-no-values', { time: formatElapsed(sample.tick) })
    : t('scrub.at', { time: formatElapsed(sample.tick), values: parts.join(', ') });
}

export function TranscriptScrubber({ history, tick, onTick }: {
  readonly history: readonly HistorySample[];
  readonly tick: number;
  readonly onTick: (tick: number) => void;
}) {
  const last = history[history.length - 1]?.tick ?? 0;
  if (history.length === 0 || last === 0) return null;
  return (
    <div className="scrubber">
      <label className="field__label" htmlFor="transcript-scrubber">{t('scrub.label')}</label>
      <input
        id="transcript-scrubber"
        className="scrubber__range"
        type="range"
        min={0}
        max={last}
        step={1}
        value={Math.min(Math.max(tick, 0), last)}
        onChange={(event) => onTick(Number(event.currentTarget.value))}
      />
      {/* Polite, not assertive: a reviewer dragging the handle is reading, and
          interrupting every announcement with the next one is unusable. */}
      <p className="field__hint" role="status" aria-live="polite">
        {scrubbedSummary(history, tick)}
      </p>
    </div>
  );
}
