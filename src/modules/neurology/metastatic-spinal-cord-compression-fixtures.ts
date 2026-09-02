import type { MsccAction } from './metastatic-spinal-cord-compression';

/**
 * Reference transcripts for the cord-compression lesson.
 *
 * The error path is the one a clear diagnosis invites: name the emergency, then
 * go straight to what should be done about it — the precautions, the scan, the
 * steroids. It is an ordering error rather than a treatment error, because this
 * lesson delivers no treatment. What it skips is the referral chain, and this
 * illness needs an unusually long one: spinal surgery, oncology, radiology,
 * radiotherapy, nursing, pharmacy, rehabilitation, pain, bladder, skin and
 * thrombosis prevention. Deciding what should happen is not the same as
 * arranging for it to happen. The recovery path starts from that refusal and
 * still reaches a correct handoff in the same run.
 */
export const MSCC_FIXTURES = {
  scenarioId: 'metastatic-spinal-cord-compression', contentVersion: '0.1.0', seed: 6597,
  noAction: [],
  expert: [
    [0, 'reconcile-neurology-mscc-cancer-pain-motor-sensory-bladder-and-whole-patient-clock'],
    [1, 'recognize-neurology-mscc-oncologic-emergency-before-imaging-confirmation'],
    [2, 'activate-neurology-mscc-qualified-spinal-oncology-radiology-nursing-and-rehabilitation-ownership'],
    [3, 'review-neurology-mscc-stability-movement-whole-spine-mri-corticosteroid-and-definitive-care-boundary'],
    [4, 'review-neurology-mscc-strict-later-qualified-mri-and-unresolved-function-trajectory'],
    [5, 'handoff-neurology-mscc-level-stability-function-bladder-definitive-care-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-neurology-mscc-cancer-pain-motor-sensory-bladder-and-whole-patient-clock'],
    [1, 'recognize-neurology-mscc-oncologic-emergency-before-imaging-confirmation'],
    [2, 'review-neurology-mscc-stability-movement-whole-spine-mri-corticosteroid-and-definitive-care-boundary'],
  ],
  recovery: [
    [0, 'reconcile-neurology-mscc-cancer-pain-motor-sensory-bladder-and-whole-patient-clock'],
    [1, 'recognize-neurology-mscc-oncologic-emergency-before-imaging-confirmation'],
    [2, 'review-neurology-mscc-stability-movement-whole-spine-mri-corticosteroid-and-definitive-care-boundary'],
    [3, 'activate-neurology-mscc-qualified-spinal-oncology-radiology-nursing-and-rehabilitation-ownership'],
    [4, 'review-neurology-mscc-stability-movement-whole-spine-mri-corticosteroid-and-definitive-care-boundary'],
    [5, 'review-neurology-mscc-strict-later-qualified-mri-and-unresolved-function-trajectory'],
    [6, 'handoff-neurology-mscc-level-stability-function-bladder-definitive-care-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, MsccAction])[];
  expert: readonly (readonly [number, MsccAction])[];
  commonError: readonly (readonly [number, MsccAction])[];
  recovery: readonly (readonly [number, MsccAction])[];
};
