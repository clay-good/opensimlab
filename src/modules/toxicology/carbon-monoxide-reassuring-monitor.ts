import type { Scenario } from '@anesthesia/scenarios/types';
import type { EquipmentSnapshot } from '@platform/kernel/protocol';

/**
 * The observed state and the six controls of the carbon-monoxide lesson.
 *
 * The model lives in the shared engine, which is where this lesson was built.
 * What was missing was a name for the state it already publishes, so a tutor
 * and a worked example can read the learner's own recorded steps.
 */
export type CarbonMonoxideSnapshot =
  NonNullable<EquipmentSnapshot['resuscitation']['toxicologyCarbonMonoxideAssessment']>;

/**
 * The six recorded steps, and only those.
 *
 * The rest of the snapshot lists what this lesson does not do — no sample
 * acquired, no chamber chosen, no eligibility determined, no delayed sequelae
 * excluded — which are constants rather than observations.
 */
export type CarbonMonoxideProgress = Pick<CarbonMonoxideSnapshot,
  'trajectoryAtTick' | 'recognitionAtTick' | 'supportAtTick'
  | 'severityAtTick' | 'reassessmentAtTick' | 'handoffAtTick'>;

export const CARBON_MONOXIDE_ACTIONS = [
  'reconcile-toxicology-carbon-monoxide-shared-exposure-clock-syncope-symptoms-pulse-ox-and-whole-patient',
  'recognize-toxicology-carbon-monoxide-pattern-despite-reassuring-pulse-ox-without-single-value-closure',
  'activate-toxicology-carbon-monoxide-source-safety-qualified-oxygen-monitoring-poison-center-and-emergency-ownership',
  'review-toxicology-carbon-monoxide-supplied-cooximetry-neurologic-cardiac-and-severity-boundary',
  'record-toxicology-carbon-monoxide-selected-patient-hyperbaric-consultation-and-strict-reassessment',
  'handoff-toxicology-carbon-monoxide-delayed-neurologic-cardiac-exposure-followup-and-active-risk',
] as const;

export type CarbonMonoxideAction = (typeof CARBON_MONOXIDE_ACTIONS)[number];

/** The same identity guard the engine applies, so nothing reads a look-alike scenario. */
export function supportsCarbonMonoxide(scenario: Scenario): boolean {
  return scenario.metadata.id === 'carbon-monoxide-reassuring-monitor'
    && scenario.timeline.every((event) => event.type === 'narrative')
    && scenario.timeline.filter((event) => event.target === 'carbon-monoxide-reassuring-monitor-transition').length === 2
    && scenario.timeline.filter((event) => event.target === 'carbon-monoxide-reassuring-monitor-transition-boundary').length === 1
    && scenario.metadata.objectives.map((objective) => objective.id)
      .join('|') === CARBON_MONOXIDE_ACTIONS.join('|');
}
