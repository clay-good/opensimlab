import type { TubeMigrationAction } from './tube-migration';

/**
 * Reference transcripts for the post-repositioning tube-migration lesson.
 *
 * The common-error path is the one a recognisable picture invites: the change
 * is recognised and the learner goes straight to reading the position panel,
 * skipping the help and oxygen a patient at 89% needs before she needs a name.
 * The recovery path skips each intervening step in turn, is refused for both,
 * and still completes from the same positions.
 */
export const TUBE_MIGRATION_FIXTURES = {
  scenarioId: 'endotracheal-tube-migration-after-repositioning', contentVersion: '0.1.0', seed: 6193,
  noAction: [],
  expert: [
    [0, 'recognize-post-repositioning-ventilation-change'],
    [1, 'bridge-post-repositioning-oxygenation'],
    [2, 'integrate-tube-depth-and-bilateral-ventilation'],
    [3, 'record-experienced-tube-correction-intent'],
    [4, 'reassess-tube-position-and-gas-exchange'],
  ],
  commonError: [
    [0, 'recognize-post-repositioning-ventilation-change'],
    // Straight to the panel, past the help and the oxygen.
    [1, 'integrate-tube-depth-and-bilateral-ventilation'],
    [2, 'record-experienced-tube-correction-intent'],
  ],
  recovery: [
    // The support before the change has been recognised.
    [0, 'bridge-post-repositioning-oxygenation'],
    [1, 'recognize-post-repositioning-ventilation-change'],
    [2, 'bridge-post-repositioning-oxygenation'],
    // The correction before the panel that keeps the alternatives open.
    [3, 'record-experienced-tube-correction-intent'],
    [4, 'integrate-tube-depth-and-bilateral-ventilation'],
    [5, 'record-experienced-tube-correction-intent'],
    [6, 'reassess-tube-position-and-gas-exchange'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, TubeMigrationAction])[];
  expert: readonly (readonly [number, TubeMigrationAction])[];
  commonError: readonly (readonly [number, TubeMigrationAction])[];
  recovery: readonly (readonly [number, TubeMigrationAction])[];
};
