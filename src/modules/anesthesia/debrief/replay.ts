/**
 * Counterfactual replay (learning/pedagogy → Counterfactual is computed, not asserted).
 *
 * A claim like "giving a vasopressor sixty seconds earlier would have shortened
 * that episode" is produced by RE-RUNNING the deterministic engine on the
 * modified action list, and the resulting trace is available to inspect. It is
 * never asserted from a rule.
 */

import { TICKS_PER_SECOND } from '@platform/clock/simulation-clock';
import type { LearnerAction } from '@platform/kernel/protocol';
import { AnesthesiaEngine, type Scenario } from '@anesthesia/engine';
import type { HistorySample } from '@platform/session/session-store';
import type { CounterfactualRequest, CounterfactualResult } from './analysis';

export interface ReplayOptions {
  readonly scenario: Scenario;
  readonly seed: number;
  readonly practiceRegion: string;
  readonly ticks: number;
}

/** Run the engine over an action list and return the history it produces. */
export function replay(actions: readonly LearnerAction[], options: ReplayOptions): HistorySample[] {
  const engine = new AnesthesiaEngine({
    scenario: options.scenario, seed: options.seed, practiceRegion: options.practiceRegion,
  });
  const ordered = [...actions].sort((a, b) => a.tick - b.tick);
  const history: HistorySample[] = [];
  let next = 0;
  for (let tick = 0; tick < options.ticks; tick += 1) {
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

/** Evaluate one counterfactual against the actual run. */
export function evaluateCounterfactual(
  request: CounterfactualRequest,
  actualHistory: readonly HistorySample[],
  actions: readonly LearnerAction[],
  options: ReplayOptions,
): CounterfactualResult {
  const modifiedActions = request.modify(actions);
  const counterfactualHistory = replay(modifiedActions, options);
  const actual = request.measure(actualHistory);
  const counterfactual = request.measure(counterfactualHistory);
  return {
    id: request.id,
    claim: request.claim,
    actual,
    counterfactual,
    unit: request.unit,
    better: counterfactual < actual,
    modifiedActions,
  };
}

/**
 * Compare two of the learner's OWN runs of the same scenario, on this device only
 * (learning/pedagogy → Practice Is Repeatable And Comparable To Oneself).
 */
export interface SelfComparison {
  readonly parameter: string;
  readonly firstRun: readonly [number, number][];
  readonly secondRun: readonly [number, number][];
  /** The first simulated second at which the two runs diverge meaningfully. */
  readonly divergesAtSeconds: number | null;
}

export function compareRuns(
  first: readonly HistorySample[],
  second: readonly HistorySample[],
  parameter: string,
  tolerance = 3,
): SelfComparison {
  const series = (history: readonly HistorySample[]): [number, number][] =>
    history.map((sample) => [sample.tick / TICKS_PER_SECOND, sample.state[parameter] ?? 0]);
  const a = series(first);
  const b = series(second);
  let diverges: number | null = null;
  for (let i = 0; i < Math.min(a.length, b.length); i += 1) {
    if (Math.abs((a[i]?.[1] ?? 0) - (b[i]?.[1] ?? 0)) > tolerance) { diverges = a[i]?.[0] ?? null; break; }
  }
  return { parameter, firstRun: a, secondRun: b, divergesAtSeconds: diverges };
}
