import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { SalicylateProgress } from '../salicylate-falling-number';

export const SALICYLATE_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a poisoning where the number going down is the
 * bad news.
 *
 * Everything at this bedside points the wrong way. The pH is 7.45, which looks
 * fine and is two disorders cancelling. The breathing is fast, which looks like
 * distress and is the only thing holding that pH up. And at nine hours the
 * salicylate has fallen while the pH, the potassium and her mental state have
 * all gone the other way, which is deterioration rather than response. The
 * prompts keep the pH rather than the concentration as the thing being watched,
 * and they name the airway as the hazard it is here — taking over her breathing
 * removes the compensation she is running on — without choosing a technique, a
 * setting, a fluid, a target, or a dialysis threshold, all of which are
 * qualified-team work.
 */
export function salicylateInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly salicylate?: SalicylateProgress;
}) {
  const patient = input.salicylate;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('salicylate-trajectory', true,
    'Describe the breathing as a finding rather than as distress.',
    'Seven hours after immediate-release aspirin, with vomiting, tinnitus, diaphoresis, thirst, dry mucosa and reduced urine output, a respiratory rate of 30 is the compensation she is running on. The reported quantity is uncertain and is not a treatment guide. She is alert, and none of that is the same as stable.');
  if (patient.recognitionAtTick === null) return prompt('salicylate-recognize', true,
    'Say what the near-normal pH is actually made of.',
    'pH 7.45 with PCO2 23 and bicarbonate 16 and an anion gap of 20 is a respiratory alkalosis and an anion-gap metabolic acidosis at the same time, not a patient who is compensating well. One concentration, unit or gap does not close this — acute versus chronic exposure, formulation, ongoing absorption, renal function, potassium, glucose, volume, CNS and pulmonary findings all stay coupled.');
  if (patient.supportAtTick === null) return prompt('salicylate-support', true,
    'Call everyone who might be needed later, now.',
    'Poison center or medical toxicology, emergency and critical care, nephrology early rather than at the point of decision, the laboratory for serial testing, and compassionate nonjudgmental safety ownership. Nephrology being available is not the same as dialysis being chosen, and getting them late is the failure mode.');
  if (patient.evidenceAtTick === null) return prompt('salicylate-evidence', true,
    'Read the acid-base, the volume and the potassium before committing to anything, and name the airway as a hazard.',
    'A potassium of 3.2 with vomiting and reduced urine output limits what urinary alkalinization can achieve, and she is volume depleted. The airway is the trap here: taking over her breathing removes the hyperventilation holding her pH up, and a fall in pH drives salicylate into tissue. That does not make it never right; it makes it a decision for the team that will manage the ventilation, not a default.');
  if (patient.reassessmentAtTick === null) return prompt('salicylate-observe', false,
    'Record the intent as intent, let the interval pass, and read the 9-hour report.',
    'The interval is a contrast rather than a required wait. Nothing here says how fast any individual poisoning moves, in either direction.');
  return prompt('salicylate-handoff', true,
    'Hand off a number that fell and a patient who got worse, and say that those are the same sentence.',
    'Salicylate 46 mg/dL with pH 7.32, bicarbonate 13, potassium 3.0 and new confusion is ominous rather than improvement. It does not prove where the drug went, that the treatment failed, or that absorption has stopped. CNS deterioration, pulmonary complications, worsening acidemia, ongoing absorption, potassium, the extracorporeal question and her safety all travel with her.');
}
