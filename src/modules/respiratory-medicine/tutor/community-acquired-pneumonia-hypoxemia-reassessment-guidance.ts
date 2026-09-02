import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { CapHypoxemiaProgress } from '../community-acquired-pneumonia-hypoxemia-reassessment';

export const CAP_HYPOXEMIA_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a patient who is sicker than her blood pressure
 * suggests.
 *
 * She is 62, alert, warm, refilling in two seconds, with a pressure of 116/70
 * — and a room-air saturation of 85% with a PaO₂ of 51, breathing 32 times a
 * minute using accessory muscles. The reassuring half of that picture is what
 * makes this lesson necessary: hypoxemia is the finding, and it gets answered
 * before the reasoning starts. The second refusal is the score itself. Three
 * minor severe-CAP criteria support an urgent higher-acuity judgment; they do
 * not decide where she goes, and neither does this lesson. None of these
 * prompts delivers oxygen, selects a support device or an antimicrobial,
 * acquires a test, or determines a disposition.
 */
export function capHypoxemiaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly capHypoxemia?: CapHypoxemiaProgress;
}) {
  const patient = input.capHypoxemia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('cap-support', true,
    'Confirm the hypoxemia is real and get it answered before anything else.',
    'A room-air saturation of 85% on a regular, pulse-coherent trace with a PaO₂ of 51 on the blood gas is the same finding twice, so it is not an artifact. She is alert, warm and normotensive, which is the part that gets people caught: nothing about a pressure of 116/70 makes 85% acceptable. Oxygen and the device belong to the qualified team, and the reasoning that follows happens while she is being supported rather than before.');
  if (patient.evidenceAtTick === null) return prompt('cap-evidence', true,
    'Read the film and the bloods as consistent, not as conclusive.',
    'Right middle- and lower-lobe consolidation with no pneumothorax, no edema pattern and no effusion big enough to explain this, a white count of 14.8, a normal creatinine and a lactate of 1.8. That fits pneumonia and does not settle it: viral and bacterial causes are both unresolved, and the things that present this way and are not pneumonia have to stay on the list while the treatment is planned as though it is.');
  if (patient.severityAtTick === null) return prompt('cap-severity', true,
    'Count the criteria, and do not let them decide where she goes.',
    'Three minor severe-CAP features are present — a respiratory rate of at least 30, a PaO₂/FiO₂ no greater than 250, and multilobar infiltrates — with no major criterion, no confusion, no vasopressor requirement, no ventilation, and none of the hematologic or renal features. That supports an urgent higher-acuity judgment. It does not independently determine a location of care, and a score has never been able to.');
  if (patient.treatmentIntentAtTick === null) return prompt('cap-treatment', true,
    'Record what should be sent and started, and choose neither.',
    'Cultures and the rest of the testing intent, and empiric coverage appropriate to a severe community-acquired pneumonia, are recorded here as intent rather than selected. What narrows the empiric question is what is absent: no previous respiratory isolation of MRSA or Pseudomonas, and no hospitalization with parenteral antibiotics in the last ninety days. Absent risk factors are a reason not to broaden, which is a decision the qualified team makes with this recorded in front of them.');
  return prompt('cap-handoff', true,
    'Hand off hypoxemia that is supported and unresolved.',
    'Nothing here establishes an organism, a proven diagnosis, a support device, an antimicrobial, a location of care or an outcome. What travels is the oxygen requirement and how it is being met, the evidence that fits without concluding, the severity features and the judgment they support rather than make, the testing and empiric intent, and the alternatives still open.');
}
