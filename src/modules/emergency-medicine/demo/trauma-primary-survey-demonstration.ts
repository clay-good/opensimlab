import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsTraumaPrimarySurvey, type TraumaPrimarySurveyAction,
  type TraumaPrimarySurveyProgress,
} from '../trauma-primary-survey';
import { traumaPrimarySurveyInlinePrompt } from '../tutor/trauma-primary-survey-guidance';

/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: TraumaPrimarySurveyProgress): string {
  const prompt = traumaPrimarySurveyInlinePrompt('guided', { scenarioVersion: '0.1.0', patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const TRAUMA_PRIMARY_SURVEY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsTraumaPrimarySurveyDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsTraumaPrimarySurvey(scenario);
}

export interface TraumaPrimarySurveyDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: TraumaPrimarySurveyAction;
  readonly finished?: boolean;
}

/**
 * The worked example for the letter in front of the alphabet.
 *
 * Six beats in the only order the engine accepts. It examines nobody, applies
 * no tourniquet or binder, protects no spine, selects no product or dose,
 * delivers nothing, acquires no imaging, log-rolls nobody, operates on nobody,
 * and predicts no outcome.
 */
export function traumaPrimarySurveyDemonstrationStep(
  patient?: TraumaPrimarySurveyProgress,
): TraumaPrimarySurveyDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.repeatedAtTick !== null) {
    return { id: 'finished', focus: 'monitor', progress: 1, finished: true,
      narration: 'The tourniquet went on before anybody looked at the airway, and that ordering is the whole example. Exsanguination from a limb can empty a circulation faster than an obstructed airway empties it of oxygen, and the airway of a patient who has bled out is not a problem anyone gets to solve — which is what the C in front of ABCDE is for. Then the shock that persisted after the external bleeding stopped, which is how the pelvis and the abdomen announced themselves. The survey was repeated because a primary survey done once is a photograph of a patient who is still changing, and the abdominal concern went to the definitive-control team unresolved rather than smoothed over. Nothing here was applied, delivered, imaged, rolled or operated on. This ends the example, not the evaluation.' };
  }
  if (patient.activatedAtTick === null) {
    return { id: 'activation', focus: 'actions', progress: 0.1,
      action: 'activate-trauma-primary-survey', narration: narrate(patient) };
  }
  if (patient.catastrophicHemorrhageAtTick === null) {
    return { id: 'hemorrhage', focus: 'actions', progress: 0.27,
      action: 'control-trauma-catastrophic-hemorrhage', narration: narrate(patient) };
  }
  if (patient.airwayBreathingAtTick === null) {
    return { id: 'airway', focus: 'monitor', progress: 0.45,
      action: 'review-trauma-airway-and-breathing', narration: narrate(patient) };
  }
  if (patient.circulationAtTick === null) {
    return { id: 'circulation', focus: 'actions', progress: 0.62,
      action: 'record-trauma-circulation-response', narration: narrate(patient) };
  }
  if (patient.disabilityExposureAtTick === null) {
    return { id: 'exposure', focus: 'monitor', progress: 0.79,
      action: 'review-trauma-disability-and-exposure', narration: narrate(patient) };
  }
  return { id: 'repeat', focus: 'monitor', progress: 0.92,
    action: 'repeat-trauma-primary-survey', narration: narrate(patient) };
}
