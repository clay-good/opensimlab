import type { PediatricSvtAction } from './pediatric-supraventricular-tachycardia';

/**
 * Reference transcripts for the pediatric SVT lesson.
 *
 * This engine case authors no refusable choice and has no unordered pair, so
 * the error paths are made of order and time against a strict line. The
 * common-error path reviews the support and deterioration risks while a
 * forty-five-minute rhythm still has no owner. The recovery path takes that
 * refusal, corrects it, and walks into both time gates before clearing them.
 */
export const PEDIATRIC_SVT_FIXTURES = {
  scenarioId: 'pediatric-supraventricular-tachycardia', contentVersion: '0.1.0', seed: 4903,
  noAction: [],
  expert: [
    [0, 'reconcile-pediatric-svt-clock-rhythm-and-whole-child'],
    [1, 'recognize-pediatric-svt-with-perfusion-compromise'],
    [2, 'activate-pediatric-svt-qualified-rhythm-care-and-resuscitation-ownership'],
    [3, 'review-pediatric-svt-support-causes-heart-failure-and-deterioration-boundary'],
    [4, 'review-pediatric-svt-later-response'],
    [5, 'handoff-pediatric-svt-recurrence-cardiology-and-caregiver-risk'],
  ],
  commonError: [
    [0, 'reconcile-pediatric-svt-clock-rhythm-and-whole-child'],
    [1, 'recognize-pediatric-svt-with-perfusion-compromise'],
    // Thinking about heart failure while the rhythm has no owner.
    [2, 'review-pediatric-svt-support-causes-heart-failure-and-deterioration-boundary'],
    [3, 'review-pediatric-svt-later-response'],
  ],
  recovery: [
    // Recognition before there is a trajectory to recognize it against.
    [0, 'recognize-pediatric-svt-with-perfusion-compromise'],
    [1, 'reconcile-pediatric-svt-clock-rhythm-and-whole-child'],
    [2, 'recognize-pediatric-svt-with-perfusion-compromise'],
    // And the review before the ownership it must not precede.
    [3, 'review-pediatric-svt-support-causes-heart-failure-and-deterioration-boundary'],
    [4, 'activate-pediatric-svt-qualified-rhythm-care-and-resuscitation-ownership'],
    [5, 'review-pediatric-svt-support-causes-heart-failure-and-deterioration-boundary'],
    // Then both time gates, taken too early before they are taken correctly.
    [5, 'review-pediatric-svt-later-response'],
    [6, 'review-pediatric-svt-later-response'],
    [6, 'handoff-pediatric-svt-recurrence-cardiology-and-caregiver-risk'],
    [7, 'handoff-pediatric-svt-recurrence-cardiology-and-caregiver-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PediatricSvtAction])[];
  expert: readonly (readonly [number, PediatricSvtAction])[];
  commonError: readonly (readonly [number, PediatricSvtAction])[];
  recovery: readonly (readonly [number, PediatricSvtAction])[];
};
