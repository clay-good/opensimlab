import type { TricyclicAction } from './tricyclic-sodium-channel-cardiotoxicity';

/**
 * Reference transcripts for the tricyclic lesson.
 *
 * The error path is the one a wide complex and a low pressure invite: name the
 * pattern, then go straight at it, with nobody yet assembled for the airway,
 * the next seizure, the rhythm or the refractory case. It is an ordering error
 * rather than a treatment error, because this lesson delivers no treatment —
 * but the step it skips is the one that puts people in the room before the
 * thing they are needed for happens. The recovery path starts from that refusal
 * and still reaches a correct handoff in the same run.
 */
export const TRICYCLIC_FIXTURES = {
  scenarioId: 'tricyclic-sodium-channel-cardiotoxicity', contentVersion: '0.1.0', seed: 5463,
  noAction: [],
  expert: [
    [0, 'reconcile-toxicology-tricyclic-product-clock-cns-seizure-perfusion-ecg-and-whole-patient'],
    [1, 'recognize-toxicology-tricyclic-sodium-channel-cardiotoxicity-pattern-without-qrs-only-closure'],
    [2, 'activate-toxicology-tricyclic-poison-center-resuscitation-cardiac-airway-seizure-and-safety-ownership'],
    [3, 'review-toxicology-tricyclic-supplied-ecg-perfusion-acid-base-electrolyte-coingestion-and-rescue-boundary'],
    [4, 'record-toxicology-tricyclic-bounded-qualified-bicarbonate-and-rescue-intent-with-strict-later-review'],
    [5, 'handoff-toxicology-tricyclic-recurrent-conduction-shock-seizure-acidemia-rescue-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-toxicology-tricyclic-product-clock-cns-seizure-perfusion-ecg-and-whole-patient'],
    [1, 'recognize-toxicology-tricyclic-sodium-channel-cardiotoxicity-pattern-without-qrs-only-closure'],
    [2, 'record-toxicology-tricyclic-bounded-qualified-bicarbonate-and-rescue-intent-with-strict-later-review'],
    [3, 'handoff-toxicology-tricyclic-recurrent-conduction-shock-seizure-acidemia-rescue-and-active-risk'],
  ],
  recovery: [
    [0, 'reconcile-toxicology-tricyclic-product-clock-cns-seizure-perfusion-ecg-and-whole-patient'],
    [1, 'recognize-toxicology-tricyclic-sodium-channel-cardiotoxicity-pattern-without-qrs-only-closure'],
    [2, 'record-toxicology-tricyclic-bounded-qualified-bicarbonate-and-rescue-intent-with-strict-later-review'],
    [3, 'activate-toxicology-tricyclic-poison-center-resuscitation-cardiac-airway-seizure-and-safety-ownership'],
    [4, 'review-toxicology-tricyclic-supplied-ecg-perfusion-acid-base-electrolyte-coingestion-and-rescue-boundary'],
    [5, 'record-toxicology-tricyclic-bounded-qualified-bicarbonate-and-rescue-intent-with-strict-later-review'],
    [6, 'handoff-toxicology-tricyclic-recurrent-conduction-shock-seizure-acidemia-rescue-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, TricyclicAction])[];
  expert: readonly (readonly [number, TricyclicAction])[];
  commonError: readonly (readonly [number, TricyclicAction])[];
  recovery: readonly (readonly [number, TricyclicAction])[];
};
