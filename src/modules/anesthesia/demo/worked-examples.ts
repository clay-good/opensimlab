/**
 * Does this lesson offer a worked example?
 *
 * Asked from the prebrief and from the route, both of which are in the shared
 * cockpit chunk. It used to be answered by running each module's
 * `supports<Lesson>Demonstration` predicate, which meant importing all 242
 * demonstration modules — and a demonstration module carries its narration. So
 * the shared chunk held every lesson's script, and a lesson added to any module
 * grew the download for all sixteen.
 *
 * The question is only *whether*, so it is answered from an inert list of keys.
 * The predicates remain the source of truth in `worked-example-predicates.ts`,
 * and `tests/unit/worked-example-offer.test.ts` regenerates the list from them
 * and from the real scenario catalogues, so the two cannot drift.
 */
import type { Scenario } from '@anesthesia/scenarios/types';
import { WORKED_EXAMPLE_KEYS } from './worked-example-keys';

const OFFERED = new Set(WORKED_EXAMPLE_KEYS);

/** True when this exact scenario version has a worked example to offer. */
export function offersWorkedExample(scenario: Scenario, moduleId: string): boolean {
  return OFFERED.has(`${moduleId}:${scenario.metadata.id}@${scenario.metadata.version}`);
}

/** The module ids that ship at least one worked example, for tests and copy. */
export const WORKED_EXAMPLE_MODULE_IDS = [
  ...new Set(WORKED_EXAMPLE_KEYS.map((key) => key.slice(0, key.indexOf(':')))),
];
