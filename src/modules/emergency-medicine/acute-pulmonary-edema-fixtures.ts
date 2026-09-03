import type { AcutePulmonaryEdemaAction } from './acute-pulmonary-edema';

/**
 * Reference transcripts for the emergency acute-pulmonary-edema lesson.
 *
 * The common-error path is the one that treats the loop diuretic as the
 * treatment: the pattern is reviewed, the diuretic intent is recorded, and the
 * run then reaches for the reassessment with the two interventions that
 * actually move this patient in the next few minutes — positive pressure and
 * the vasodilator — never recorded at all. The recovery path reaches for
 * support before the pattern review and is refused, then reaches for the
 * reassessment on the same tick as the last of the three treatments and is
 * refused again, and still completes from the same positions.
 */
export const ACUTE_PULMONARY_EDEMA_FIXTURES = {
  scenarioId: 'acute-pulmonary-edema', contentVersion: '0.1.0', seed: 5150,
  noAction: [],
  expert: [
    [0, 'review-pattern-mimics-and-precipitants'],
    [1, 'record-niv-and-titrated-oxygen'],
    [2, 'record-vasodilator-intent'],
    [3, 'record-loop-diuretic-intent'],
    [4, 'reassess-breathing-pressure-and-perfusion'],
  ],
  commonError: [
    [0, 'review-pattern-mimics-and-precipitants'],
    // The reflex: the diuretic reads as the treatment for pulmonary edema.
    [1, 'record-loop-diuretic-intent'],
    // Straight to the reassessment, with support and the vasodilator unrecorded.
    [2, 'reassess-breathing-pressure-and-perfusion'],
  ],
  recovery: [
    // Support before the pattern, the mimics, and the precipitants were read.
    [0, 'record-niv-and-titrated-oxygen'],
    [1, 'review-pattern-mimics-and-precipitants'],
    [2, 'record-niv-and-titrated-oxygen'],
    [3, 'record-loop-diuretic-intent'],
    [4, 'record-vasodilator-intent'],
    // The reassessment on the same tick as the last treatment, before the
    // engine clock has advanced far enough to have anything new to show.
    [4, 'reassess-breathing-pressure-and-perfusion'],
    [5, 'reassess-breathing-pressure-and-perfusion'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, AcutePulmonaryEdemaAction])[];
  expert: readonly (readonly [number, AcutePulmonaryEdemaAction])[];
  commonError: readonly (readonly [number, AcutePulmonaryEdemaAction])[];
  recovery: readonly (readonly [number, AcutePulmonaryEdemaAction])[];
};
