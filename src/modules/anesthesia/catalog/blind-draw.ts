/**
 * The blind draw (learning/deliberate-practice → blind draw), as a catalog
 * operation only.
 *
 * NOT WIRED TO ANY SURFACE, on purpose. The draw is the one place a learner has
 * nothing but the pre-start briefing to judge a case by, and the content note
 * that briefing must carry has been read for 9 of 256 lessons. Until the rest
 * are surveyed, offering the draw would spring exactly the distress the note
 * exists to prevent. What is here is the logic that survey will unblock, held to
 * its two properties by tests: the draw is reproducible from the seed and pool a
 * transcript records, and nothing withheld reaches the pre-start briefing.
 */
import { createRng } from '@platform/kernel/rng';
import type { Scenario } from '@anesthesia/scenarios/types';
import { attemptIsOf, type PracticeAttempt } from './practice-history';

export interface PoolEntry {
  readonly moduleId: string;
  readonly scenario: Scenario;
}

/** What a transcript records so the draw can be reproduced. */
export interface BlindDrawRecord {
  readonly seed: number;
  /** The pool as `module:scenario` keys, in the canonical order the draw used. */
  readonly pool: readonly string[];
  readonly unseenOnly: boolean;
}

const keyOf = (entry: PoolEntry) => `${entry.moduleId}:${entry.scenario.metadata.id}`;

/**
 * Draw one scenario uniformly from the pool, using the session seed.
 *
 * The pool is sorted first, so the same seed over the same set gives the same
 * scenario whatever order the caller listed it in. With `unseenOnly` (the
 * default), scenarios already in local history are left out; when that leaves
 * nothing, the answer is null rather than a quiet fallback to a seen case.
 */
export function blindDraw(
  pool: readonly PoolEntry[],
  seed: number,
  history: readonly PracticeAttempt[],
  options: { readonly unseenOnly?: boolean } = {},
): { readonly entry: PoolEntry; readonly record: BlindDrawRecord } | null {
  const unseenOnly = options.unseenOnly ?? true;
  const canonical = [...new Map(pool.map((entry) => [keyOf(entry), entry])).values()]
    .sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
  const eligible = unseenOnly
    ? canonical.filter((entry) => !history.some((attempt) => attemptIsOf(attempt, entry.moduleId, entry.scenario.metadata.id)))
    : canonical;
  if (eligible.length === 0) return null;
  const index = Math.floor(createRng(seed, 'blind-draw').next() * eligible.length);
  return { entry: eligible[index]!, record: { seed, pool: canonical.map(keyOf), unseenOnly } };
}

/**
 * The pre-start briefing for a drawn scenario: the fields a learner needs to
 * decline a case without learning what it is, and nothing else. The design
 * also names the environment and the fidelity class; neither exists in the
 * scenario schema, so neither can be shown.
 */
export interface BlindBriefing {
  readonly contentNote: string | null;
  readonly estimatedMinutes: number;
  readonly maturity: Scenario['metadata']['maturity'];
}

export function blindBriefing(scenario: Scenario): BlindBriefing {
  return {
    contentNote: scenario.metadata.contentNote ?? null,
    estimatedMinutes: scenario.metadata.estimatedMinutes,
    maturity: scenario.metadata.maturity,
  };
}
