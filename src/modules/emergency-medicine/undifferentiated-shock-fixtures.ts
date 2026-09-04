import type { UndifferentiatedShockAction } from './undifferentiated-shock';

/**
 * Reference transcripts for the emergency undifferentiated-shock lesson.
 *
 * Every path starts at tick 1. The arrival pattern is a tick-0 timeline event,
 * so it is not active until the engine has stepped once.
 *
 * The common-error path is the fluid challenge as an opening move: perfusion
 * and lactate are read and the challenge is reached for straight away, refused
 * because the reversible test that justifies it has not been done. The recovery
 * path skips the imaging and then the leg raise, is refused for both, and still
 * completes from the same positions.
 */
export const UNDIFFERENTIATED_SHOCK_FIXTURES = {
  scenarioId: 'undifferentiated-shock', contentVersion: '0.1.0', seed: 7350,
  noAction: [],
  expert: [
    [1, 'review-perfusion'],
    [2, 'review-lactate'],
    [3, 'review-focused-echo'],
    [4, 'perform-passive-leg-raise'],
    [5, 'give-targeted-fluid-challenge'],
    [6, 'reassess-perfusion'],
    [7, 'escalate-after-reassessment'],
  ],
  commonError: [
    [1, 'review-perfusion'],
    [2, 'review-lactate'],
    // The fluid first, before the test that says whether it is likely to help.
    [3, 'give-targeted-fluid-challenge'],
    [4, 'reassess-perfusion'],
  ],
  recovery: [
    [1, 'review-perfusion'],
    [2, 'review-lactate'],
    // The leg raise before the imaging that comes first.
    [3, 'perform-passive-leg-raise'],
    [4, 'review-focused-echo'],
    // The challenge before the leg raise it depends on.
    [5, 'give-targeted-fluid-challenge'],
    [6, 'perform-passive-leg-raise'],
    [7, 'give-targeted-fluid-challenge'],
    [8, 'reassess-perfusion'],
    [9, 'escalate-after-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, UndifferentiatedShockAction])[];
  expert: readonly (readonly [number, UndifferentiatedShockAction])[];
  commonError: readonly (readonly [number, UndifferentiatedShockAction])[];
  recovery: readonly (readonly [number, UndifferentiatedShockAction])[];
};
