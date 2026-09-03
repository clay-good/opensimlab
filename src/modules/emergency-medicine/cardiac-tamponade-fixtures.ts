import type { CardiacTamponadeAction } from './cardiac-tamponade';

/**
 * Reference transcripts for the emergency cardiac-tamponade lesson.
 *
 * The common-error path is the one that reads the ultrasound before it has read
 * the patient: the fixed POCUS statement is reached for first, refused, and the
 * run then records the control intent — also refused, because a finding nobody
 * has put in context cannot authorise anything. The recovery path skips each
 * intervening step in turn, is refused for both, and still completes from the
 * same positions.
 */
export const CARDIAC_TAMPONADE_FIXTURES = {
  scenarioId: 'cardiac-tamponade', contentVersion: '0.1.0', seed: 7268,
  noAction: [],
  // Every path starts at tick 1: the arrival tamponade event has not fired
  // before the first engine step, and the engine refuses these controls
  // outright while the declared event is not yet active.
  expert: [
    [1, 'review-context-and-perfusion'],
    [2, 'review-fixed-pocus'],
    [3, 'record-definitive-control-intent'],
    [4, 'reassess-perfusion'],
  ],
  commonError: [
    // Straight to the picture, before anyone has looked at the patient.
    [1, 'review-fixed-pocus'],
    [2, 'record-definitive-control-intent'],
    [3, 'reassess-perfusion'],
  ],
  recovery: [
    [1, 'review-context-and-perfusion'],
    // The control intent before the finding that supports it.
    [2, 'record-definitive-control-intent'],
    [3, 'review-fixed-pocus'],
    [4, 'record-definitive-control-intent'],
    // The reassessment on the same tick as the intent, before the engine clock
    // has advanced far enough to have anything new to show.
    [4, 'reassess-perfusion'],
    [5, 'reassess-perfusion'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, CardiacTamponadeAction])[];
  expert: readonly (readonly [number, CardiacTamponadeAction])[];
  commonError: readonly (readonly [number, CardiacTamponadeAction])[];
  recovery: readonly (readonly [number, CardiacTamponadeAction])[];
};
