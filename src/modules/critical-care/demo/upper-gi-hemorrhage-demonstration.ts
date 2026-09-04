import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsUpperGiHemorrhage, type UpperGiHemorrhageAction, type UpperGiHemorrhageProgress,
} from '../upper-gi-hemorrhage';
import { upperGiHemorrhageInlinePrompt } from '../tutor/upper-gi-hemorrhage-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: UpperGiHemorrhageProgress): string {
  const prompt = upperGiHemorrhageInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const UPPER_GI_HEMORRHAGE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsUpperGiHemorrhageDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsUpperGiHemorrhage(scenario);
}

export interface UpperGiHemorrhageDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: UpperGiHemorrhageAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a number that arrives last.
 *
 * Five beats in the only order the engine accepts. It examines nobody, places
 * no access, takes no specimen, transfuses and doses nothing, scopes,
 * embolizes and operates on nobody, diagnoses nothing, determines no
 * disposition, and predicts no outcome.
 */
export function upperGiHemorrhageDemonstrationStep(
  patient?: UpperGiHemorrhageProgress,
): UpperGiHemorrhageDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Two numbers ran this example and neither was the haemoglobin. The lactate and the refill said she was bleeding again before the count caught up, and a pressure of 68 at the end says the resuscitation reached her rather than that the ulcer stopped. In between, the endoscopy was reopened alongside the resuscitation instead of after it, and the two doors past it were named while there was still time to arrange them. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'monitor', progress: 0.12,
      action: 'recognize-recurrent-upper-gi-hemorrhage', narration: narrate(patient) };
  }
  if (patient.patternAtTick === null) {
    return { id: 'pattern', focus: 'monitor', progress: 0.32,
      action: 'review-upper-gi-hemorrhage-pattern', narration: narrate(patient) };
  }
  if (patient.resuscitationAtTick === null) {
    return { id: 'resuscitate', focus: 'actions', progress: 0.54,
      action: 'record-upper-gi-hemorrhage-resuscitation', narration: narrate(patient) };
  }
  if (patient.hemostasisAtTick === null) {
    return { id: 'hemostasis', focus: 'actions', progress: 0.76,
      action: 'activate-repeat-endoscopy-pathway', narration: narrate(patient) };
  }
  return { id: 'reassess', focus: 'monitor', progress: 0.9,
    action: 'reassess-upper-gi-hemorrhage-trajectory', narration: narrate(patient) };
}
