/**
 * The engine half of counterfactual replay.
 *
 * This module constructs `AnesthesiaEngine`, so importing it pulls every lesson
 * model into whatever bundle imports it. That is why it is a separate file from
 * `replay.ts`: the worker imports this, and the main thread does not. Before the
 * split, `replay.ts` was imported by the debrief and by the instructor review
 * page, so the whole engine — and with it every scenario's authored prose —
 * shipped twice in the offline precache, once in `solver.worker` and once again
 * in the session bundle. The main thread now asks the worker, which already has
 * an engine, to do this instead.
 *
 * The tests drive this directly. They run in Node, where there is no worker, and
 * what they are checking is the engine's behaviour rather than the transport.
 */

import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { LearnerAction } from '@platform/kernel/protocol';
import { AnesthesiaEngine } from '@anesthesia/engine';
import type { HistorySample } from '@platform/session/session-store';
import { MAX_REPLAY_TICKS, type ReplayOptions } from './replay';

/** Run the engine over an action list and return the history it produces. */
export function replay(actions: readonly LearnerAction[], options: ReplayOptions): HistorySample[] {
  const engine = new AnesthesiaEngine({
    scenario: options.scenario, seed: options.seed, practiceRegion: options.practiceRegion,
  });
  const ordered = [...actions].sort((a, b) => a.tick - b.tick);
  const history: HistorySample[] = [];
  let next = 0;
  // A non-finite or negative count runs nothing rather than looping forever or
  // throwing from inside a render.
  const limit = Number.isFinite(options.ticks)
    ? Math.min(Math.max(Math.trunc(options.ticks), 0), MAX_REPLAY_TICKS)
    : 0;
  for (let tick = 0; tick < limit; tick += 1) {
    while (next < ordered.length && (ordered[next]?.tick ?? Infinity) <= tick) {
      engine.apply(ordered[next]!);
      next += 1;
    }
    const result = engine.step();
    if (tick % TICKS_PER_SECOND === 0) {
      history.push({ tick: result.tick, state: result.state, concentrations: result.concentrations });
    }
  }
  return history;
}
