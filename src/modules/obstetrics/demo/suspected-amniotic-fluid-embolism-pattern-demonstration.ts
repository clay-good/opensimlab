import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsAfe, type AfeAction, type AfeProgress,
} from '../suspected-amniotic-fluid-embolism-pattern';
import { afeInlinePrompt } from '../tutor/suspected-amniotic-fluid-embolism-pattern-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: AfeProgress): string {
  const prompt = afeInlinePrompt('guided', { scenarioVersion: '0.1.0', afe: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const AFE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAfeDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAfe(scenario);
}

export interface AfeDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AfeAction; readonly finished?: boolean;
}

/**
 * The worked example for the one lesson that responds before it understands.
 *
 * There is no confirmatory test for amniotic fluid embolism, so the interval
 * spent working it out is the interval she does not have. This example assesses
 * no pulse, measures no loss, acquires and reads no laboratory value, and
 * selects no oxygen, vasoactive, component, CPR or delivery.
 */
export function afeDemonstrationStep(
  patient?: AfeProgress,
): AfeDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on still in shock, still compromised, and still bleeding into a coagulopathy that is getting worse. Nothing was proven and nothing was excluded — not the diagnosis, which has no confirmatory test, not the alternatives, not the arrest that has not happened. This ends the example, not the event.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-afe-coordinated-obstetric-anesthesia-critical-care-cardiopulmonary-hemorrhage-newborn-and-dignity-response',
      narration: narrate(patient) };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-afe-birth-clock-symptom-order-cardiorespiratory-state-bleeding-coagulation-newborn-and-whole-person',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.46, action: 'recognize-obstetrics-afe-rapid-maternal-collapse-and-coagulopathy-pattern-without-diagnostic-closure',
      narration: narrate(patient) };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.64, action: 'review-obstetrics-afe-supplied-cardiac-pulmonary-hemorrhage-coagulation-uterine-anesthetic-thrombotic-infectious-allergic-and-competing-cause-boundary',
      narration: narrate(patient) };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-afe-fixed-later-breathing-circulation-bleeding-coagulation-and-support-report',
      narration: 'Read the fixed 12-minute report as a checkpoint rather than a direction. It supplies persistent shock, continuing respiratory compromise and a coagulopathy that is still progressing. No treatment, product, dose, route, target, procedure or delivery is chosen here, and nothing says how any individual event of this kind behaves next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-afe-hypoxemia-shock-coagulopathy-bleeding-arrest-procedure-newborn-family-support-and-outcome-risk',
    narration: 'Persistent shock, continuing respiratory compromise and a coagulopathy that is still progressing — nothing here establishes treatment effect, respiratory or hemodynamic recovery, bleeding or coagulation control. Hand off the hypoxemia, the shock, the coagulopathy, the bleeding, the arrest risk, the procedures that may follow, the newborn, her family, the staff who were in the room, and the disposition.' };
}
