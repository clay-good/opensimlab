import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsUterineRupture, type UterineRuptureAction, type UterineRuptureProgress,
} from '../suspected-uterine-rupture-recognition';
import { uterineRuptureInlinePrompt } from '../tutor/suspected-uterine-rupture-recognition-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: UterineRuptureProgress): string {
  const prompt = uterineRuptureInlinePrompt('guided', { scenarioVersion: '0.1.0', uterineRupture: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

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
      narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-suspected-uterine-rupture-scar-pain-fetal-heart-station-activity-bleeding-and-whole-person',
      narration: narrate(patient) };
  }
  if (patient.uncertaintyAtTick === null) {
    return { id: 'uncertainty', focus: 'actions', progress: 0.46, action: 'review-obstetrics-suspected-uterine-rupture-multisignal-nonclassic-triad-and-alternative-cause-boundaries',
      narration: narrate(patient) };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.64, action: 'review-obstetrics-suspected-uterine-rupture-parallel-maternal-fetal-surgical-hemorrhage-fertility-and-communication-readiness',
      narration: narrate(patient) };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-suspected-uterine-rupture-fixed-worsening-and-laparotomy-start-report',
      narration: 'Read the fixed report as this case rather than as a trajectory. It describes worsening and a laparotomy that has started. No treatment, anesthetic, birth, repair or hysterectomy is chosen here, it is a contrast rather than a prediction, and it confirms nothing about what will be found.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-suspected-uterine-rupture-maternal-fetal-hemorrhage-surgery-newborn-fertility-support-and-outcome-risk',
    narration: 'The abdomen is open and nothing is settled: no operative confirmation, no controlled bleeding, no known total loss, no fetal condition, no treatment effect. Hand off the shock, the hidden bleeding, the fetal compromise, the surgical decisions including the ones about her fertility, the newborn team, what she will remember of this, the record, and the review that follows.' };
}
