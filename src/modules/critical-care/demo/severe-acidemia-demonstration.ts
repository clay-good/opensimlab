import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsSevereAcidemia, type SevereAcidemiaAction, type SevereAcidemiaProgress,
} from '../severe-acidemia';
import { severeAcidemiaInlinePrompt } from '../tutor/severe-acidemia-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: SevereAcidemiaProgress): string {
  const prompt = severeAcidemiaInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const SEVERE_ACIDEMIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsSevereAcidemiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsSevereAcidemia(scenario);
}

export interface SevereAcidemiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: SevereAcidemiaAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a number that asks to be corrected.
 *
 * Five beats in the only order the engine accepts. It examines nobody, acquires
 * or interprets no gas, calculates and diagnoses nothing, delivers no fluid,
 * buffer, vasopressor, electrolyte or antidote, doses nothing, changes no
 * ventilator setting, starts no kidney support, treats no source, determines no
 * disposition, and predicts no outcome.
 */
export function severeAcidemiaDemonstrationStep(
  patient?: SevereAcidemiaProgress,
): SevereAcidemiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'His pH is better and nobody gave him bicarbonate. The arithmetic — a bicarbonate of 14 predicting a PaCO2 near 29 against an actual 48 — is what found the half of this that could be fixed in minutes, and the half that could not is still septic shock with a rising creatinine. Correcting a number was never going to be the treatment. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'monitor', progress: 0.12,
      action: 'recognize-severe-acidemia', narration: narrate(patient) };
  }
  if (patient.analysisAtTick === null) {
    return { id: 'analyze', focus: 'monitor', progress: 0.32,
      action: 'analyze-severe-acidemia-context', narration: narrate(patient) };
  }
  if (patient.ventilationAtTick === null) {
    return { id: 'ventilate', focus: 'actions', progress: 0.54,
      action: 'protect-severe-acidemia-ventilation', narration: narrate(patient) };
  }
  if (patient.causePlanAtTick === null) {
    return { id: 'cause', focus: 'actions', progress: 0.76,
      action: 'activate-severe-acidemia-cause-plan', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-severe-acidemia-trajectory', narration: narrate(patient) };
}
