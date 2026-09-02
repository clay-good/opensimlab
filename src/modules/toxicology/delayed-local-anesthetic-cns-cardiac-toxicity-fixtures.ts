import type { DelayedLastAction } from './delayed-local-anesthetic-cns-cardiac-toxicity';

/**
 * Reference transcripts for the delayed local-anesthetic lesson.
 *
 * The error path is the one a resuscitation invites: she has convulsed, she is
 * bradycardic and hypotensive with a wide QRS, so the room goes to the patient
 * and nobody goes to the pump. It is an ordering error rather than a treatment
 * error, because this lesson delivers no treatment. What it skips is the beat
 * where source cessation, the airway, seizure, cardiac, lipid and refractory
 * owners are named together — and the catheter is still infusing while
 * everything else is being done well. The recovery path starts from that
 * refusal and still reaches a correct handoff in the same run.
 */
export const DELAYED_LAST_FIXTURES = {
  scenarioId: 'delayed-local-anesthetic-cns-cardiac-toxicity', contentVersion: '0.1.0', seed: 5828,
  noAction: [],
  expert: [
    [0, 'reconcile-toxicology-delayed-last-source-clock-prodrome-seizure-cardiac-and-whole-patient'],
    [1, 'recognize-toxicology-delayed-last-coupled-pattern-without-classic-sequence-clock-symptom-or-ecg-only-closure'],
    [2, 'activate-toxicology-delayed-last-source-airway-seizure-cardiac-toxicology-lipid-and-refractory-rescue-ownership'],
    [3, 'review-toxicology-delayed-last-supplied-source-delivery-cns-ecg-perfusion-acid-base-electrolyte-and-differential-boundary'],
    [4, 'record-toxicology-delayed-last-bounded-qualified-source-airway-seizure-lipid-acid-base-modified-resuscitation-and-ecls-intent-with-strict-later-review'],
    [5, 'handoff-toxicology-delayed-last-recurrent-seizure-arrhythmia-shock-airway-acidemia-source-lipid-and-refractory-risk'],
  ],
  commonError: [
    [0, 'reconcile-toxicology-delayed-last-source-clock-prodrome-seizure-cardiac-and-whole-patient'],
    [1, 'recognize-toxicology-delayed-last-coupled-pattern-without-classic-sequence-clock-symptom-or-ecg-only-closure'],
    [2, 'review-toxicology-delayed-last-supplied-source-delivery-cns-ecg-perfusion-acid-base-electrolyte-and-differential-boundary'],
    [3, 'record-toxicology-delayed-last-bounded-qualified-source-airway-seizure-lipid-acid-base-modified-resuscitation-and-ecls-intent-with-strict-later-review'],
  ],
  recovery: [
    [0, 'reconcile-toxicology-delayed-last-source-clock-prodrome-seizure-cardiac-and-whole-patient'],
    [1, 'recognize-toxicology-delayed-last-coupled-pattern-without-classic-sequence-clock-symptom-or-ecg-only-closure'],
    [2, 'review-toxicology-delayed-last-supplied-source-delivery-cns-ecg-perfusion-acid-base-electrolyte-and-differential-boundary'],
    [3, 'activate-toxicology-delayed-last-source-airway-seizure-cardiac-toxicology-lipid-and-refractory-rescue-ownership'],
    [4, 'review-toxicology-delayed-last-supplied-source-delivery-cns-ecg-perfusion-acid-base-electrolyte-and-differential-boundary'],
    [5, 'record-toxicology-delayed-last-bounded-qualified-source-airway-seizure-lipid-acid-base-modified-resuscitation-and-ecls-intent-with-strict-later-review'],
    [6, 'handoff-toxicology-delayed-last-recurrent-seizure-arrhythmia-shock-airway-acidemia-source-lipid-and-refractory-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, DelayedLastAction])[];
  expert: readonly (readonly [number, DelayedLastAction])[];
  commonError: readonly (readonly [number, DelayedLastAction])[];
  recovery: readonly (readonly [number, DelayedLastAction])[];
};
