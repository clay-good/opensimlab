import type { SalicylateAction } from './salicylate-falling-number';

/**
 * Reference transcripts for the salicylate lesson.
 *
 * The error path is treating on the concentration alone: the owners are in
 * place, the number is high, so start committing to alkalinization and dialysis
 * without the acid-base, volume, potassium and airway picture that decides what
 * any of it means. It is an ordering error rather than a treatment error,
 * because this lesson delivers no treatment. The recovery path starts from that
 * refusal and still reaches a correct handoff in the same run.
 */
export const SALICYLATE_FIXTURES = {
  scenarioId: 'salicylate-falling-number', contentVersion: '0.1.0', seed: 5427,
  noAction: [],
  expert: [
    [0, 'reconcile-toxicology-salicylate-product-exposure-clock-symptoms-breathing-and-whole-patient'],
    [1, 'recognize-toxicology-salicylate-mixed-acid-base-pattern-without-single-concentration-closure'],
    [2, 'activate-toxicology-salicylate-poison-center-emergency-critical-care-nephrology-and-safety-ownership'],
    [3, 'review-toxicology-salicylate-supplied-serial-level-acid-base-volume-electrolyte-and-airway-boundary'],
    [4, 'record-toxicology-salicylate-bounded-qualified-alkalinization-and-dialysis-preparedness-with-strict-later-review'],
    [5, 'handoff-toxicology-salicylate-cns-pulmonary-acidemia-absorption-extracorporeal-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-toxicology-salicylate-product-exposure-clock-symptoms-breathing-and-whole-patient'],
    [1, 'recognize-toxicology-salicylate-mixed-acid-base-pattern-without-single-concentration-closure'],
    [2, 'activate-toxicology-salicylate-poison-center-emergency-critical-care-nephrology-and-safety-ownership'],
    [3, 'record-toxicology-salicylate-bounded-qualified-alkalinization-and-dialysis-preparedness-with-strict-later-review'],
    [4, 'handoff-toxicology-salicylate-cns-pulmonary-acidemia-absorption-extracorporeal-and-active-risk'],
  ],
  recovery: [
    [0, 'reconcile-toxicology-salicylate-product-exposure-clock-symptoms-breathing-and-whole-patient'],
    [1, 'recognize-toxicology-salicylate-mixed-acid-base-pattern-without-single-concentration-closure'],
    [2, 'activate-toxicology-salicylate-poison-center-emergency-critical-care-nephrology-and-safety-ownership'],
    [3, 'record-toxicology-salicylate-bounded-qualified-alkalinization-and-dialysis-preparedness-with-strict-later-review'],
    [4, 'review-toxicology-salicylate-supplied-serial-level-acid-base-volume-electrolyte-and-airway-boundary'],
    [5, 'record-toxicology-salicylate-bounded-qualified-alkalinization-and-dialysis-preparedness-with-strict-later-review'],
    [6, 'handoff-toxicology-salicylate-cns-pulmonary-acidemia-absorption-extracorporeal-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, SalicylateAction])[];
  expert: readonly (readonly [number, SalicylateAction])[];
  commonError: readonly (readonly [number, SalicylateAction])[];
  recovery: readonly (readonly [number, SalicylateAction])[];
};
