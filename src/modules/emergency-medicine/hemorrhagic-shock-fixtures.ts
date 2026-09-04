import type { HemorrhagicShockAction } from './hemorrhagic-shock';

/**
 * Reference transcripts for the emergency hemorrhagic-shock lesson.
 *
 * Every path starts at tick 1. The arrival pattern is a tick-0 timeline event,
 * so it is not active until the engine has stepped once, and an action applied
 * before that is refused for a reason the lesson is not about.
 *
 * The common-error path is the one that treats resuscitation as the treatment:
 * it recognizes, activates, transfuses, reviews and reassesses without ever
 * recording control, then reaches for definitive-control escalation at the end
 * and is refused, because the stabilization it skipped on the way to the blood
 * is upstream of it. The recovery path skips a step in each lane in turn, is
 * refused for both, and still completes from the same positions.
 */
export const HEMORRHAGIC_SHOCK_FIXTURES = {
  scenarioId: 'hemorrhagic-shock', contentVersion: '0.1.0', seed: 4118,
  noAction: [],
  expert: [
    [1, 'review-mechanism-and-perfusion'],
    [2, 'record-pelvic-stabilization'],
    [3, 'escalate-definitive-bleeding-control'],
    [4, 'activate-major-hemorrhage'],
    [5, 'give-two-red-cell-units'],
    [6, 'review-coagulation-and-temperature'],
    [7, 'reassess-perfusion'],
  ],
  commonError: [
    [1, 'review-mechanism-and-perfusion'],
    [2, 'activate-major-hemorrhage'],
    [3, 'give-two-red-cell-units'],
    [4, 'review-coagulation-and-temperature'],
    [5, 'reassess-perfusion'],
    // Control, asked for last, after the resuscitation that cannot deliver it.
    [6, 'escalate-definitive-bleeding-control'],
  ],
  recovery: [
    // The binder before the pattern it is a response to has been read.
    [1, 'record-pelvic-stabilization'],
    [2, 'review-mechanism-and-perfusion'],
    [3, 'record-pelvic-stabilization'],
    [4, 'escalate-definitive-bleeding-control'],
    // The units before the activation that releases them.
    [5, 'give-two-red-cell-units'],
    [6, 'activate-major-hemorrhage'],
    [7, 'give-two-red-cell-units'],
    [8, 'review-coagulation-and-temperature'],
    [9, 'reassess-perfusion'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, HemorrhagicShockAction])[];
  expert: readonly (readonly [number, HemorrhagicShockAction])[];
  commonError: readonly (readonly [number, HemorrhagicShockAction])[];
  recovery: readonly (readonly [number, HemorrhagicShockAction])[];
};
