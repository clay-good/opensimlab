import type { PeaArrestAction } from './pea-arrest';

/**
 * Reference transcripts for the emergency PEA-arrest lesson.
 *
 * Every path starts at tick 1. The rhythm is a tick-0 timeline event, so the
 * arrest is not active until the engine has stepped once.
 *
 * This lesson has no order gates: the engine accepts compressions and the
 * arrest dose in either order, and it accepts the shock too. What it enforces
 * is the bounded dose contract — exactly 1 mg, IV or IO, once — and that is
 * where the refusals in the recovery path come from.
 *
 * The common-error path is the shock: the monitor shows organized complexes, so
 * the defibrillator comes off the wall first. The engine delivers it, records
 * that a non-shockable rhythm did not convert, and the run then completes
 * correctly — which is the point. The error is not recoverable by doing the
 * rest well; it is already in the transcript.
 *
 * The recovery path is the dose contract: a route the bounded action does not
 * take, then a dose it does not take, both refused, then the accepted one.
 */
export const PEA_ARREST_FIXTURES = {
  scenarioId: 'pea-arrest', contentVersion: '0.1.0', seed: 4120,
  noAction: [],
  expert: [
    [1, 'start-compressions'],
    [2, 'give-one-milligram-epinephrine'],
  ],
  commonError: [
    // The organized complexes on the screen read as a rhythm to shock.
    [1, 'deliver-biphasic-shock'],
    [2, 'start-compressions'],
    [3, 'give-one-milligram-epinephrine'],
  ],
  recovery: [
    [1, 'start-compressions'],
    // Refused: the bounded action takes the IV or IO route only.
    [2, 'give-intramuscular-epinephrine'],
    // Refused: the bounded action takes exactly 1 mg.
    [3, 'give-two-milligram-epinephrine'],
    [4, 'give-one-milligram-epinephrine'],
    // Refused: one accepted arrest dose, and there already is one.
    [5, 'give-one-milligram-epinephrine'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, PeaArrestAction])[];
  expert: readonly (readonly [number, PeaArrestAction])[];
  commonError: readonly (readonly [number, PeaArrestAction])[];
  recovery: readonly (readonly [number, PeaArrestAction | PeaArrestRefusal])[];
};

/**
 * The two malformed doses the recovery path attempts.
 *
 * They are not controls the tray offers — no button sends 2 mg, and none sends
 * an intramuscular route. They exist so a transcript can prove the engine
 * refuses them rather than the tray merely hiding them, which is the difference
 * between a bounded action and a bounded button.
 */
export type PeaArrestRefusal = 'give-intramuscular-epinephrine' | 'give-two-milligram-epinephrine';

export const PEA_ARREST_REFUSAL_DISPATCH = {
  'give-intramuscular-epinephrine': {
    type: 'cardiac-arrest-epinephrine', payload: { route: 'im', doseMg: 1 },
  },
  'give-two-milligram-epinephrine': {
    type: 'cardiac-arrest-epinephrine', payload: { route: 'iv', doseMg: 2 },
  },
} as const;
