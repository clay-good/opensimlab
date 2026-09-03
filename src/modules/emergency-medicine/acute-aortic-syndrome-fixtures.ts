import type { AcuteAorticSyndromeAction } from './acute-aortic-syndrome';

/**
 * Reference transcripts for the acute-aortic-syndrome lesson.
 *
 * The common-error path is the one a symmetric first examination invites: the
 * initial pattern is reviewed and the learner escalates on the strength of the
 * story alone, without repeating the pulses that turn a suspicion into three
 * disagreeing territories. The recovery path skips each intervening step in
 * turn, is refused for both, and still completes from the same positions.
 */
export const ACUTE_AORTIC_SYNDROME_FIXTURES = {
  scenarioId: 'acute-aortic-syndrome', contentVersion: '0.1.0', seed: 7481,
  noAction: [],
  expert: [
    [0, 'review-aortic-initial-pattern'],
    [1, 'repeat-aortic-asymmetry-exam'],
    [2, 'activate-aortic-pathway'],
    [3, 'record-aortic-anti-impulse-intent'],
    [4, 'prioritize-aortic-imaging'],
    [5, 'repeat-and-handoff-aortic-evolution'],
  ],
  commonError: [
    [0, 'review-aortic-initial-pattern'],
    // Straight to escalating, without re-examining the territories.
    [1, 'activate-aortic-pathway'],
    [2, 'record-aortic-anti-impulse-intent'],
  ],
  recovery: [
    // The repeat examination before the initial pattern has been reviewed.
    [0, 'repeat-aortic-asymmetry-exam'],
    [1, 'review-aortic-initial-pattern'],
    [2, 'repeat-aortic-asymmetry-exam'],
    [3, 'activate-aortic-pathway'],
    // The imaging priority before the anti-impulse intent it travels with.
    [4, 'prioritize-aortic-imaging'],
    [5, 'record-aortic-anti-impulse-intent'],
    [6, 'prioritize-aortic-imaging'],
    [7, 'repeat-and-handoff-aortic-evolution'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, AcuteAorticSyndromeAction])[];
  expert: readonly (readonly [number, AcuteAorticSyndromeAction])[];
  commonError: readonly (readonly [number, AcuteAorticSyndromeAction])[];
  recovery: readonly (readonly [number, AcuteAorticSyndromeAction])[];
};
