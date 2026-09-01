import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the acetaminophen lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type AcetaminophenSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['toxicologyAcetaminophenAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no nomogram
 * plotted, no dose chosen, no stopping determined, no liver injury excluded —
 * which are constants rather than observations.
 */
export type AcetaminophenProgress = Pick<AcetaminophenSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'evidenceAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const ACETAMINOPHEN_ACTIONS = [
  'reconcile-toxicology-acetaminophen-product-ingestion-window-clock-symptoms-and-whole-patient',
  'recognize-toxicology-acetaminophen-acute-timed-pattern-and-nomogram-applicability-boundary',
  'activate-toxicology-acetaminophen-poison-center-emergency-monitoring-and-nonjudgmental-safety-ownership',
  'review-toxicology-acetaminophen-supplied-timed-level-nomogram-position-liver-and-coingestion-boundary',
  'record-toxicology-acetaminophen-bounded-qualified-team-acetylcysteine-intent-and-strict-later-review',
  'handoff-toxicology-acetaminophen-serial-level-liver-failure-stopping-safety-and-active-risk',
] as const;

export type AcetaminophenAction = (typeof ACETAMINOPHEN_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike scenario. */
export function supportsAcetaminophen(scenario: Scenario): boolean {
  return scenario.metadata.id === 'acetaminophen-clock-and-nomogram'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'acetaminophen-clock-and-nomogram-transition').length === 2
    && scenario.timeline.filter((event) => event.target === 'acetaminophen-clock-and-nomogram-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === ACETAMINOPHEN_ACTIONS.join('|');
}
