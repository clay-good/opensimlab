/**
 * The scenario registry.
 *
 * Scenarios are data, validated against the published schema, and the
 * application never names one directly: the route, the briefing, the governance
 * records and the structured data all read this list. Adding a scenario means
 * adding a file and a line here, and nothing else
 * (platform/module-contract → a module supplies its own content).
 */

import type { Scenario } from './types';
import { ROUTINE_INDUCTION } from './routine-induction';
import { RAPID_DESATURATION } from './rapid-desaturation';
import { HYPOTENSION_AFTER_INDUCTION } from './hypotension-after-induction';
import { BRONCHOSPASM } from './bronchospasm';
import { UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE } from './unexpected-intraoperative-hemorrhage';
import { RAPID_SEQUENCE_INDUCTION } from './rapid-sequence-induction';
import { AWARENESS_UNDER_PARALYSIS } from './awareness-under-paralysis';
import { LARYNGOSPASM_AFTER_AIRWAY_STIMULATION } from './laryngospasm-after-airway-stimulation';

export const SCENARIOS: readonly Scenario[] = [
  ROUTINE_INDUCTION,
  RAPID_DESATURATION,
  HYPOTENSION_AFTER_INDUCTION,
  BRONCHOSPASM,
  UNEXPECTED_INTRAOPERATIVE_HEMORRHAGE,
  RAPID_SEQUENCE_INDUCTION,
  AWARENESS_UNDER_PARALYSIS,
  LARYNGOSPASM_AFTER_AIRWAY_STIMULATION,
];

/** The scenario a learner meets first. */
export const DEFAULT_SCENARIO_ID = ROUTINE_INDUCTION.metadata.id;

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((scenario) => scenario.metadata.id === id);
}

/** Ordered by difficulty, so the directory reads as a path rather than a pile. */
export const DIFFICULTY_ORDER: Record<Scenario['metadata']['difficulty'], number> = {
  introductory: 0,
  intermediate: 1,
  advanced: 2,
};

export function scenariosByDifficulty(): Scenario[] {
  return [...SCENARIOS].sort(
    (a, b) => DIFFICULTY_ORDER[a.metadata.difficulty] - DIFFICULTY_ORDER[b.metadata.difficulty],
  );
}
