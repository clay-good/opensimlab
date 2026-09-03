import type { IntracranialHypertensionAction } from './intracranial-hypertension';

/**
 * Reference transcripts for the intracranial-hypertension lesson.
 *
 * The common-error path is the one an ICP of 28 invites: the crisis is
 * recognised and the learner reaches straight for first-tier protection,
 * skipping the context review that finds the rotated neck and the dyssynchrony
 * the protection step is supposed to act on. The recovery path skips each
 * intervening step in turn, is refused for both, and still completes from the
 * same positions.
 */
export const INTRACRANIAL_HYPERTENSION_FIXTURES = {
  scenarioId: 'intracranial-hypertension', contentVersion: '0.1.0', seed: 6407,
  noAction: [],
  expert: [
    [0, 'recognize-intracranial-hypertension'],
    [1, 'review-intracranial-hypertension-context'],
    [2, 'activate-first-tier-brain-protection'],
    [3, 'activate-individualized-hyperosmolar-rescue'],
    [4, 'reassess-intracranial-hypertension-trajectory'],
  ],
  commonError: [
    [0, 'recognize-intracranial-hypertension'],
    // Straight to treating it, without asking what is causing it.
    [1, 'activate-first-tier-brain-protection'],
    [2, 'activate-individualized-hyperosmolar-rescue'],
  ],
  recovery: [
    // The context before the pattern has been recognised.
    [0, 'review-intracranial-hypertension-context'],
    [1, 'recognize-intracranial-hypertension'],
    [2, 'review-intracranial-hypertension-context'],
    // The osmotherapy before the free interventions that precede it.
    [3, 'activate-individualized-hyperosmolar-rescue'],
    [4, 'activate-first-tier-brain-protection'],
    [5, 'activate-individualized-hyperosmolar-rescue'],
    [6, 'reassess-intracranial-hypertension-trajectory'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, IntracranialHypertensionAction])[];
  expert: readonly (readonly [number, IntracranialHypertensionAction])[];
  commonError: readonly (readonly [number, IntracranialHypertensionAction])[];
  recovery: readonly (readonly [number, IntracranialHypertensionAction])[];
};
