import type { PediatricBradycardicArrestAction } from './pediatric-bradycardic-arrest';

/**
 * Reference transcripts for the bradycardic-arrest lesson.
 *
 * This engine case authors no refusable choice and has no unordered pair, so
 * the error paths are made of order and time against a strict line. The
 * common-error path is the delay this lesson exists to refuse: reviewing the
 * causes and the arrest boundary while a bradycardic child with a five-second
 * refill has no resuscitation owner. The recovery path takes that refusal,
 * corrects it, and walks into both time gates before clearing them.
 */
export const PEDIATRIC_BRADYCARDIC_ARREST_FIXTURES = {
  scenarioId: 'pediatric-bradycardic-arrest', contentVersion: '0.1.0', seed: 5647,
  noAction: [],
  expert: [
    [0, 'reconcile-pediatric-bradycardic-arrest-support-and-trajectory'],
    [1, 'recognize-pediatric-bradycardia-with-persistent-compromise'],
    [2, 'activate-pediatric-bradycardic-arrest-qualified-resuscitation-ownership'],
    [3, 'review-pediatric-bradycardic-arrest-causes-pulse-and-arrest-boundary'],
    [4, 'review-pediatric-bradycardic-arrest-pulse-loss-response'],
    [5, 'handoff-pediatric-bradycardic-arrest-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-pediatric-bradycardic-arrest-support-and-trajectory'],
    [1, 'recognize-pediatric-bradycardia-with-persistent-compromise'],
    // Reviewing causes instead of starting, because she still has a pulse.
    [2, 'review-pediatric-bradycardic-arrest-causes-pulse-and-arrest-boundary'],
    [3, 'review-pediatric-bradycardic-arrest-pulse-loss-response'],
  ],
  recovery: [
    // Recognition before there is a trajectory to recognize it against.
    [0, 'recognize-pediatric-bradycardia-with-persistent-compromise'],
    [1, 'reconcile-pediatric-bradycardic-arrest-support-and-trajectory'],
    [2, 'recognize-pediatric-bradycardia-with-persistent-compromise'],
    // And the review before the resuscitation it must not precede.
    [3, 'review-pediatric-bradycardic-arrest-causes-pulse-and-arrest-boundary'],
    [4, 'activate-pediatric-bradycardic-arrest-qualified-resuscitation-ownership'],
    [5, 'review-pediatric-bradycardic-arrest-causes-pulse-and-arrest-boundary'],
    // Then both time gates, taken too early before they are taken correctly.
    [5, 'review-pediatric-bradycardic-arrest-pulse-loss-response'],
    [6, 'review-pediatric-bradycardic-arrest-pulse-loss-response'],
    [6, 'handoff-pediatric-bradycardic-arrest-active-risk'],
    [7, 'handoff-pediatric-bradycardic-arrest-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PediatricBradycardicArrestAction])[];
  expert: readonly (readonly [number, PediatricBradycardicArrestAction])[];
  commonError: readonly (readonly [number, PediatricBradycardicArrestAction])[];
  recovery: readonly (readonly [number, PediatricBradycardicArrestAction])[];
};
