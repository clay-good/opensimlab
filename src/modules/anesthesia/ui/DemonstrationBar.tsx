/**
 * The narration strip that runs across the top of a demonstration.
 *
 * It says one thing at a time and points at the part of the screen that thing is
 * happening in, because the whole difficulty with a first look at this interface
 * is that there are four regions and no reason to look at any particular one.
 *
 * "Take the controls" is deliberately the most prominent thing in the strip. The
 * demonstration is a way into the simulator, not a substitute for it, and a
 * viewer who wants to stop watching should never have to hunt for the exit.
 */

import { Button } from '@platform/ui';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';

export interface DemonstrationBarProps {
  readonly beat: DemonstrationBeat | null;
  readonly progress: number;
  readonly onTakeControls: () => void;
  readonly onAdvance?: (() => void) | undefined;
  readonly awaitingAdvance?: boolean | undefined;
}

/**
 * What each focus region is called, for the screen-reader announcement.
 *
 * Named, never placed. These used to say "on the right", "on the left" and
 * "below", which described one layout out of three: the cockpit reflows, and on
 * a phone the numbers are above the traces and the analysis region is a drawer.
 * A direction that is wrong on a phone is worse than no direction at all,
 * particularly for the reader who has only this text to go on.
 */
const FOCUS_LABEL: Record<DemonstrationBeat['focus'], string> = {
  monitor: 'the monitor',
  analysis: 'the concentration plot',
  actions: 'the action cockpit',
  none: '',
};

export function DemonstrationBar({ beat, progress, onTakeControls, onAdvance, awaitingAdvance }: DemonstrationBarProps) {
  if (!beat) return null;
  const where = FOCUS_LABEL[beat.focus];
  return (
    <aside className="demo-bar" data-focus={beat.focus}>
      <div
        className="demo-bar__progress"
        role="progressbar"
        aria-label="Demonstration progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <span style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="demo-bar__body">
        <p className="demo-bar__label">{awaitingAdvance ? 'Paused to read' : 'Demonstration'}</p>
        {/* Polite, not assertive: a narration line that interrupted whatever a
            screen-reader user was reading would make the demonstration worse
            for them than no demonstration at all. */}
        <p className="demo-bar__text" aria-live="polite">
          {beat.narration}
          {where ? <span className="visually-hidden"> Look at {where}.</span> : null}
        </p>
        <div className="demo-bar__controls" onKeyDown={(event) => {
          // Space activates these buttons; it must not also toggle the cockpit clock.
          if (event.key === ' ') event.stopPropagation();
        }}>
          {awaitingAdvance !== undefined && <Button aria-disabled={!awaitingAdvance} onClick={awaitingAdvance ? onAdvance : undefined}>Continue example</Button>}
          <Button variant="primary" onClick={onTakeControls}>Take the controls</Button>
        </div>
      </div>
    </aside>
  );
}
