import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsOpioidXylazine, type OpioidXylazineAction, type OpioidXylazineProgress,
} from '../opioid-xylazine-persistent-sedation';
import { opioidXylazineInlinePrompt } from '../tutor/opioid-xylazine-persistent-sedation-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: OpioidXylazineProgress): string {
  const prompt = opioidXylazineInlinePrompt('guided', { scenarioVersion: '0.1.0', opioidXylazine: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const OPIOID_XYLAZINE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsOpioidXylazineDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsOpioidXylazine(scenario);
}

export interface OpioidXylazineDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: OpioidXylazineAction; readonly finished?: boolean;
}

/**
 * The worked example for a patient who has already had naloxone and is still
 * not awake.
 *
 * The endpoint that was ever in danger is the breathing, not the wakefulness,
 * so this example says the end-tidal CO2 first and gives ventilation an owner
 * rather than reaching for another dose. Sedation persisting afterwards proves
 * nothing about an agent or a resistance, and a routine screen neither
 * establishes nor excludes the adulterant. No veterinary antagonist appears
 * anywhere, and the example selects no oxygen setting, airway, antagonist,
 * product, dose, route, or wound treatment.
 */
export function opioidXylazineDemonstrationStep(
  patient?: OpioidXylazineProgress,
): OpioidXylazineDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on breathing and still drowsy, which is the shape of a good outcome here rather than a disappointing one. Nothing was proven and nothing was excluded — not the agent, not an adulterant, not the next hour when the antagonist wears off. This ends the example, not the poisoning.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-toxicology-opioid-xylazine-exposure-rescue-breathing-sedation-perfusion-and-whole-patient',
      narration: narrate(patient) };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.24, action: 'recognize-toxicology-opioid-xylazine-opioid-emergency-and-possible-adulterant-without-pupil-naloxone-response-or-screen-only-closure',
      narration: 'Call it an opioid-compatible respiratory emergency with something else possibly on board, and refuse the four ways it gets closed early. Pupils, the naloxone response, a routine screen and a wound do not diagnose an agent, prove resistance or grade her — and routine immunoassay screening neither establishes nor excludes xylazine, so it cannot settle this either way. Still being sedated after naloxone is not evidence that naloxone failed: a sedative it was never going to touch would look exactly like this, and so would alcohol, a benzodiazepine, clonidine, a head injury, hypoglycemia, or simply more opioid than has been reversed.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.4, action: 'activate-toxicology-opioid-xylazine-ventilation-oxygen-monitoring-toxicology-addiction-wound-and-dignity-ownership',
      narration: narrate(patient) };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.56, action: 'review-toxicology-opioid-xylazine-supplied-respiratory-response-circulation-temperature-glucose-ecg-screen-wound-and-differential-boundary',
      narration: narrate(patient) };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'record-toxicology-opioid-xylazine-bounded-qualified-continued-support-opioid-antagonist-symptomatic-care-no-veterinary-antagonist-and-strict-later-review',
      narration: 'Record the continued airway support, oxygenation and ventilation, the opioid-antagonist intent for the opioid part, the perfusion, temperature and glucose support, the aspiration and rhabdomyolysis review, and the serial reassessment and supportive care for whatever persists. No veterinary alpha-2 antagonist is recorded, because supportive care is what the sedative part gets here. Let the authored interval pass and read the qualified team’s 10-minute report.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-toxicology-opioid-xylazine-recurrent-depression-persistent-sedation-shock-hypothermia-wound-withdrawal-addiction-and-outcome-risk',
    narration: 'Fourteen breaths a minute, 97% on supplied support, an end-tidal of 43 and a rate of 54 — and she is still drowsy, still localizing without answering. That is the lesson rather than a disappointment: the endpoint that mattered moved, and the one that did not move proves nothing about an agent, a resistance or an adulterant. Hand off recurrent respiratory depression as the antagonist wears off, the persistent sedation, the pressure, the temperature, aspiration, her wounds, withdrawal and what she is offered next.' };
}
