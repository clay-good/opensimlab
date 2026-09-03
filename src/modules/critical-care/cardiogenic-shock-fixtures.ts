import type { CardiogenicShockAction } from './cardiogenic-shock';

/**
 * Reference transcripts for the cardiogenic-shock lesson.
 *
 * The common-error path is the one a low pressure invites: the shock is
 * recognised and the learner reaches straight for the bridge without looking at
 * the heart, which is a vasopressor chosen for a phenotype nobody has
 * established. The recovery path skips each of the intervening steps in turn,
 * is refused for both, and still completes from the same positions.
 */
export const CARDIOGENIC_SHOCK_FIXTURES = {
  scenarioId: 'cardiogenic-shock', contentVersion: '0.1.0', seed: 4390,
  noAction: [],
  expert: [
    [0, 'recognize-cardiogenic-shock-trajectory'],
    [1, 'review-cardiogenic-shock-cause-and-phenotype'],
    [2, 'record-cardiogenic-shock-bridge'],
    [3, 'escalate-cardiogenic-shock-cause-control'],
    [4, 'reassess-cardiogenic-shock-trajectory'],
  ],
  commonError: [
    [0, 'recognize-cardiogenic-shock-trajectory'],
    // The bridge before anybody has looked at the heart.
    [1, 'record-cardiogenic-shock-bridge'],
    [2, 'escalate-cardiogenic-shock-cause-control'],
  ],
  recovery: [
    // Reviewing the phenotype before the shock has been named.
    [0, 'review-cardiogenic-shock-cause-and-phenotype'],
    [1, 'recognize-cardiogenic-shock-trajectory'],
    [2, 'review-cardiogenic-shock-cause-and-phenotype'],
    // Cause control before the bridge that holds him through it.
    [3, 'escalate-cardiogenic-shock-cause-control'],
    [4, 'record-cardiogenic-shock-bridge'],
    [5, 'escalate-cardiogenic-shock-cause-control'],
    [6, 'reassess-cardiogenic-shock-trajectory'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, CardiogenicShockAction])[];
  expert: readonly (readonly [number, CardiogenicShockAction])[];
  commonError: readonly (readonly [number, CardiogenicShockAction])[];
  recovery: readonly (readonly [number, CardiogenicShockAction])[];
};
