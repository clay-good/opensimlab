import type { BasilarLvoAction } from './basilar-artery-occlusion-escalation';

/**
 * Reference transcripts for the basilar-occlusion lesson.
 *
 * The error path is the one a late clock and an undecided thrombolysis question
 * invite: read the imaging, agree he meets the escalation boundary, and then
 * wait — for the treatment decision, or just to see which way he goes. It is an
 * ordering error rather than a treatment error, because this lesson delivers no
 * treatment. What it skips is the beat where the endovascular and airway-capable
 * owners are actually called, which is the one step the boundary exists to
 * trigger. The recovery path starts from that refusal and still reaches a
 * correct handoff in the same run.
 */
export const BASILAR_LVO_FIXTURES = {
  scenarioId: 'basilar-artery-occlusion-escalation', contentVersion: '0.1.0', seed: 6145,
  noAction: [],
  expert: [
    [0, 'reconcile-neurology-basilar-lvo-clock-posterior-syndrome-and-whole-patient'],
    [1, 'review-neurology-basilar-lvo-imaging-selection-and-open-mimics'],
    [2, 'recognize-neurology-basilar-lvo-thrombectomy-escalation-boundary'],
    [3, 'activate-neurology-basilar-lvo-qualified-endovascular-and-airway-capable-ownership'],
    [4, 'review-neurology-basilar-lvo-strict-later-neurologic-and-airway-trajectory'],
    [5, 'handoff-neurology-basilar-lvo-clocks-imaging-deterioration-and-unresolved-outcome'],
  ],
  commonError: [
    [0, 'reconcile-neurology-basilar-lvo-clock-posterior-syndrome-and-whole-patient'],
    [1, 'review-neurology-basilar-lvo-imaging-selection-and-open-mimics'],
    [2, 'recognize-neurology-basilar-lvo-thrombectomy-escalation-boundary'],
    [3, 'review-neurology-basilar-lvo-strict-later-neurologic-and-airway-trajectory'],
  ],
  recovery: [
    [0, 'reconcile-neurology-basilar-lvo-clock-posterior-syndrome-and-whole-patient'],
    [1, 'review-neurology-basilar-lvo-imaging-selection-and-open-mimics'],
    [2, 'recognize-neurology-basilar-lvo-thrombectomy-escalation-boundary'],
    [3, 'review-neurology-basilar-lvo-strict-later-neurologic-and-airway-trajectory'],
    [4, 'activate-neurology-basilar-lvo-qualified-endovascular-and-airway-capable-ownership'],
    [5, 'review-neurology-basilar-lvo-strict-later-neurologic-and-airway-trajectory'],
    [6, 'handoff-neurology-basilar-lvo-clocks-imaging-deterioration-and-unresolved-outcome'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, BasilarLvoAction])[];
  expert: readonly (readonly [number, BasilarLvoAction])[];
  commonError: readonly (readonly [number, BasilarLvoAction])[];
  recovery: readonly (readonly [number, BasilarLvoAction])[];
};
