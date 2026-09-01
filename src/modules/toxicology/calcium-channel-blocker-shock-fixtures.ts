import type { CalciumChannelBlockerAction } from './calcium-channel-blocker-shock';

/**
 * Reference transcripts for the calcium-channel-blocker lesson.
 *
 * The error path is what dramatic numbers invite: a complete block at 34 and a
 * glucose of 238 are so striking that the room starts reading and reacting to
 * them without first saying what kind of shock this is. It is an ordering error
 * rather than a treatment error, because this lesson delivers no treatment —
 * but skipping that sentence is what makes pacing look sufficient. The recovery
 * path starts from that refusal and still reaches a correct handoff in the same
 * run.
 */
export const CALCIUM_CHANNEL_BLOCKER_FIXTURES = {
  scenarioId: 'calcium-channel-blocker-shock', contentVersion: '0.1.0', seed: 5546,
  noAction: [],
  expert: [
    [0, 'reconcile-toxicology-calcium-channel-blocker-product-formulation-clock-perfusion-rhythm-glucose-and-whole-patient'],
    [1, 'recognize-toxicology-calcium-channel-blocker-mixed-shock-pattern-without-glucose-or-pulse-only-closure'],
    [2, 'activate-toxicology-calcium-channel-blocker-poison-center-resuscitation-cardiac-metabolic-airway-and-safety-ownership'],
    [3, 'review-toxicology-calcium-channel-blocker-supplied-ecg-perfusion-contractility-glucose-electrolyte-prior-care-and-rescue-boundary'],
    [4, 'record-toxicology-calcium-channel-blocker-bounded-qualified-vasopressor-calcium-insulin-euglycemia-and-rescue-intent-with-strict-later-review'],
    [5, 'handoff-toxicology-calcium-channel-blocker-recurrent-shock-av-block-hyperglycemia-electrolyte-volume-rescue-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-toxicology-calcium-channel-blocker-product-formulation-clock-perfusion-rhythm-glucose-and-whole-patient'],
    [1, 'review-toxicology-calcium-channel-blocker-supplied-ecg-perfusion-contractility-glucose-electrolyte-prior-care-and-rescue-boundary'],
    [2, 'record-toxicology-calcium-channel-blocker-bounded-qualified-vasopressor-calcium-insulin-euglycemia-and-rescue-intent-with-strict-later-review'],
    [3, 'handoff-toxicology-calcium-channel-blocker-recurrent-shock-av-block-hyperglycemia-electrolyte-volume-rescue-and-active-risk'],
  ],
  recovery: [
    [0, 'reconcile-toxicology-calcium-channel-blocker-product-formulation-clock-perfusion-rhythm-glucose-and-whole-patient'],
    [1, 'review-toxicology-calcium-channel-blocker-supplied-ecg-perfusion-contractility-glucose-electrolyte-prior-care-and-rescue-boundary'],
    [2, 'recognize-toxicology-calcium-channel-blocker-mixed-shock-pattern-without-glucose-or-pulse-only-closure'],
    [3, 'activate-toxicology-calcium-channel-blocker-poison-center-resuscitation-cardiac-metabolic-airway-and-safety-ownership'],
    [4, 'review-toxicology-calcium-channel-blocker-supplied-ecg-perfusion-contractility-glucose-electrolyte-prior-care-and-rescue-boundary'],
    [5, 'record-toxicology-calcium-channel-blocker-bounded-qualified-vasopressor-calcium-insulin-euglycemia-and-rescue-intent-with-strict-later-review'],
    [6, 'handoff-toxicology-calcium-channel-blocker-recurrent-shock-av-block-hyperglycemia-electrolyte-volume-rescue-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, CalciumChannelBlockerAction])[];
  expert: readonly (readonly [number, CalciumChannelBlockerAction])[];
  commonError: readonly (readonly [number, CalciumChannelBlockerAction])[];
  recovery: readonly (readonly [number, CalciumChannelBlockerAction])[];
};
