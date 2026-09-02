import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsOpioidXylazine, type OpioidXylazineAction, type OpioidXylazineProgress,
} from '../opioid-xylazine-persistent-sedation';

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
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on breathing and still drowsy, which is the shape of a good outcome here rather than a disappointing one. Nothing was proven and nothing was excluded — not the agent, not an adulterant, not the next hour when the antagonist wears off. This ends the example, not the poisoning.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-toxicology-opioid-xylazine-exposure-rescue-breathing-sedation-perfusion-and-whole-patient',
      narration: 'Say which number is the emergency, and it is not her level of consciousness. Six shallow breaths a minute, a saturation of 84% and an end-tidal CO2 of 62 — she is ventilating badly right now, and that is what will kill her in the next few minutes. Two community naloxone doses and intermittent rescue breathing have already happened; she localizes to pressure and does not answer, with 2 mm pupils, a rate of 50 and 86/48. The sedation is the striking part and the breathing is the dangerous one.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.24, action: 'recognize-toxicology-opioid-xylazine-opioid-emergency-and-possible-adulterant-without-pupil-naloxone-response-or-screen-only-closure',
      narration: 'Call it an opioid-compatible respiratory emergency with something else possibly on board, and refuse the four ways it gets closed early. Pupils, the naloxone response, a routine screen and a wound do not diagnose an agent, prove resistance or grade her — and routine immunoassay screening neither establishes nor excludes xylazine, so it cannot settle this either way. Still being sedated after naloxone is not evidence that naloxone failed: a sedative it was never going to touch would look exactly like this, and so would alcohol, a benzodiazepine, clonidine, a head injury, hypoglycemia, or simply more opioid than has been reversed.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.4, action: 'activate-toxicology-opioid-xylazine-ventilation-oxygen-monitoring-toxicology-addiction-wound-and-dignity-ownership',
      narration: 'Give the ventilation and the oxygen an owner, and treat her as a person while you do it. The endpoint that was always in danger is breathing, so ventilation, oxygenation and monitoring ownership come first and keep going regardless of how awake she gets. Reaching for another antagonist dose instead treats the wakefulness, which was never the emergency, and can buy a withdrawal you then have to manage in someone who still cannot protect her airway. Toxicology, addiction, wound and dignity-centered ownership start alongside it.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.56, action: 'review-toxicology-opioid-xylazine-supplied-respiratory-response-circulation-temperature-glucose-ecg-screen-wound-and-differential-boundary',
      narration: 'Read what the numbers rule in, what they rule out, and what they cannot speak to. A glucose of 103 takes hypoglycemia off the table for this presentation; a pH of 7.25 with a PCO2 of 61 is her breathing rather than a metabolic process; a temperature of 35.5°C is its own problem and worsens the sedation. The limited skin survey supplies healed scars and no open, necrotic or limb-threatening wound, which is a finding rather than an absence of one to go looking for. Product identity, fentanyl or another opioid, xylazine or another sedative, and the co-exposures all stay qualified-team work.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'record-toxicology-opioid-xylazine-bounded-qualified-continued-support-opioid-antagonist-symptomatic-care-no-veterinary-antagonist-and-strict-later-review',
      narration: 'Record the continued airway support, oxygenation and ventilation, the opioid-antagonist intent for the opioid part, the perfusion, temperature and glucose support, the aspiration and rhabdomyolysis review, and the serial reassessment and supportive care for whatever persists. No veterinary alpha-2 antagonist is recorded, because supportive care is what the sedative part gets here. Let the authored interval pass and read the qualified team’s 10-minute report.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-toxicology-opioid-xylazine-recurrent-depression-persistent-sedation-shock-hypothermia-wound-withdrawal-addiction-and-outcome-risk',
    narration: 'Fourteen breaths a minute, 97% on supplied support, an end-tidal of 43 and a rate of 54 — and she is still drowsy, still localizing without answering. That is the lesson rather than a disappointment: the endpoint that mattered moved, and the one that did not move proves nothing about an agent, a resistance or an adulterant. Hand off recurrent respiratory depression as the antagonist wears off, the persistent sedation, the pressure, the temperature, aspiration, her wounds, withdrawal and what she is offered next.' };
}
