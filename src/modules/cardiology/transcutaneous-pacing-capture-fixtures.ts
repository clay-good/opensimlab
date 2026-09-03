import type { TranscutaneousPacingCaptureAction } from './transcutaneous-pacing-capture';

/**
 * Reference transcripts for the transcutaneous-pacing capture lesson.
 *
 * The common-error path is the one the lesson exists to prevent: the capture
 * evidence is reconciled correctly and the learner moves to the causes and the
 * pacing bridge with the arrest never started, which is the thinking that costs
 * a pulseless patient minutes. The recovery path skips the recognition, is
 * refused, skips the arrest, is refused again, and walks into the time gate
 * before clearing it.
 */
export const TRANSCUTANEOUS_PACING_CAPTURE_FIXTURES = {
  scenarioId: 'transcutaneous-pacing-mechanical-capture-reassessment', contentVersion: '0.1.0', seed: 3062,
  noAction: [],
  expert: [
    [0, 'reconcile-transcutaneous-pacing-electrical-and-mechanical-capture'],
    [1, 'activate-transcutaneous-pacing-pulseless-response'],
    [2, 'review-transcutaneous-pacing-open-causes-and-bridge'],
    [3, 'handoff-transcutaneous-pacing-reassessment'],
  ],
  commonError: [
    [0, 'reconcile-transcutaneous-pacing-electrical-and-mechanical-capture'],
    // Thinking about causes while nobody has started the arrest.
    [1, 'review-transcutaneous-pacing-open-causes-and-bridge'],
    [2, 'handoff-transcutaneous-pacing-reassessment'],
  ],
  recovery: [
    // The arrest before the capture evidence has been reconciled.
    [0, 'activate-transcutaneous-pacing-pulseless-response'],
    [1, 'reconcile-transcutaneous-pacing-electrical-and-mechanical-capture'],
    // The causes before the arrest has been opened.
    [2, 'review-transcutaneous-pacing-open-causes-and-bridge'],
    [3, 'activate-transcutaneous-pacing-pulseless-response'],
    [4, 'review-transcutaneous-pacing-open-causes-and-bridge'],
    // The time gate, taken too early before it is taken correctly.
    [4, 'handoff-transcutaneous-pacing-reassessment'],
    [5, 'handoff-transcutaneous-pacing-reassessment'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, TranscutaneousPacingCaptureAction])[];
  expert: readonly (readonly [number, TranscutaneousPacingCaptureAction])[];
  commonError: readonly (readonly [number, TranscutaneousPacingCaptureAction])[];
  recovery: readonly (readonly [number, TranscutaneousPacingCaptureAction])[];
};
