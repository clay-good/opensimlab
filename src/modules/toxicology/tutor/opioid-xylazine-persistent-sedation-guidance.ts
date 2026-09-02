import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { OpioidXylazineProgress } from '../opioid-xylazine-persistent-sedation';

export const OPIOID_XYLAZINE_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a patient who has already had naloxone and is
 * still not awake.
 *
 * The whole lesson turns on which endpoint was ever in danger. It was the
 * breathing, not the wakefulness: she is at six shallow breaths a minute with
 * an end-tidal of 62, and the answer to that is ventilation rather than another
 * dose. Sedation that persists afterwards is not proof that naloxone failed and
 * not proof of an adulterant — a routine screen neither establishes nor
 * excludes xylazine, and alcohol, a benzodiazepine, clonidine, a head injury
 * and simply more opioid than was reversed all look the same from here. There
 * is no veterinary antagonist in this lesson, because supportive care is what
 * the sedative part gets. None of these prompts selects an oxygen setting,
 * airway, antagonist, product, dose, route, or wound treatment.
 */
export function opioidXylazineInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly opioidXylazine?: OpioidXylazineProgress;
}) {
  const patient = input.opioidXylazine;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('opioid-xylazine-trajectory', true,
    'Say which number is the emergency, and it is not her level of consciousness.',
    'Six shallow breaths a minute, a saturation of 84% and an end-tidal CO2 of 62 — she is ventilating badly right now, and that is what will kill her in the next few minutes. Two community naloxone doses and intermittent rescue breathing have already happened; she localizes to pressure and does not answer, with 2 mm pupils, a rate of 50 and 86/48. The sedation is the striking part and the breathing is the dangerous one.');
  if (patient.recognitionAtTick === null) return prompt('opioid-xylazine-recognize', true,
    'Call it an opioid-compatible respiratory emergency with something else possibly on board, and refuse the four ways it gets closed early.',
    'Pupils, the naloxone response, a routine screen and a wound do not diagnose an agent, prove resistance or grade her — and routine immunoassay screening neither establishes nor excludes xylazine, so it cannot settle this either way. Still being sedated after naloxone is not evidence that naloxone failed. A sedative it was never going to touch would look exactly like this, and so would alcohol, a benzodiazepine, clonidine, a head injury, hypoglycemia, or simply more opioid than has been reversed.');
  if (patient.supportAtTick === null) return prompt('opioid-xylazine-support', true,
    'Give the ventilation and the oxygen an owner, and treat her as a person while you do it.',
    'The endpoint that was always in danger is breathing, so ventilation, oxygenation and monitoring ownership come first and keep going regardless of how awake she gets. Reaching for another antagonist dose instead treats the wakefulness, which was never the emergency, and can buy a withdrawal you then have to manage in someone who still cannot protect her airway. Toxicology, addiction, wound and dignity-centered ownership start alongside it.');
  if (patient.evidenceAtTick === null) return prompt('opioid-xylazine-evidence', true,
    'Read what the numbers rule in, what they rule out, and what they cannot speak to.',
    'A glucose of 103 takes hypoglycemia off the table for this presentation; a pH of 7.25 with a PCO2 of 61 is her breathing rather than a metabolic process; a temperature of 35.5°C is its own problem and worsens the sedation. The limited skin survey supplies healed scars and no open, necrotic or limb-threatening wound, which is a finding rather than an absence of one to go looking for. Product identity, fentanyl or another opioid, xylazine or another sedative, and the co-exposures all stay qualified-team work.');
  if (patient.reassessmentAtTick === null) return prompt('opioid-xylazine-observe', false,
    'Record the intents as intents, let the interval pass, and read the 10-minute report.',
    'The interval is a contrast rather than a required wait or a predicted response time. Nothing here says how fast any individual sedation lifts.');
  return prompt('opioid-xylazine-handoff', true,
    'Hand off the breathing you fixed and the sedation you did not.',
    'Fourteen breaths a minute, 97% on supplied support, an end-tidal of 43 and a rate of 54 — and she is still drowsy, still localizing without answering. That is the lesson rather than a disappointment: the endpoint that mattered moved, and the one that did not move proves nothing about an agent, a resistance or an adulterant. Recurrent respiratory depression as the antagonist wears off, the persistent sedation, the pressure, the temperature, aspiration, her wounds, withdrawal and what she is offered next all travel with her.');
}
