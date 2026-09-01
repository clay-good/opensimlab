import type { CarbonMonoxideAction } from './carbon-monoxide-reassuring-monitor';

/**
 * Reference transcripts for the carbon-monoxide lesson.
 *
 * The error path is the one this bedside makes easy: the pattern is named, the
 * number is dramatic, and the room moves straight to arguing about hyperbaric
 * oxygen. It is an ordering error rather than a treatment error, because this
 * lesson delivers no treatment — but the step it skips is the one that carries
 * the scene, the source, and the partner who was in the same garage. The
 * recovery path starts from that refusal and still reaches a correct handoff in
 * the same run.
 */
export const CARBON_MONOXIDE_FIXTURES = {
  scenarioId: 'carbon-monoxide-reassuring-monitor', contentVersion: '0.1.0', seed: 5312,
  noAction: [],
  expert: [
    [0, 'reconcile-toxicology-carbon-monoxide-shared-exposure-clock-syncope-symptoms-pulse-ox-and-whole-patient'],
    [1, 'recognize-toxicology-carbon-monoxide-pattern-despite-reassuring-pulse-ox-without-single-value-closure'],
    [2, 'activate-toxicology-carbon-monoxide-source-safety-qualified-oxygen-monitoring-poison-center-and-emergency-ownership'],
    [3, 'review-toxicology-carbon-monoxide-supplied-cooximetry-neurologic-cardiac-and-severity-boundary'],
    [4, 'record-toxicology-carbon-monoxide-selected-patient-hyperbaric-consultation-and-strict-reassessment'],
    [5, 'handoff-toxicology-carbon-monoxide-delayed-neurologic-cardiac-exposure-followup-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-toxicology-carbon-monoxide-shared-exposure-clock-syncope-symptoms-pulse-ox-and-whole-patient'],
    [1, 'recognize-toxicology-carbon-monoxide-pattern-despite-reassuring-pulse-ox-without-single-value-closure'],
    [2, 'review-toxicology-carbon-monoxide-supplied-cooximetry-neurologic-cardiac-and-severity-boundary'],
    [3, 'record-toxicology-carbon-monoxide-selected-patient-hyperbaric-consultation-and-strict-reassessment'],
  ],
  recovery: [
    [0, 'reconcile-toxicology-carbon-monoxide-shared-exposure-clock-syncope-symptoms-pulse-ox-and-whole-patient'],
    [1, 'recognize-toxicology-carbon-monoxide-pattern-despite-reassuring-pulse-ox-without-single-value-closure'],
    [2, 'review-toxicology-carbon-monoxide-supplied-cooximetry-neurologic-cardiac-and-severity-boundary'],
    [3, 'activate-toxicology-carbon-monoxide-source-safety-qualified-oxygen-monitoring-poison-center-and-emergency-ownership'],
    [4, 'review-toxicology-carbon-monoxide-supplied-cooximetry-neurologic-cardiac-and-severity-boundary'],
    [5, 'record-toxicology-carbon-monoxide-selected-patient-hyperbaric-consultation-and-strict-reassessment'],
    [6, 'handoff-toxicology-carbon-monoxide-delayed-neurologic-cardiac-exposure-followup-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, CarbonMonoxideAction])[];
  expert: readonly (readonly [number, CarbonMonoxideAction])[];
  commonError: readonly (readonly [number, CarbonMonoxideAction])[];
  recovery: readonly (readonly [number, CarbonMonoxideAction])[];
};
