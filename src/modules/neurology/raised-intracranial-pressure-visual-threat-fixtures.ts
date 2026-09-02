import type { RaisedIcpAction } from './raised-intracranial-pressure-visual-threat';

/**
 * Reference transcripts for the raised-pressure lesson.
 *
 * The error path is the one a five-week headache invites: get the right people,
 * then go to the MRI, the venogram and the opening pressure, because that is
 * where the diagnosis is. It is an ordering error rather than a treatment
 * error, because this lesson delivers no treatment. What it skips is the
 * measurement that says how much time the optic nerves have — the confirmed
 * papilledema and the visual fields — and the fields are the thing that gets
 * worse in this illness while everything else looks fine. The recovery path
 * starts from that refusal and still reaches a correct handoff in the same run.
 */
export const RAISED_ICP_FIXTURES = {
  scenarioId: 'raised-intracranial-pressure-visual-threat', contentVersion: '0.1.0', seed: 6515,
  noAction: [],
  expert: [
    [0, 'reconcile-neurology-raised-icp-headache-visual-tinnitus-diplopia-and-whole-patient'],
    [1, 'activate-neurology-raised-icp-qualified-neurology-neuro-ophthalmology-imaging-and-procedure-ownership'],
    [2, 'review-neurology-raised-icp-confirmed-papilledema-visual-function-and-pseudopapilledema-boundary'],
    [3, 'review-neurology-raised-icp-mri-venography-lp-secondary-cause-and-diagnostic-boundary'],
    [4, 'review-neurology-raised-icp-strict-later-worsening-visual-field-and-imminent-sight-threat'],
    [5, 'handoff-neurology-raised-icp-vision-rescue-cause-disease-headache-follow-up-and-active-risk'],
  ],
  commonError: [
    [0, 'reconcile-neurology-raised-icp-headache-visual-tinnitus-diplopia-and-whole-patient'],
    [1, 'activate-neurology-raised-icp-qualified-neurology-neuro-ophthalmology-imaging-and-procedure-ownership'],
    [2, 'review-neurology-raised-icp-mri-venography-lp-secondary-cause-and-diagnostic-boundary'],
  ],
  recovery: [
    [0, 'reconcile-neurology-raised-icp-headache-visual-tinnitus-diplopia-and-whole-patient'],
    [1, 'activate-neurology-raised-icp-qualified-neurology-neuro-ophthalmology-imaging-and-procedure-ownership'],
    [2, 'review-neurology-raised-icp-mri-venography-lp-secondary-cause-and-diagnostic-boundary'],
    [3, 'review-neurology-raised-icp-confirmed-papilledema-visual-function-and-pseudopapilledema-boundary'],
    [4, 'review-neurology-raised-icp-mri-venography-lp-secondary-cause-and-diagnostic-boundary'],
    [5, 'review-neurology-raised-icp-strict-later-worsening-visual-field-and-imminent-sight-threat'],
    [6, 'handoff-neurology-raised-icp-vision-rescue-cause-disease-headache-follow-up-and-active-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, RaisedIcpAction])[];
  expert: readonly (readonly [number, RaisedIcpAction])[];
  commonError: readonly (readonly [number, RaisedIcpAction])[];
  recovery: readonly (readonly [number, RaisedIcpAction])[];
};
