import type { MethanolAction } from './methanol-visual-acidosis-gaps';

/**
 * Reference transcripts for the methanol lesson.
 *
 * The error path is the one a beautiful set of numbers invites: two wide gaps
 * and a vivid history, so send the concentration and wait for it before anyone
 * is called. It is an ordering error rather than a treatment error, because
 * this lesson delivers no treatment. What it skips is the beat where the
 * antidote, extracorporeal, airway and ophthalmic owners are found — and the
 * formate is being made while the sample is in transit. The recovery path
 * starts from that refusal and still reaches a correct handoff in the same run.
 */
export const METHANOL_FIXTURES = {
  scenarioId: 'methanol-visual-acidosis-gaps', contentVersion: '0.1.0', seed: 5786,
  noAction: [],
  expert: [
    [0, 'reconcile-toxicology-methanol-source-clock-vision-acid-base-gaps-and-whole-patient'],
    [1, 'recognize-toxicology-methanol-coupled-pattern-without-source-vision-anion-osmolar-or-level-only-closure'],
    [2, 'activate-toxicology-methanol-resuscitation-airway-antidote-extracorporeal-toxicology-laboratory-and-vision-ownership'],
    [3, 'review-toxicology-methanol-supplied-acid-base-osmolar-electrolyte-renal-visual-coingestion-and-differential-boundary'],
    [4, 'record-toxicology-methanol-bounded-qualified-source-antidote-cofactor-acid-base-extracorporeal-surveillance-and-airway-intent-with-strict-later-review'],
    [5, 'handoff-toxicology-methanol-rebound-acidosis-vision-neurologic-airway-renal-electrolyte-coingestion-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-toxicology-methanol-source-clock-vision-acid-base-gaps-and-whole-patient'],
    [1, 'recognize-toxicology-methanol-coupled-pattern-without-source-vision-anion-osmolar-or-level-only-closure'],
    [2, 'review-toxicology-methanol-supplied-acid-base-osmolar-electrolyte-renal-visual-coingestion-and-differential-boundary'],
    [3, 'record-toxicology-methanol-bounded-qualified-source-antidote-cofactor-acid-base-extracorporeal-surveillance-and-airway-intent-with-strict-later-review'],
  ],
  recovery: [
    [0, 'reconcile-toxicology-methanol-source-clock-vision-acid-base-gaps-and-whole-patient'],
    [1, 'recognize-toxicology-methanol-coupled-pattern-without-source-vision-anion-osmolar-or-level-only-closure'],
    [2, 'review-toxicology-methanol-supplied-acid-base-osmolar-electrolyte-renal-visual-coingestion-and-differential-boundary'],
    [3, 'activate-toxicology-methanol-resuscitation-airway-antidote-extracorporeal-toxicology-laboratory-and-vision-ownership'],
    [4, 'review-toxicology-methanol-supplied-acid-base-osmolar-electrolyte-renal-visual-coingestion-and-differential-boundary'],
    [5, 'record-toxicology-methanol-bounded-qualified-source-antidote-cofactor-acid-base-extracorporeal-surveillance-and-airway-intent-with-strict-later-review'],
    [6, 'handoff-toxicology-methanol-rebound-acidosis-vision-neurologic-airway-renal-electrolyte-coingestion-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, MethanolAction])[];
  expert: readonly (readonly [number, MethanolAction])[];
  commonError: readonly (readonly [number, MethanolAction])[];
  recovery: readonly (readonly [number, MethanolAction])[];
};
