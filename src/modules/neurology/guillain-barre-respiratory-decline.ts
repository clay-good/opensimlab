import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the Guillain-Barré lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type GbsSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neurologyGbsAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no mechanics
 * or blood gas acquired, no cardiac monitoring interpreted, no rhythm or
 * pressure treatment delivered, and in particular no diagnosis proven — which
 * are constants rather than observations.
 */
export type GbsProgress = Pick<GbsSnapshot,
  'trajectoryAtTick' | 'evidenceAtTick' | 'recognitionAtTick'
  | 'ownershipAtTick' | 'laterAtTick' | 'handoffAtTick'>;

export const GBS_ACTIONS = [
  'reconcile-neurology-gbs-clock-ascending-weakness-bulbar-respiratory-autonomic-and-whole-patient',
  'review-neurology-gbs-supportive-evidence-mimics-and-diagnostic-boundary',
  'recognize-neurology-gbs-high-risk-respiratory-decline-without-score-or-single-cutoff',
  'activate-neurology-gbs-qualified-neurocritical-respiratory-airway-and-cardiac-ownership',
  'review-neurology-gbs-strict-later-respiratory-bulbar-and-autonomic-trajectory',
  'handoff-neurology-gbs-airway-dysautonomia-treatment-recurrence-and-active-risk',
] as const;

export type GbsAction = (typeof GBS_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Like the myasthenic lesson it carries three narratives rather than two,
 * because the supplied mechanics and the monitored autonomic hour each need a
 * panel. That shape is required by name rather than tolerated.
 */
export function supportsGbs(scenario: Scenario): boolean {
  return scenario.metadata.id === 'guillain-barre-respiratory-decline'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'guillain-barre-respiratory-decline-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'guillain-barre-respiratory-decline-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === GBS_ACTIONS.join('|');
}
