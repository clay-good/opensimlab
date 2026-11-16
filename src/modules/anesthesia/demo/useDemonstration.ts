/**
 * Driving the demonstration from the real clock.
 *
 * The beats are keyed to simulated seconds, and simulated time is the session's,
 * so the demonstration cannot drift away from what is on screen: if the learner
 * pauses, the narration pauses with them, and if they take the controls the
 * remaining beats simply stop firing. Nothing here is a separate timeline.
 *
 * One thing the simulated clock cannot pace is reading. The beats are spaced by
 * the physiology, so at five times speed several of them arrived a second or two
 * apart with a paragraph each, and the viewer this was built to convince could
 * not read it. Each beat now holds the clock for as long as its own narration
 * needs, minus the reading time its gap already provides, and a viewer who reads
 * faster than that presses Continue. The hold is a ceiling on waiting rather
 * than a wait: nothing is held when the schedule is already unhurried.
 */

import { useEffect, useRef, useState } from 'react';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { LearnerAction } from '@platform/kernel/protocol';
import {
  DEMONSTRATION_SECONDS, INDUCTION_DEMONSTRATION, beatAt, beatsToFire, narrationHoldMs,
  type DemonstrationBeat,
} from './demonstration';

export interface DemonstrationController {
  /** The beat the viewer should be reading, or null when not demonstrating. */
  readonly beat: DemonstrationBeat | null;
  /** How far through, 0 to 1, for a progress indicator. */
  readonly progress: number;
  /** True once the last beat has been reached. */
  readonly finished: boolean;
  /** Present only while an observed-state example waits at a reading checkpoint. */
  readonly onAdvance?: (() => void) | undefined;
  readonly awaitingAdvance?: boolean | undefined;
}

export interface DemonstrationOptions {
  readonly active: boolean;
  readonly tick: number;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  /** The clock, so a beat can be held open long enough to read. */
  readonly pause: () => void;
  readonly play: () => void;
  /** The session's speed multiplier, which decides how much reading a gap gives. */
  readonly speed: number;
  /** Called when the script runs out, so the caller can hand back the controls. */
  readonly onFinished: () => void;
}

/**
 * The reading time this beat's own gap provides, in real seconds.
 *
 * `null` for the closing beat, which is not held here: the clock has nothing
 * left to run and the reading time for it is the pause before the controls are
 * handed back, in the cockpit.
 */
function realSecondsUntilNext(beat: DemonstrationBeat, speed: number): number | null {
  const index = INDUCTION_DEMONSTRATION.indexOf(beat);
  const next = index < 0 ? undefined : INDUCTION_DEMONSTRATION[index + 1];
  if (!next) return null;
  return (next.atSecond - beat.atSecond) / Math.max(1, speed);
}

export function useDemonstration(options: DemonstrationOptions): DemonstrationController {
  const { active, tick, act, pause, play, speed, onFinished } = options;
  const second = tick / TICKS_PER_SECOND;

  // The last second whose actions have been performed. Kept in a ref rather
  // than state because firing an action re-renders, and a beat that re-fired on
  // every render would give the patient the induction dose forty times.
  const firedThrough = useRef(0);
  const [beat, setBeat] = useState<DemonstrationBeat | null>(null);
  const finished = active && second >= DEMONSTRATION_SECONDS;

  // Refs, so the effect depends on the tick alone. `act` is a store method with
  // a stable identity, but `onFinished` is usually an inline closure, and
  // depending on it would re-run this effect on every parent render.
  const actRef = useRef(act);
  const finishRef = useRef(onFinished);
  const pauseRef = useRef(pause);
  const playRef = useRef(play);
  const speedRef = useRef(speed);
  actRef.current = act;
  finishRef.current = onFinished;
  pauseRef.current = pause;
  playRef.current = play;
  speedRef.current = speed;

  /**
   * The beat being read, and how long the clock owes it.
   *
   * State rather than a ref, and the waiting lives in its own effect, because
   * React mounts an effect twice in development: a timer started in the effect
   * that discovers the beat is cleared by that first unmount, and a ref saying
   * "already held" then leaves the clock stopped for good. Held in state, the
   * remount sees the debt and starts the wait again.
   */
  const held = useRef<number | null>(null);
  const [hold, setHold] = useState<{ readonly atSecond: number; readonly ms: number } | null>(null);

  useEffect(() => {
    if (!active) {
      firedThrough.current = 0;
      held.current = null;
      setHold(null);
      setBeat(null);
      return;
    }
    // A reset winds the clock back; the script should start again with it.
    if (second < firedThrough.current) { firedThrough.current = 0; held.current = null; }

    for (const pending of beatsToFire(firedThrough.current, second)) {
      if (pending.action) actRef.current(pending.action);
    }
    firedThrough.current = second;
    const current = beatAt(second);
    setBeat(current);

    // A new beat holds the clock for whatever reading time its gap does not
    // already give.
    const until = current ? realSecondsUntilNext(current, speedRef.current) : null;
    if (current && until !== null && held.current !== current.atSecond) {
      held.current = current.atSecond;
      const ms = narrationHoldMs(current.narration, until);
      if (ms > 0) setHold({ atSecond: current.atSecond, ms });
    }
  }, [active, second]);

  // Waiting it out. The clock is stopped for as long as the words take, and
  // released by the timer or by a viewer who has finished reading.
  useEffect(() => {
    if (!hold) return undefined;
    pauseRef.current();
    const timer = setTimeout(() => { setHold(null); playRef.current(); }, hold.ms);
    return () => clearTimeout(timer);
  }, [hold]);

  // Handing back the controls is a state change in the caller, so it cannot
  // happen during the render that discovers the script has run out. The caller
  // holds the closing beat on screen long enough to read before it acts on it.
  useEffect(() => {
    if (finished) finishRef.current();
  }, [finished]);

  return {
    beat,
    progress: active ? Math.min(1, second / DEMONSTRATION_SECONDS) : 0,
    finished,
    ...(active
      ? {
        awaitingAdvance: hold !== null,
        ...(hold ? { onAdvance: () => { setHold(null); playRef.current(); } } : {}),
      }
      : {}),
  };
}
