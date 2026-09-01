import type { HhsOsmolalityAction } from './hhs-osmolality';

/**
 * Reference transcripts for the HHS trajectory lesson.
 *
 * The error path is the one this lesson is built around: reading the low
 * ketones as reassurance and closing on the later report as recovery, without
 * having connected the four-day trajectory first. The engine refuses both as
 * ordering violations, and the recovery path starts from those same refusals.
 */
export const HHS_OSMOLALITY_FIXTURES = {
  scenarioId: 'hhs-osmolality-trajectory', contentVersion: '0.1.0', seed: 4912,
  noAction: [],
  expert: [
    [0, 'activate-hhs-endocrine-resuscitation-nursing-renal-cardiac-and-monitoring-support'],
    [1, 'reconcile-hhs-glucose-sodium-osmolality-ketone-perfusion-cognition-and-whole-person'],
    [2, 'recognize-hhs-hyperosmolality-without-glucose-sodium-or-ketone-only-closure'],
    [3, 'review-qualified-hhs-cautious-correction-osmolality-potassium-monitoring-and-harm-prevention'],
    [4, 'review-hhs-fixed-four-hour-qualified-report'],
    [5, 'handoff-hhs-osmolality-cognition-fluid-electrolyte-precipitant-and-outcome-risk'],
  ],
  commonError: [
    [0, 'recognize-hhs-hyperosmolality-without-glucose-sodium-or-ketone-only-closure'],
    [1, 'review-hhs-fixed-four-hour-qualified-report'],
    [2, 'handoff-hhs-osmolality-cognition-fluid-electrolyte-precipitant-and-outcome-risk'],
  ],
  recovery: [
    [0, 'recognize-hhs-hyperosmolality-without-glucose-sodium-or-ketone-only-closure'],
    [1, 'handoff-hhs-osmolality-cognition-fluid-electrolyte-precipitant-and-outcome-risk'],
    [2, 'activate-hhs-endocrine-resuscitation-nursing-renal-cardiac-and-monitoring-support'],
    [3, 'reconcile-hhs-glucose-sodium-osmolality-ketone-perfusion-cognition-and-whole-person'],
    [4, 'recognize-hhs-hyperosmolality-without-glucose-sodium-or-ketone-only-closure'],
    [5, 'review-qualified-hhs-cautious-correction-osmolality-potassium-monitoring-and-harm-prevention'],
    [6, 'review-hhs-fixed-four-hour-qualified-report'],
    [7, 'handoff-hhs-osmolality-cognition-fluid-electrolyte-precipitant-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, HhsOsmolalityAction])[];
  expert: readonly (readonly [number, HhsOsmolalityAction])[];
  commonError: readonly (readonly [number, HhsOsmolalityAction])[];
  recovery: readonly (readonly [number, HhsOsmolalityAction])[];
};
