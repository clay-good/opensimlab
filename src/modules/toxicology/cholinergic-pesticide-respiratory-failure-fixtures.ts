import type { CholinergicAction } from './cholinergic-pesticide-respiratory-failure';

/**
 * Reference transcripts for the cholinergic lesson.
 *
 * The error path is the one every instinct in the room pushes toward: a man is
 * drowning in his own secretions, so go to him. He is in still-wet concentrate
 * and nobody is in protective equipment yet, and the step being skipped is the
 * one that keeps the people treating him from becoming patients. It is an
 * ordering error rather than a treatment error, because this lesson delivers no
 * treatment. The recovery path starts from that refusal and still reaches a
 * correct handoff in the same run.
 */
export const CHOLINERGIC_FIXTURES = {
  scenarioId: 'cholinergic-pesticide-respiratory-failure', contentVersion: '0.1.0', seed: 5629,
  noAction: [],
  expert: [
    [0, 'reconcile-toxicology-cholinergic-product-route-secondary-contamination-secretions-breathing-weakness-cns-and-whole-patient'],
    [1, 'recognize-toxicology-cholinergic-muscarinic-nicotinic-and-cns-pattern-without-mnemonic-or-cholinesterase-only-closure'],
    [2, 'activate-toxicology-cholinergic-ppe-decontamination-airway-resuscitation-poison-center-and-safety-ownership'],
    [3, 'review-toxicology-cholinergic-supplied-respiratory-neuromuscular-cns-exposure-cholinesterase-and-airway-boundary'],
    [4, 'record-toxicology-cholinergic-bounded-qualified-atropine-pralidoxime-benzodiazepine-airway-and-surveillance-intent-with-strict-later-review'],
    [5, 'handoff-toxicology-cholinergic-recurrent-secretions-bronchospasm-weakness-intermediate-syndrome-exposure-seizure-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-toxicology-cholinergic-product-route-secondary-contamination-secretions-breathing-weakness-cns-and-whole-patient'],
    [1, 'recognize-toxicology-cholinergic-muscarinic-nicotinic-and-cns-pattern-without-mnemonic-or-cholinesterase-only-closure'],
    [2, 'review-toxicology-cholinergic-supplied-respiratory-neuromuscular-cns-exposure-cholinesterase-and-airway-boundary'],
    [3, 'record-toxicology-cholinergic-bounded-qualified-atropine-pralidoxime-benzodiazepine-airway-and-surveillance-intent-with-strict-later-review'],
  ],
  recovery: [
    [0, 'reconcile-toxicology-cholinergic-product-route-secondary-contamination-secretions-breathing-weakness-cns-and-whole-patient'],
    [1, 'recognize-toxicology-cholinergic-muscarinic-nicotinic-and-cns-pattern-without-mnemonic-or-cholinesterase-only-closure'],
    [2, 'review-toxicology-cholinergic-supplied-respiratory-neuromuscular-cns-exposure-cholinesterase-and-airway-boundary'],
    [3, 'activate-toxicology-cholinergic-ppe-decontamination-airway-resuscitation-poison-center-and-safety-ownership'],
    [4, 'review-toxicology-cholinergic-supplied-respiratory-neuromuscular-cns-exposure-cholinesterase-and-airway-boundary'],
    [5, 'record-toxicology-cholinergic-bounded-qualified-atropine-pralidoxime-benzodiazepine-airway-and-surveillance-intent-with-strict-later-review'],
    [6, 'handoff-toxicology-cholinergic-recurrent-secretions-bronchospasm-weakness-intermediate-syndrome-exposure-seizure-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, CholinergicAction])[];
  expert: readonly (readonly [number, CholinergicAction])[];
  commonError: readonly (readonly [number, CholinergicAction])[];
  recovery: readonly (readonly [number, CholinergicAction])[];
};
