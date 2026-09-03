import type { ArdsLungProtectiveAction } from './ards-lung-protective';

/**
 * Reference transcripts for the ARDS lung-protective lesson.
 *
 * The common-error path is the one the chart weight invites: the baseline is
 * reviewed and the learner records a tidal-volume intent immediately, without
 * establishing the predicted-body-weight basis that turns 500 mL into
 * 8.1 mL/kg. The recovery path skips each intervening step in turn, is refused
 * for both, and still completes from the same positions.
 */
export const ARDS_LUNG_PROTECTIVE_FIXTURES = {
  scenarioId: 'ards-lung-protective-ventilation', contentVersion: '0.1.0', seed: 5734,
  noAction: [],
  expert: [
    [0, 'review-ards-baseline'],
    [1, 'calculate-ards-pbw'],
    [2, 'record-ards-protective-settings'],
    [3, 'reassess-ards-protection'],
    [4, 'record-ards-peep-prone-escalation'],
  ],
  commonError: [
    [0, 'review-ards-baseline'],
    // Straight to a tidal volume, with no basis under it.
    [1, 'record-ards-protective-settings'],
    [2, 'reassess-ards-protection'],
  ],
  recovery: [
    // The predicted body weight before the baseline has been read.
    [0, 'calculate-ards-pbw'],
    [1, 'review-ards-baseline'],
    [2, 'calculate-ards-pbw'],
    [3, 'record-ards-protective-settings'],
    // The escalation before the protective settings have been reassessed.
    [4, 'record-ards-peep-prone-escalation'],
    [5, 'reassess-ards-protection'],
    [6, 'record-ards-peep-prone-escalation'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, ArdsLungProtectiveAction])[];
  expert: readonly (readonly [number, ArdsLungProtectiveAction])[];
  commonError: readonly (readonly [number, ArdsLungProtectiveAction])[];
  recovery: readonly (readonly [number, ArdsLungProtectiveAction])[];
};
