import type { AtonyAction } from './postpartum-hemorrhage-uterine-atony';

/**
 * Reference transcripts for the postpartum-hemorrhage lesson.
 *
 * The error path is the one a differential invites: go and work out which of
 * the causes this is — check the placenta report, the tract, the coagulation —
 * before calling it a hemorrhage and getting the room. It is an ordering error
 * rather than a treatment error, because this lesson delivers no treatment.
 * What it skips is the naming and the call, and she is bleeding while the
 * thinking happens. The recovery path starts from that refusal and still
 * reaches a correct handoff in the same run.
 */
export const ATONY_FIXTURES = {
  scenarioId: 'postpartum-hemorrhage-uterine-atony', contentVersion: '0.1.0', seed: 7104,
  noAction: [],
  expert: [
    [0, 'reconcile-obstetrics-atony-hemorrhage-birth-clock-measured-loss-physiology-tone-and-whole-person'],
    [1, 'recognize-obstetrics-atony-postpartum-hemorrhage-and-atony-pattern-without-threshold-tone-or-single-cause-closure'],
    [2, 'activate-obstetrics-atony-hemorrhage-obstetric-anesthesia-nursing-blood-bank-operating-room-and-dignity-ownership'],
    [3, 'review-obstetrics-atony-supplied-tone-placenta-tract-coagulation-perfusion-and-competing-cause-boundary'],
    [4, 'record-obstetrics-atony-bounded-qualified-motive-bundle-escalation-intent-and-strict-later-review'],
    [5, 'handoff-obstetrics-atony-recurrent-bleeding-shock-coagulopathy-blood-procedure-newborn-and-outcome-risk'],
  ],
  commonError: [
    [0, 'reconcile-obstetrics-atony-hemorrhage-birth-clock-measured-loss-physiology-tone-and-whole-person'],
    [1, 'review-obstetrics-atony-supplied-tone-placenta-tract-coagulation-perfusion-and-competing-cause-boundary'],
    [2, 'record-obstetrics-atony-bounded-qualified-motive-bundle-escalation-intent-and-strict-later-review'],
  ],
  recovery: [
    [0, 'reconcile-obstetrics-atony-hemorrhage-birth-clock-measured-loss-physiology-tone-and-whole-person'],
    [1, 'review-obstetrics-atony-supplied-tone-placenta-tract-coagulation-perfusion-and-competing-cause-boundary'],
    [2, 'recognize-obstetrics-atony-postpartum-hemorrhage-and-atony-pattern-without-threshold-tone-or-single-cause-closure'],
    [3, 'activate-obstetrics-atony-hemorrhage-obstetric-anesthesia-nursing-blood-bank-operating-room-and-dignity-ownership'],
    [4, 'review-obstetrics-atony-supplied-tone-placenta-tract-coagulation-perfusion-and-competing-cause-boundary'],
    [5, 'record-obstetrics-atony-bounded-qualified-motive-bundle-escalation-intent-and-strict-later-review'],
    [6, 'handoff-obstetrics-atony-recurrent-bleeding-shock-coagulopathy-blood-procedure-newborn-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, AtonyAction])[];
  expert: readonly (readonly [number, AtonyAction])[];
  commonError: readonly (readonly [number, AtonyAction])[];
  recovery: readonly (readonly [number, AtonyAction])[];
};
