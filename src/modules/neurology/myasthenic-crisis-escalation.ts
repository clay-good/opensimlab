import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the myasthenic-crisis lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type MyastheniaSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neurologyMyasthenicCrisisAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no mechanics
 * or blood gas acquired, no airway procedure performed, and in particular no
 * trigger proven — which are constants rather than observations.
 */
export type MyastheniaProgress = Pick<MyastheniaSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'ownershipAtTick'
  | 'causesAtTick' | 'laterAtTick' | 'handoffAtTick'>;

export const MYASTHENIA_ACTIONS = [
  'reconcile-neurology-myasthenic-crisis-clock-fatigability-bulbar-respiratory-and-whole-patient',
  'recognize-neurology-impending-myasthenic-crisis-without-spo2-or-single-cutoff-reassurance',
  'activate-neurology-myasthenic-crisis-qualified-neurocritical-and-airway-capable-ownership',
  'review-neurology-myasthenic-crisis-secretion-aspiration-infection-medication-and-alternative-causes',
  'review-neurology-myasthenic-crisis-strict-later-bulbar-ventilatory-and-supplied-airway-trajectory',
  'handoff-neurology-myasthenic-crisis-trigger-treatment-weaning-recurrence-and-active-risk',
] as const;

export type MyastheniaAction = (typeof MYASTHENIA_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * Unlike its neighbours this lesson carries three narratives rather than two,
 * because the supplied respiratory mechanics need a panel of their own. That
 * shape is required by name rather than tolerated.
 */
export function supportsMyasthenia(scenario: Scenario): boolean {
  return scenario.metadata.id === 'myasthenic-crisis-escalation'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'myasthenic-crisis-escalation-reassessment').length === 2
    && scenario.timeline.filter((event) => event.target === 'myasthenic-crisis-escalation-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === MYASTHENIA_ACTIONS.join('|');
}
