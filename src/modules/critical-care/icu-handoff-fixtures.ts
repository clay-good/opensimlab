import type { IcuHandoffAction } from './icu-handoff';

/**
 * Reference transcripts for the ICU handoff lesson.
 *
 * The common-error path is the one a confident headline invites: readiness is
 * established, the content is received, and the learner escalates on the
 * strength of what they were told — skipping the cross-check that is the only
 * thing separating "stable" from ninety minutes of numbers saying otherwise.
 * The recovery path skips each intervening step in turn, is refused for both,
 * and still completes from the same positions.
 */
export const ICU_HANDOFF_FIXTURES = {
  scenarioId: 'icu-handoff-with-hidden-deterioration', contentVersion: '0.1.0', seed: 8419,
  noAction: [],
  expert: [
    [0, 'establish-icu-handoff-readiness'],
    [1, 'receive-icu-handoff-content'],
    [2, 'cross-check-hidden-deterioration'],
    [3, 'escalate-icu-handoff-deterioration'],
    [4, 'synthesize-accept-and-reassess-icu-handoff'],
  ],
  commonError: [
    [0, 'establish-icu-handoff-readiness'],
    [1, 'receive-icu-handoff-content'],
    // Straight to acting on what you were told, without checking it.
    [2, 'escalate-icu-handoff-deterioration'],
    [3, 'synthesize-accept-and-reassess-icu-handoff'],
  ],
  recovery: [
    // The content before anyone was ready to receive it.
    [0, 'receive-icu-handoff-content'],
    [1, 'establish-icu-handoff-readiness'],
    [2, 'receive-icu-handoff-content'],
    [3, 'cross-check-hidden-deterioration'],
    // The acceptance before the corrected state has been escalated.
    [4, 'synthesize-accept-and-reassess-icu-handoff'],
    [5, 'escalate-icu-handoff-deterioration'],
    [6, 'synthesize-accept-and-reassess-icu-handoff'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, IcuHandoffAction])[];
  expert: readonly (readonly [number, IcuHandoffAction])[];
  commonError: readonly (readonly [number, IcuHandoffAction])[];
  recovery: readonly (readonly [number, IcuHandoffAction])[];
};
