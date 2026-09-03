import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsAtony, type AtonyAction, type AtonyProgress,
} from '../postpartum-hemorrhage-uterine-atony';
import { atonyInlinePrompt } from '../tutor/postpartum-hemorrhage-uterine-atony-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: AtonyProgress): string {
  const prompt = atonyInlinePrompt('guided', { scenarioVersion: '0.1.0', atony: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const ATONY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAtonyDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAtony(scenario);
}

export interface AtonyDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AtonyAction; readonly finished?: boolean;
}

/**
 * The worked example for a number that has not arrived yet.
 *
 * Six hundred and fifty millilitres is not a thousand, and waiting for a
 * thousand is the error this lesson refuses: the definition exists so cases can
 * be counted, and what should start the response is a heart rate of 118 and a
 * pressure of 94/58 eight minutes after birth. The second refusal is the single
 * cause — a boggy uterus makes atony most likely and not the only thing. This
 * example measures no loss, examines no uterus, placenta or tract, and selects
 * no uterotonic, fluid, component, tamponade or operation.
 */
export function atonyDemonstrationStep(
  patient?: AtonyProgress,
): AtonyDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on steadier with the bleeding slower and nothing settled. Nothing was proven and nothing was excluded — not the cause, not the coagulation, not what is collecting where nobody can see it. This ends the example, not the hemorrhage.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-obstetrics-atony-hemorrhage-birth-clock-measured-loss-physiology-tone-and-whole-person',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'actions', progress: 0.26, action: 'recognize-obstetrics-atony-postpartum-hemorrhage-and-atony-pattern-without-threshold-tone-or-single-cause-closure',
      narration: narrate(patient) };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.46, action: 'activate-obstetrics-atony-hemorrhage-obstetric-anesthesia-nursing-blood-bank-operating-room-and-dignity-ownership',
      narration: narrate(patient) };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.64, action: 'review-obstetrics-atony-supplied-tone-placenta-tract-coagulation-perfusion-and-competing-cause-boundary',
      narration: narrate(patient) };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'record-obstetrics-atony-bounded-qualified-motive-bundle-escalation-intent-and-strict-later-review',
      narration: 'Record the bounded qualified bundle and escalation intent, let the authored interval pass, and read the qualified team’s 10-minute report. No product, dose, route, massage technique, fluid, component, tamponade or operation is chosen here. The interval is a contrast rather than a required wait, and nothing here says how fast any individual bleeding slows.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-atony-recurrent-bleeding-shock-coagulopathy-blood-procedure-newborn-and-outcome-risk',
    narration: 'A rate of 104, a pressure of 102/64, a firmer uterus and visibly slower bleeding — none of which proves the bundle did it, that the loss has stopped, that her coagulation is holding, or that nothing is collecting where it cannot be seen. Hand off the cumulative loss, the hemoglobin trajectory, the coagulation, the transfusion and procedure questions, her pain and privacy, the feeding and newborn support, and the disposition.' };
}
