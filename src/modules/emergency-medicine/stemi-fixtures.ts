import type { StemiAction } from './stemi';

/**
 * Reference transcripts for the emergency STEMI lesson.
 *
 * The common-error path is the one that treats the drugs as the treatment: the
 * pattern is reviewed, the aspirin and the P2Y12 plus anticoagulation are
 * recorded, and the run reaches for the handoff without anyone having called
 * the cath lab. It is refused. The recovery path reaches for the pathway before
 * the twelve-lead has been read and is refused, reaches for the handoff on the
 * same tick as the last intent and is refused again, and still completes from
 * the same positions.
 */
export const STEMI_FIXTURES = {
  scenarioId: 'stemi', contentVersion: '0.1.0', seed: 3057,
  noAction: [],
  expert: [
    [0, 'review-stemi-pattern'],
    [1, 'activate-stemi-pathway'],
    [2, 'record-aspirin-load'],
    [3, 'record-p2y12-anticoagulation-intent'],
    [4, 'reassess-and-handoff'],
  ],
  commonError: [
    [0, 'review-stemi-pattern'],
    // The drugs, without the phone call that opens the artery.
    [1, 'record-aspirin-load'],
    [2, 'record-p2y12-anticoagulation-intent'],
    [3, 'reassess-and-handoff'],
  ],
  recovery: [
    // The pathway before the twelve-lead has been read.
    [0, 'activate-stemi-pathway'],
    [1, 'review-stemi-pattern'],
    [2, 'activate-stemi-pathway'],
    [3, 'record-aspirin-load'],
    [4, 'record-p2y12-anticoagulation-intent'],
    // The handoff on the same tick as the last intent.
    [4, 'reassess-and-handoff'],
    [5, 'reassess-and-handoff'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, StemiAction])[];
  expert: readonly (readonly [number, StemiAction])[];
  commonError: readonly (readonly [number, StemiAction])[];
  recovery: readonly (readonly [number, StemiAction])[];
};
