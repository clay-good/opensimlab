import type { MyastheniaAction } from './myasthenic-crisis-escalation';

/**
 * Reference transcripts for the myasthenic-crisis lesson.
 *
 * The error path is the one a normal-looking monitor invites: the saturation is
 * 97% on room air and the blood gas is unremarkable, so the febrile productive
 * cough and the new opacity become the problem to work up. It is an ordering
 * error rather than a treatment error, because this lesson delivers no
 * treatment. What it skips is the beat that says the respiratory failure is
 * already happening — the falling vital capacity, the pooled secretions and the
 * weak cough — and the pneumonia is the trigger rather than the emergency. The
 * recovery path starts from that refusal and still reaches a correct handoff in
 * the same run.
 */
export const MYASTHENIA_FIXTURES = {
  scenarioId: 'myasthenic-crisis-escalation', contentVersion: '0.1.0', seed: 6351,
  noAction: [],
  expert: [
    [0, 'reconcile-neurology-myasthenic-crisis-clock-fatigability-bulbar-respiratory-and-whole-patient'],
    [1, 'recognize-neurology-impending-myasthenic-crisis-without-spo2-or-single-cutoff-reassurance'],
    [2, 'activate-neurology-myasthenic-crisis-qualified-neurocritical-and-airway-capable-ownership'],
    [3, 'review-neurology-myasthenic-crisis-secretion-aspiration-infection-medication-and-alternative-causes'],
    [4, 'review-neurology-myasthenic-crisis-strict-later-bulbar-ventilatory-and-supplied-airway-trajectory'],
    [5, 'handoff-neurology-myasthenic-crisis-trigger-treatment-weaning-recurrence-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-neurology-myasthenic-crisis-clock-fatigability-bulbar-respiratory-and-whole-patient'],
    [1, 'review-neurology-myasthenic-crisis-secretion-aspiration-infection-medication-and-alternative-causes'],
    [2, 'review-neurology-myasthenic-crisis-strict-later-bulbar-ventilatory-and-supplied-airway-trajectory'],
  ],
  recovery: [
    [0, 'reconcile-neurology-myasthenic-crisis-clock-fatigability-bulbar-respiratory-and-whole-patient'],
    [1, 'review-neurology-myasthenic-crisis-secretion-aspiration-infection-medication-and-alternative-causes'],
    [2, 'recognize-neurology-impending-myasthenic-crisis-without-spo2-or-single-cutoff-reassurance'],
    [3, 'activate-neurology-myasthenic-crisis-qualified-neurocritical-and-airway-capable-ownership'],
    [4, 'review-neurology-myasthenic-crisis-secretion-aspiration-infection-medication-and-alternative-causes'],
    [5, 'review-neurology-myasthenic-crisis-strict-later-bulbar-ventilatory-and-supplied-airway-trajectory'],
    [6, 'handoff-neurology-myasthenic-crisis-trigger-treatment-weaning-recurrence-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, MyastheniaAction])[];
  expert: readonly (readonly [number, MyastheniaAction])[];
  commonError: readonly (readonly [number, MyastheniaAction])[];
  recovery: readonly (readonly [number, MyastheniaAction])[];
};
