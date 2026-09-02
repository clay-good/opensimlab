import type { CerebellarIchAction } from './spontaneous-cerebellar-intracerebral-hemorrhage';

/**
 * Reference transcripts for the cerebellar-hemorrhage lesson.
 *
 * The error path is the one a recognisable syndrome invites: vertigo, vomiting,
 * dysarthria and truncal ataxia is a cerebellar stroke, so escalate on the
 * syndrome and read the scan afterwards. It is an ordering error rather than a
 * treatment error, because this lesson delivers no treatment. What it skips is
 * the beat that establishes this is eleven millilitres of blood in a closed
 * box with an effaced fourth ventricle — which is what decides who is called
 * and what happens next. The recovery path starts from that refusal and still
 * reaches a correct handoff in the same run.
 */
export const CEREBELLAR_ICH_FIXTURES = {
  scenarioId: 'spontaneous-cerebellar-intracerebral-hemorrhage', contentVersion: '0.1.0', seed: 6187,
  noAction: [],
  expert: [
    [0, 'reconcile-neurology-cerebellar-ich-clock-deficit-alertness-and-whole-patient'],
    [1, 'review-neurology-cerebellar-ich-imaging-location-causes-and-immediate-threats'],
    [2, 'recognize-neurology-cerebellar-ich-posterior-fossa-escalation-boundary'],
    [3, 'activate-neurology-cerebellar-ich-qualified-neurocritical-neurosurgical-and-airway-ownership'],
    [4, 'review-neurology-cerebellar-ich-strict-later-neurologic-and-airway-trajectory'],
    [5, 'handoff-neurology-cerebellar-ich-imaging-expansion-etiology-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-neurology-cerebellar-ich-clock-deficit-alertness-and-whole-patient'],
    [1, 'recognize-neurology-cerebellar-ich-posterior-fossa-escalation-boundary'],
    [2, 'activate-neurology-cerebellar-ich-qualified-neurocritical-neurosurgical-and-airway-ownership'],
  ],
  recovery: [
    [0, 'reconcile-neurology-cerebellar-ich-clock-deficit-alertness-and-whole-patient'],
    [1, 'recognize-neurology-cerebellar-ich-posterior-fossa-escalation-boundary'],
    [2, 'review-neurology-cerebellar-ich-imaging-location-causes-and-immediate-threats'],
    [3, 'recognize-neurology-cerebellar-ich-posterior-fossa-escalation-boundary'],
    [4, 'activate-neurology-cerebellar-ich-qualified-neurocritical-neurosurgical-and-airway-ownership'],
    [5, 'review-neurology-cerebellar-ich-strict-later-neurologic-and-airway-trajectory'],
    [6, 'handoff-neurology-cerebellar-ich-imaging-expansion-etiology-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, CerebellarIchAction])[];
  expert: readonly (readonly [number, CerebellarIchAction])[];
  commonError: readonly (readonly [number, CerebellarIchAction])[];
  recovery: readonly (readonly [number, CerebellarIchAction])[];
};
