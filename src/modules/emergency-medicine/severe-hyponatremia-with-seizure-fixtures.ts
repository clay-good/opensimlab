import type { SevereHyponatremiaAction } from './severe-hyponatremia-with-seizure';

/**
 * Reference transcripts for the emergency severe-hyponatraemia lesson.
 *
 * The common-error path is the one that stops when the patient wakes up:
 * the pattern is reviewed, stabilisation and hypertonic saline recorded, and
 * the run reaches for the guardrails without reading the first-hour panel — so
 * it never sees the urine output climb from 35 to 180 mL/h, which is the whole
 * warning. It is refused. The recovery path skips each intervening step in
 * turn, is refused for both, and still completes from the same positions.
 */
export const SEVERE_HYPONATREMIA_FIXTURES = {
  scenarioId: 'severe-hyponatremia-with-seizure', contentVersion: '0.1.0', seed: 1128,
  noAction: [],
  expert: [
    [0, 'review-hyponatremia-pattern'],
    [1, 'record-hyponatremia-stabilization'],
    [2, 'record-hypertonic-saline-intent'],
    [3, 'reassess-hyponatremia-first-hour'],
    [4, 'record-hyponatremia-guardrails-and-cause-plan'],
  ],
  commonError: [
    [0, 'review-hyponatremia-pattern'],
    [1, 'record-hyponatremia-stabilization'],
    [2, 'record-hypertonic-saline-intent'],
    // Straight to the guardrails, without reading the panel that motivates them.
    [3, 'record-hyponatremia-guardrails-and-cause-plan'],
  ],
  recovery: [
    // The sodium-directed intent before anyone protected the patient.
    [0, 'record-hypertonic-saline-intent'],
    [1, 'review-hyponatremia-pattern'],
    [2, 'record-hypertonic-saline-intent'],
    [3, 'record-hyponatremia-stabilization'],
    [4, 'record-hypertonic-saline-intent'],
    [5, 'reassess-hyponatremia-first-hour'],
    [6, 'record-hyponatremia-guardrails-and-cause-plan'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, SevereHyponatremiaAction])[];
  expert: readonly (readonly [number, SevereHyponatremiaAction])[];
  commonError: readonly (readonly [number, SevereHyponatremiaAction])[];
  recovery: readonly (readonly [number, SevereHyponatremiaAction])[];
};
