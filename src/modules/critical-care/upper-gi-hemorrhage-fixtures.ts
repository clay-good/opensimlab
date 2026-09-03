import type { UpperGiHemorrhageAction } from './upper-gi-hemorrhage';

/**
 * Reference transcripts for the recurrent upper-GI-hemorrhage lesson.
 *
 * The common-error path is the one urgency invites: the recurrence is
 * recognised and the learner records resuscitation immediately, skipping the
 * review that keeps the airway, the coagulation and the alternate sources open
 * and separates a variceal bleed from this one. The recovery path skips each
 * intervening step in turn, is refused for both, and still completes from the
 * same positions.
 */
export const UPPER_GI_HEMORRHAGE_FIXTURES = {
  scenarioId: 'upper-gi-hemorrhage', contentVersion: '0.1.0', seed: 4586,
  noAction: [],
  expert: [
    [0, 'recognize-recurrent-upper-gi-hemorrhage'],
    [1, 'review-upper-gi-hemorrhage-pattern'],
    [2, 'record-upper-gi-hemorrhage-resuscitation'],
    [3, 'activate-repeat-endoscopy-pathway'],
    [4, 'reassess-upper-gi-hemorrhage-trajectory'],
  ],
  commonError: [
    [0, 'recognize-recurrent-upper-gi-hemorrhage'],
    // Straight to resuscitating, without saying what else could be bleeding.
    [1, 'record-upper-gi-hemorrhage-resuscitation'],
    [2, 'activate-repeat-endoscopy-pathway'],
  ],
  recovery: [
    // The pattern review before the recurrence has been recognised.
    [0, 'review-upper-gi-hemorrhage-pattern'],
    [1, 'recognize-recurrent-upper-gi-hemorrhage'],
    [2, 'review-upper-gi-hemorrhage-pattern'],
    // The endoscopy pathway before the resuscitation it runs alongside.
    [3, 'activate-repeat-endoscopy-pathway'],
    [4, 'record-upper-gi-hemorrhage-resuscitation'],
    [5, 'activate-repeat-endoscopy-pathway'],
    [6, 'reassess-upper-gi-hemorrhage-trajectory'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, UpperGiHemorrhageAction])[];
  expert: readonly (readonly [number, UpperGiHemorrhageAction])[];
  commonError: readonly (readonly [number, UpperGiHemorrhageAction])[];
  recovery: readonly (readonly [number, UpperGiHemorrhageAction])[];
};
