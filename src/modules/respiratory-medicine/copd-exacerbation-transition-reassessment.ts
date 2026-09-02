import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the five controls of the COPD-transition lesson.
 *
 * The model lives in the shared engine. What was missing was a name for the
 * state it already publishes, so a tutor and a worked example can read the
 * learner's own recorded steps.
 */
export type CopdTransitionSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['copdTransitionAssessment']>;

/**
 * The five recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no treatment or
 * oxygen delivered, no long-term oxygen eligibility determined, no regimen
 * selected, no technique performed, no rehabilitation enrolled and no
 * appointment guaranteed — which are constants rather than observations.
 */
export type CopdTransitionProgress = Pick<CopdTransitionSnapshot,
  'readinessAtTick' | 'respiratoryNeedsAtTick' | 'medicationAtTick'
  | 'coordinationAtTick' | 'handoffAtTick'>;

export const COPD_TRANSITION_ACTIONS = [
  'reconcile-copd-exacerbation-recovery-and-readiness',
  'review-copd-exacerbation-residual-respiratory-and-oxygen-needs',
  'review-copd-exacerbation-maintenance-and-acute-medication-plan',
  'coordinate-copd-exacerbation-rehabilitation-self-management-and-follow-up',
  'handoff-copd-exacerbation-transition-reassessment',
] as const;

export type CopdTransitionAction = (typeof COPD_TRANSITION_ACTIONS)[number];

/**
 * The same identity guard the engine applies, so nothing reads a look-alike
 * scenario.
 *
 * As in the other lessons of this module the timeline is not all narrative: a
 * single authored lower-airway-obstruction waveform cue drives the monitor,
 * and it is required by name rather than tolerated.
 */
export function supportsCopdTransition(scenario: Scenario): boolean {
  return scenario.metadata.id === 'copd-exacerbation-transition-reassessment'
    && scenario.timeline.every((event) => event.type === 'narrative' || event.type === 'obstruction')
    && scenario.timeline.filter((event) => event.type === 'obstruction').length === 1
    && scenario.timeline.filter((event) => event.target === 'copd-exacerbation-transition-reassessment').length === 3
    && scenario.timeline.filter((event) => event.target === 'copd-exacerbation-transition-reassessment-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === COPD_TRANSITION_ACTIONS.join('|');
}
