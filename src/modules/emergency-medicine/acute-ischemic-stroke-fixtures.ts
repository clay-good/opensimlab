import type { AcuteIschemicStrokeAction } from './acute-ischemic-stroke';

/**
 * Reference transcripts for the emergency acute-ischemic-stroke lesson.
 *
 * The common-error path is the one that treats the two pathways as a sequence:
 * the presentation, activation, imaging and thrombolysis intent are all
 * recorded, and then the run stops — the transfer waiting on a drug response
 * that this lesson never supplies. The recovery path skips each intervening
 * step in turn, is refused for both, and still completes from the same
 * positions.
 */
export const ACUTE_ISCHEMIC_STROKE_FIXTURES = {
  scenarioId: 'acute-ischemic-stroke', contentVersion: '0.1.0', seed: 6842,
  noAction: [],
  expert: [
    [0, 'review-stroke-presentation'],
    [1, 'activate-stroke-system'],
    [2, 'review-stroke-imaging-and-eligibility'],
    [3, 'record-tenecteplase-20-mg-intent'],
    [4, 'activate-thrombectomy-transfer'],
    [5, 'reassess-and-handoff-stroke'],
  ],
  commonError: [
    [0, 'review-stroke-presentation'],
    [1, 'activate-stroke-system'],
    [2, 'review-stroke-imaging-and-eligibility'],
    [3, 'record-tenecteplase-20-mg-intent'],
    // Straight to the handoff, with the transfer still waiting on a response.
    [4, 'reassess-and-handoff-stroke'],
  ],
  recovery: [
    // The activation before the presentation has been reviewed.
    [0, 'activate-stroke-system'],
    [1, 'review-stroke-presentation'],
    [2, 'activate-stroke-system'],
    // The thrombolysis intent before the imaging that permits it.
    [3, 'record-tenecteplase-20-mg-intent'],
    [4, 'review-stroke-imaging-and-eligibility'],
    [5, 'record-tenecteplase-20-mg-intent'],
    [6, 'activate-thrombectomy-transfer'],
    [7, 'reassess-and-handoff-stroke'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, AcuteIschemicStrokeAction])[];
  expert: readonly (readonly [number, AcuteIschemicStrokeAction])[];
  commonError: readonly (readonly [number, AcuteIschemicStrokeAction])[];
  recovery: readonly (readonly [number, AcuteIschemicStrokeAction])[];
};
