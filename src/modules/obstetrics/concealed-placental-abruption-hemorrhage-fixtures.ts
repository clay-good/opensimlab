import type { ConcealedAbruptionAction } from './concealed-placental-abruption-hemorrhage';

/**
 * Reference transcripts for the concealed-abruption lesson.
 *
 * The error path is the one 80 mL of blood invites: go and read the supplied
 * evidence — the placental-location record, the coagulation, the fetal report —
 * before calling this a concealed hemorrhage and bringing the room. It is an
 * ordering error rather than a treatment error, because this lesson delivers no
 * treatment. What it skips is the naming and the call, and the blood that is
 * not on the floor is still leaving her circulation while the thinking happens.
 */
export const CONCEALED_ABRUPTION_FIXTURES = {
  scenarioId: 'concealed-placental-abruption-hemorrhage', contentVersion: '0.1.0', seed: 7132,
  noAction: [],
  expert: [
    [0, 'reconcile-obstetrics-abruption-pain-visible-blood-maternal-physiology-fetal-context-and-whole-person'],
    [1, 'recognize-obstetrics-abruption-concealed-hemorrhage-pattern-without-visible-volume-ultrasound-or-single-cause-closure'],
    [2, 'activate-obstetrics-abruption-hemorrhage-anesthesia-blood-bank-operating-room-neonatal-and-dignity-ownership'],
    [3, 'review-obstetrics-abruption-supplied-perfusion-uterine-fetal-coagulation-placental-and-competing-cause-boundary'],
    [4, 'record-obstetrics-abruption-bounded-qualified-resuscitation-coagulation-and-urgent-delivery-intent-with-strict-later-review'],
    [5, 'handoff-obstetrics-abruption-concealed-loss-shock-coagulopathy-fetal-delivery-neonatal-bereavement-and-outcome-risk'],
  ],
  commonError: [
    [0, 'reconcile-obstetrics-abruption-pain-visible-blood-maternal-physiology-fetal-context-and-whole-person'],
    [1, 'review-obstetrics-abruption-supplied-perfusion-uterine-fetal-coagulation-placental-and-competing-cause-boundary'],
    [2, 'record-obstetrics-abruption-bounded-qualified-resuscitation-coagulation-and-urgent-delivery-intent-with-strict-later-review'],
  ],
  recovery: [
    [0, 'reconcile-obstetrics-abruption-pain-visible-blood-maternal-physiology-fetal-context-and-whole-person'],
    [1, 'review-obstetrics-abruption-supplied-perfusion-uterine-fetal-coagulation-placental-and-competing-cause-boundary'],
    [2, 'recognize-obstetrics-abruption-concealed-hemorrhage-pattern-without-visible-volume-ultrasound-or-single-cause-closure'],
    [3, 'activate-obstetrics-abruption-hemorrhage-anesthesia-blood-bank-operating-room-neonatal-and-dignity-ownership'],
    [4, 'review-obstetrics-abruption-supplied-perfusion-uterine-fetal-coagulation-placental-and-competing-cause-boundary'],
    [5, 'record-obstetrics-abruption-bounded-qualified-resuscitation-coagulation-and-urgent-delivery-intent-with-strict-later-review'],
    [6, 'handoff-obstetrics-abruption-concealed-loss-shock-coagulopathy-fetal-delivery-neonatal-bereavement-and-outcome-risk'],
  ],
} as const satisfies {
  scenarioId: string; contentVersion: string; seed: number;
  noAction: readonly (readonly [number, ConcealedAbruptionAction])[];
  expert: readonly (readonly [number, ConcealedAbruptionAction])[];
  commonError: readonly (readonly [number, ConcealedAbruptionAction])[];
  recovery: readonly (readonly [number, ConcealedAbruptionAction])[];
};
