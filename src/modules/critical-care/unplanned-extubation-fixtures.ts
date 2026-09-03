import type { UnplannedExtubationAction } from './unplanned-extubation';

/**
 * Reference transcripts for the unplanned-extubation lesson.
 *
 * The common-error path is the one the word "extubation" invites: oxygen and
 * help are arranged and the learner goes straight to the airway plan, reaching
 * the right decision without ever reading the panel that establishes it — which
 * is the same reflex that reintubates the patients who would have been fine.
 * The recovery path skips each intervening step in turn, is refused for both,
 * and still completes from the same positions.
 */
export const UNPLANNED_EXTUBATION_FIXTURES = {
  scenarioId: 'unplanned-extubation', contentVersion: '0.1.0', seed: 9375,
  noAction: [],
  expert: [
    [0, 'support-unplanned-extubation-and-call-help'],
    [1, 'assess-unplanned-extubation-tolerance'],
    [2, 'classify-unplanned-extubation-failure'],
    [3, 'record-unplanned-extubation-airway-plan'],
    [4, 'reassess-unplanned-extubation-response'],
  ],
  commonError: [
    [0, 'support-unplanned-extubation-and-call-help'],
    // The right answer without the panel that establishes it.
    [1, 'record-unplanned-extubation-airway-plan'],
    [2, 'reassess-unplanned-extubation-response'],
  ],
  recovery: [
    // The tolerance panel before anybody has called for help.
    [0, 'assess-unplanned-extubation-tolerance'],
    [1, 'support-unplanned-extubation-and-call-help'],
    [2, 'assess-unplanned-extubation-tolerance'],
    // The airway plan before the trajectory has been classified.
    [3, 'record-unplanned-extubation-airway-plan'],
    [4, 'classify-unplanned-extubation-failure'],
    [5, 'record-unplanned-extubation-airway-plan'],
    [6, 'reassess-unplanned-extubation-response'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, UnplannedExtubationAction])[];
  expert: readonly (readonly [number, UnplannedExtubationAction])[];
  commonError: readonly (readonly [number, UnplannedExtubationAction])[];
  recovery: readonly (readonly [number, UnplannedExtubationAction])[];
};
