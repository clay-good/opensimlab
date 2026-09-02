import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsUterineRupture, type UterineRuptureAction, type UterineRuptureProgress,
} from '../suspected-uterine-rupture-recognition';

export const UTERINE_RUPTURE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsUterineRuptureDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsUterineRupture(scenario);
}

export interface UterineRuptureDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: UterineRuptureAction; readonly finished?: boolean;
}

/**
 * The worked example for a diagnosis that only the operation can make.
 *
 * Waiting to be sure means waiting for the laparotomy, which is the thing the
 * waiting delays. This example examines nobody, interprets no fetal
 * monitoring, and selects no anesthetic, birth, repair or hysterectomy.
 */
export function uterineRuptureDemonstrationStep(
  patient?: UterineRuptureProgress,
): UterineRuptureDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on with her abdomen open and the suspicion still a suspicion. Nothing was proven and nothing was excluded — not the rupture, not the bleeding, not what will be left of her uterus. This ends the example, not the emergency.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-suspected-uterine-rupture-category-one-surgery-anesthesia-blood-newborn-and-support-response',
      narration: 'Call for the theatre on the suspicion, because nothing here will upgrade it. A uterine rupture is confirmed by opening the abdomen and not before, so waiting to be certain means waiting for the operation that the waiting is delaying. Category-1 surgery, anesthesia, blood, the newborn team, a leader, communication and support all start now. She is pale and frightened and asking what is happening; someone whose job is to talk to her is part of this response.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-suspected-uterine-rupture-scar-pain-fetal-heart-station-activity-bleeding-and-whole-person',
      narration: 'Read the findings as one coupled pattern rather than a list. One prior low-transverse caesarean, sudden severe pain that persists between contractions, a fetal heart that has fallen to 72, station lost from -1 to -3, efficient uterine activity that simply stopped, 60 mL of new bleeding, scar tenderness, and a mother at 118 and 96/58. Any one of those has other explanations. Together, and appearing together twelve minutes ago, they are the pattern.' };
  }
  if (patient.uncertaintyAtTick === null) {
    return { id: 'uncertainty', focus: 'actions', progress: 0.46, action: 'review-obstetrics-suspected-uterine-rupture-multisignal-nonclassic-triad-and-alternative-cause-boundaries',
      narration: 'Keep it suspected, and keep the alternatives alive while you act on it. The classic triad is neither necessary nor reliable — the abnormal fetal heart rate is the most consistent sign and even it is not specific, and loss of station is suggestive rather than diagnostic. Placental abruption, a fetal or vascular cause, a surgical complication and non-obstetric explanations all stay open. Acting on a suspicion at full urgency and holding it as a suspicion are the same posture here rather than opposite ones.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.64, action: 'review-obstetrics-suspected-uterine-rupture-parallel-maternal-fetal-surgical-hemorrhage-fertility-and-communication-readiness',
      narration: 'Let the readiness run in parallel rather than in sequence. Maternal resuscitation and hemorrhage readiness, fetal and newborn readiness, the surgical and anesthetic preparation, and the conversation with her all proceed at once, because arranging any of them after the others costs the same minutes. The fertility question belongs in that conversation before theatre rather than after, since what happens to her uterus may be decided while she is asleep.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-suspected-uterine-rupture-fixed-worsening-and-laparotomy-start-report',
      narration: 'Read the fixed report as this case rather than as a trajectory. It describes worsening and a laparotomy that has started. No treatment, anesthetic, birth, repair or hysterectomy is chosen here, it is a contrast rather than a prediction, and it confirms nothing about what will be found.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-suspected-uterine-rupture-maternal-fetal-hemorrhage-surgery-newborn-fertility-support-and-outcome-risk',
    narration: 'The abdomen is open and nothing is settled: no operative confirmation, no controlled bleeding, no known total loss, no fetal condition, no treatment effect. Hand off the shock, the hidden bleeding, the fetal compromise, the surgical decisions including the ones about her fertility, the newborn team, what she will remember of this, the record, and the review that follows.' };
}
