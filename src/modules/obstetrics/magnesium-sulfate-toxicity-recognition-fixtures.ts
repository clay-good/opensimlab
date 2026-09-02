import type { MagnesiumToxicityAction } from './magnesium-sulfate-toxicity-recognition';

/**
 * Reference transcripts for the magnesium-toxicity lesson.
 *
 * The response comes before the understanding, so the error path is the
 * ordinary instinct: work out how magnesium-poisoned she is before calling for
 * someone who can manage an airway. It is an ordering error rather than a
 * treatment error, because this lesson delivers no treatment. What it skips is
 * the activation, and this is the quietest emergency in the module — the
 * breathing fails without anyone struggling.
 */
export const MAGNESIUM_TOXICITY_FIXTURES = {
  scenarioId: 'magnesium-sulfate-toxicity-recognition', contentVersion: '0.1.0', seed: 7244,
  noAction: [],
  expert: [
    [0, 'activate-obstetrics-magnesium-toxicity-airway-anesthesia-critical-care-pharmacy-and-support-response'],
    [1, 'reconcile-obstetrics-magnesium-toxicity-exposure-renal-respiratory-reflex-neurologic-and-whole-person'],
    [2, 'review-obstetrics-magnesium-toxicity-multisignal-level-unit-and-alternative-cause-boundaries'],
    [3, 'review-obstetrics-magnesium-toxicity-source-stop-airway-ventilation-antidote-monitoring-newborn-and-support-readiness'],
    [4, 'review-obstetrics-magnesium-toxicity-fixed-five-minute-qualified-response-report'],
    [5, 'handoff-obstetrics-magnesium-toxicity-respiratory-renal-preeclampsia-medication-newborn-support-and-outcome-risk'],
  ],
  commonError: [
    [0, 'reconcile-obstetrics-magnesium-toxicity-exposure-renal-respiratory-reflex-neurologic-and-whole-person'],
    [1, 'review-obstetrics-magnesium-toxicity-multisignal-level-unit-and-alternative-cause-boundaries'],
    [2, 'review-obstetrics-magnesium-toxicity-source-stop-airway-ventilation-antidote-monitoring-newborn-and-support-readiness'],
  ],
  recovery: [
    [0, 'reconcile-obstetrics-magnesium-toxicity-exposure-renal-respiratory-reflex-neurologic-and-whole-person'],
    [1, 'activate-obstetrics-magnesium-toxicity-airway-anesthesia-critical-care-pharmacy-and-support-response'],
    [2, 'reconcile-obstetrics-magnesium-toxicity-exposure-renal-respiratory-reflex-neurologic-and-whole-person'],
    [3, 'review-obstetrics-magnesium-toxicity-multisignal-level-unit-and-alternative-cause-boundaries'],
    [4, 'review-obstetrics-magnesium-toxicity-source-stop-airway-ventilation-antidote-monitoring-newborn-and-support-readiness'],
    [5, 'review-obstetrics-magnesium-toxicity-fixed-five-minute-qualified-response-report'],
    [6, 'handoff-obstetrics-magnesium-toxicity-respiratory-renal-preeclampsia-medication-newborn-support-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, MagnesiumToxicityAction])[];
  expert: readonly (readonly [number, MagnesiumToxicityAction])[];
  commonError: readonly (readonly [number, MagnesiumToxicityAction])[];
  recovery: readonly (readonly [number, MagnesiumToxicityAction])[];
};
