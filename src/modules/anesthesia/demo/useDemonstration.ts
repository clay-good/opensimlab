/**
 * Driving the demonstration from the real clock.
 *
 * The beats are keyed to simulated seconds, and simulated time is the session's,
 * so the demonstration cannot drift away from what is on screen: if the learner
 * pauses, the narration pauses with them, and if they take the controls the
 * remaining beats simply stop firing. Nothing here is a separate timeline.
 */

import { useEffect, useRef, useState } from 'react';
import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { LearnerAction } from '@platform/kernel/protocol';
import {
  DEMONSTRATION_SECONDS, beatAt, beatsToFire, type DemonstrationBeat,
} from './demonstration';

export interface DemonstrationController {
  /** The beat the viewer should be reading, or null when not demonstrating. */
  readonly beat: DemonstrationBeat | null;
  /** How far through, 0 to 1, for a progress indicator. */
  readonly progress: number;
  /** True once the last beat has been reached. */
  readonly finished: boolean;
}

export interface DemonstrationOptions {
  readonly active: boolean;
  readonly tick: number;
  readonly act: (action: Omit<LearnerAction, 'tick'>) => void;
  /** Called when the script runs out, so the caller can hand back the controls. */
  readonly onFinished: () => void;
}

export function useDemonstration(options: DemonstrationOptions): DemonstrationController {
  const { active, tick, act, onFinished } = options;
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
  actRef.current = act;
  finishRef.current = onFinished;

  useEffect(() => {
    if (!active) {
      firedThrough.current = 0;
      setBeat(null);
      return;
    }
    // A reset winds the clock back; the script should start again with it.
    if (second < firedThrough.current) firedThrough.current = 0;

    for (const pending of beatsToFire(firedThrough.current, second)) {
      if (pending.action) actRef.current(pending.action);
    }
    firedThrough.current = second;
    setBeat(beatAt(second));
  }, [active, second]);

  // Handing back the controls is a state change in the caller, so it cannot
  // happen during the render that discovers the script has run out.
  useEffect(() => {
    if (finished) finishRef.current();
  }, [finished]);

  return {
    beat,
    progress: active ? Math.min(1, second / DEMONSTRATION_SECONDS) : 0,
    finished,
  };
}
