import type { PediatricAnaphylaxisAction } from './pediatric-anaphylaxis';

/**
 * Reference transcripts for the pediatric anaphylaxis lesson.
 *
 * This engine case authors no refusable choice and has no unordered pair, so
 * the error paths are made of order and time against a strict line. The
 * common-error path is the one the engine's ordering exists to refuse:
 * reaching for the airway, asthma and cause review while the child is still
 * compromised and the second dose has no owner. The recovery path takes that
 * refusal, corrects it, and walks into both time gates before clearing them.
 */
export const PEDIATRIC_ANAPHYLAXIS_FIXTURES = {
  scenarioId: 'pediatric-anaphylaxis', contentVersion: '0.1.0', seed: 6832,
  noAction: [],
  expert: [
    [0, 'reconcile-pediatric-anaphylaxis-exposure-care-and-whole-child'],
    [1, 'recognize-pediatric-anaphylaxis-persistent-abc-compromise'],
    [2, 'activate-pediatric-anaphylaxis-qualified-repeat-first-line-and-resuscitation-ownership'],
    [3, 'review-pediatric-anaphylaxis-airway-asthma-causes-and-refractory-boundary'],
    [4, 'review-pediatric-anaphylaxis-later-response'],
    [5, 'handoff-pediatric-anaphylaxis-observation-allergy-and-caregiver-risk'],
  ],
  commonError: [
    [0, 'reconcile-pediatric-anaphylaxis-exposure-care-and-whole-child'],
    [1, 'recognize-pediatric-anaphylaxis-persistent-abc-compromise'],
    // Thinking about asthma overlap instead of giving the second dose.
    [2, 'review-pediatric-anaphylaxis-airway-asthma-causes-and-refractory-boundary'],
    [3, 'review-pediatric-anaphylaxis-later-response'],
  ],
  recovery: [
    // Recognition before there is a trajectory to recognize it against.
    [0, 'recognize-pediatric-anaphylaxis-persistent-abc-compromise'],
    [1, 'reconcile-pediatric-anaphylaxis-exposure-care-and-whole-child'],
    [2, 'recognize-pediatric-anaphylaxis-persistent-abc-compromise'],
    // And the review before the dose it must not precede.
    [3, 'review-pediatric-anaphylaxis-airway-asthma-causes-and-refractory-boundary'],
    [4, 'activate-pediatric-anaphylaxis-qualified-repeat-first-line-and-resuscitation-ownership'],
    [5, 'review-pediatric-anaphylaxis-airway-asthma-causes-and-refractory-boundary'],
    // Then both time gates, taken too early before they are taken correctly.
    [5, 'review-pediatric-anaphylaxis-later-response'],
    [6, 'review-pediatric-anaphylaxis-later-response'],
    [6, 'handoff-pediatric-anaphylaxis-observation-allergy-and-caregiver-risk'],
    [7, 'handoff-pediatric-anaphylaxis-observation-allergy-and-caregiver-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PediatricAnaphylaxisAction])[];
  expert: readonly (readonly [number, PediatricAnaphylaxisAction])[];
  commonError: readonly (readonly [number, PediatricAnaphylaxisAction])[];
  recovery: readonly (readonly [number, PediatricAnaphylaxisAction])[];
};
