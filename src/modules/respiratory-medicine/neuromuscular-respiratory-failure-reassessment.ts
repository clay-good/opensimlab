import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the neuromuscular
 * respiratory-failure lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps rather than a script of their own.
 */
export type NeuromuscularRespiratoryFailureSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['neuromuscularRespiratoryFailureAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — nobody
 * examined, no mechanics, cough test, blood gas or imaging acquired or
 * interpreted, no support device, cough assistance, airway procedure or
 * nutrition selected — which are constants rather than observations.
 */
export type NeuromuscularRespiratoryFailureProgress = Pick<NeuromuscularRespiratoryFailureSnapshot,
  'trajectoryAtTick' | 'failureAtTick' | 'escalationAtTick'
  | 'reviewAtTick' | 'ownershipAtTick' | 'handoffAtTick'>;

export const NEUROMUSCULAR_RESPIRATORY_FAILURE_ACTIONS = [
  'reconcile-neuromuscular-respiratory-failure-trajectory',
  'recognize-neuromuscular-respiratory-failure',
  'activate-neuromuscular-respiratory-failure-escalation',
  'review-neuromuscular-respiratory-failure-bulbar-cough-and-alternatives',
  'coordinate-neuromuscular-respiratory-failure-goals-and-ownership',
  'handoff-neuromuscular-respiratory-failure-reassessment',
] as const;

export type NeuromuscularRespiratoryFailureAction = (typeof NEUROMUSCULAR_RESPIRATORY_FAILURE_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 */
export function supportsNeuromuscularRespiratoryFailure(scenario: Scenario): boolean {
  return scenario.metadata.id === 'neuromuscular-respiratory-failure-reassessment'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'neuromuscular-respiratory-failure-reassessment').length === 3
    && scenario.timeline.filter((event) => event.target === 'neuromuscular-respiratory-failure-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === NEUROMUSCULAR_RESPIRATORY_FAILURE_ACTIONS.join('|');
}
