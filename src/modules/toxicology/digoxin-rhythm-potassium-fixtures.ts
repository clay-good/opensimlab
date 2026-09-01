import type { DigoxinAction } from './digoxin-rhythm-potassium';

/**
 * Reference transcripts for the digoxin lesson.
 *
 * The error path is the one a number like 8.6 ng/mL invites: name the poisoning
 * and go straight to the antidote, without the beat where the sampling time,
 * the potassium and the renal function decide what that number and that
 * treatment actually mean. It is an ordering error rather than a treatment
 * error, because this lesson delivers no treatment. The recovery path starts
 * from that refusal and still reaches a correct handoff in the same run.
 */
export const DIGOXIN_FIXTURES = {
  scenarioId: 'digoxin-rhythm-potassium', contentVersion: '0.1.0', seed: 5587,
  noAction: [],
  expert: [
    [0, 'reconcile-toxicology-digoxin-product-clock-gi-visual-perfusion-rhythm-potassium-and-whole-patient'],
    [1, 'recognize-toxicology-digoxin-life-threatening-pattern-without-level-rhythm-or-potassium-only-closure'],
    [2, 'activate-toxicology-digoxin-poison-center-resuscitation-cardiac-electrolyte-airway-and-safety-ownership'],
    [3, 'review-toxicology-digoxin-supplied-ecg-level-timing-potassium-renal-coingestion-and-antidote-boundary'],
    [4, 'record-toxicology-digoxin-bounded-qualified-immune-fab-surveillance-and-rescue-intent-with-strict-later-review'],
    [5, 'handoff-toxicology-digoxin-recurrent-arrhythmia-potassium-shift-level-interference-renal-rescue-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-toxicology-digoxin-product-clock-gi-visual-perfusion-rhythm-potassium-and-whole-patient'],
    [1, 'recognize-toxicology-digoxin-life-threatening-pattern-without-level-rhythm-or-potassium-only-closure'],
    [2, 'activate-toxicology-digoxin-poison-center-resuscitation-cardiac-electrolyte-airway-and-safety-ownership'],
    [3, 'record-toxicology-digoxin-bounded-qualified-immune-fab-surveillance-and-rescue-intent-with-strict-later-review'],
    [4, 'handoff-toxicology-digoxin-recurrent-arrhythmia-potassium-shift-level-interference-renal-rescue-and-active-risk'],
  ],
  recovery: [
    [0, 'reconcile-toxicology-digoxin-product-clock-gi-visual-perfusion-rhythm-potassium-and-whole-patient'],
    [1, 'recognize-toxicology-digoxin-life-threatening-pattern-without-level-rhythm-or-potassium-only-closure'],
    [2, 'activate-toxicology-digoxin-poison-center-resuscitation-cardiac-electrolyte-airway-and-safety-ownership'],
    [3, 'record-toxicology-digoxin-bounded-qualified-immune-fab-surveillance-and-rescue-intent-with-strict-later-review'],
    [4, 'review-toxicology-digoxin-supplied-ecg-level-timing-potassium-renal-coingestion-and-antidote-boundary'],
    [5, 'record-toxicology-digoxin-bounded-qualified-immune-fab-surveillance-and-rescue-intent-with-strict-later-review'],
    [6, 'handoff-toxicology-digoxin-recurrent-arrhythmia-potassium-shift-level-interference-renal-rescue-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, DigoxinAction])[];
  expert: readonly (readonly [number, DigoxinAction])[];
  commonError: readonly (readonly [number, DigoxinAction])[];
  recovery: readonly (readonly [number, DigoxinAction])[];
};
