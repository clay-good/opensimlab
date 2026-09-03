import type { MixedShockAction } from './mixed-shock';

/**
 * Reference transcripts for the mixed-shock lesson.
 *
 * The common-error path is the one two previous lessons set up: the shock is
 * recognised and the learner records support straight away, applying whichever
 * of the septic or cardiogenic answers they reached for without reading the
 * panel that says she is both. The recovery path skips each intervening step in
 * turn, is refused for both, and still completes from the same positions.
 */
export const MIXED_SHOCK_FIXTURES = {
  scenarioId: 'mixed-shock', contentVersion: '0.1.0', seed: 6674,
  noAction: [],
  expert: [
    [0, 'recognize-mixed-shock-discordance'],
    [1, 'classify-mixed-shock-hemodynamics'],
    [2, 'record-mixed-shock-support'],
    [3, 'address-mixed-shock-causes'],
    [4, 'reassess-mixed-shock-trajectory'],
  ],
  commonError: [
    [0, 'recognize-mixed-shock-discordance'],
    // Support chosen before the panel that says she is both.
    [1, 'record-mixed-shock-support'],
    [2, 'address-mixed-shock-causes'],
  ],
  recovery: [
    // The panel before the discordance has been named.
    [0, 'classify-mixed-shock-hemodynamics'],
    [1, 'recognize-mixed-shock-discordance'],
    [2, 'classify-mixed-shock-hemodynamics'],
    // Cause control before support for both halves.
    [3, 'address-mixed-shock-causes'],
    [4, 'record-mixed-shock-support'],
    [5, 'address-mixed-shock-causes'],
    [6, 'reassess-mixed-shock-trajectory'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, MixedShockAction])[];
  expert: readonly (readonly [number, MixedShockAction])[];
  commonError: readonly (readonly [number, MixedShockAction])[];
  recovery: readonly (readonly [number, MixedShockAction])[];
};
