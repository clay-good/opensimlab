import type { EscalatingHypoxemiaAction } from './escalating-hypoxemia';

/**
 * Reference transcripts for the escalating-hypoxemia lesson.
 *
 * The common-error path is the one a sick lung invites: the decline is
 * corroborated and support arranged, and the learner goes straight to the chest,
 * never tracing the oxygen path that a patient who has just been turned most
 * needs traced. The recovery path skips each intervening step in turn, is
 * refused for both, and still completes from the same positions.
 */
export const ESCALATING_HYPOXEMIA_FIXTURES = {
  scenarioId: 'escalating-hypoxemia', contentVersion: '0.1.0', seed: 4059,
  noAction: [],
  expert: [
    [0, 'validate-hypoxemia-signal'],
    [1, 'support-hypoxemia-and-call-help'],
    [2, 'trace-hypoxemia-delivery-path'],
    [3, 'integrate-hypoxemia-bedside-pattern'],
    [4, 'escalate-and-reassess-hypoxemia'],
  ],
  commonError: [
    [0, 'validate-hypoxemia-signal'],
    [1, 'support-hypoxemia-and-call-help'],
    // Straight to the chest, with the oxygen path never traced.
    [2, 'integrate-hypoxemia-bedside-pattern'],
    [3, 'escalate-and-reassess-hypoxemia'],
  ],
  recovery: [
    // Support before the signal has been corroborated.
    [0, 'support-hypoxemia-and-call-help'],
    [1, 'validate-hypoxemia-signal'],
    [2, 'support-hypoxemia-and-call-help'],
    // The chest before the delivery path.
    [3, 'integrate-hypoxemia-bedside-pattern'],
    [4, 'trace-hypoxemia-delivery-path'],
    [5, 'integrate-hypoxemia-bedside-pattern'],
    [6, 'escalate-and-reassess-hypoxemia'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, EscalatingHypoxemiaAction])[];
  expert: readonly (readonly [number, EscalatingHypoxemiaAction])[];
  commonError: readonly (readonly [number, EscalatingHypoxemiaAction])[];
  recovery: readonly (readonly [number, EscalatingHypoxemiaAction])[];
};
