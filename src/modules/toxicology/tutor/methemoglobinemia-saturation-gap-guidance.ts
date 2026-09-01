import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MethemoglobinemiaProgress } from '../methemoglobinemia-saturation-gap';

export const METHEMOGLOBINEMIA_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a bedside where every number is honest and none
 * of them is about the patient.
 *
 * The saturation gap is not a disagreement to be settled. The pulse oximeter is
 * reporting what it can measure, the blood gas is reporting what it can
 * measure, and the calculated saturation is arithmetic on the second of those.
 * All three are right about themselves and none is right about how much oxygen
 * she is carrying. The prompts keep the gap as the finding rather than picking
 * a winner, and they hold the antidote's two named hazards next to it, because
 * the shortcut this bedside invites is to reach for methylene blue the moment
 * the blood looks brown. None of them names a product, a dose, a route, or an
 * eligibility result, and none reads the later pulse oximetry as proof.
 */
export function methemoglobinemiaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly methemoglobinemia?: MethemoglobinemiaProgress;
}) {
  const patient = input.methemoglobinemia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('methemoglobinemia-trajectory', true,
    'Put both oxygen numbers in one sentence with the woman they came from.',
    'An SpO2 of 85% and a PaO2 of 238 mmHg are not arguing. The oximeter is reporting what it can measure, the gas is reporting dissolved oxygen in plasma, and the 99% beside it is arithmetic on the gas. All three are right about themselves. None of them is a measurement of what her hemoglobin is carrying, and she is dusky, breathless and confused half an hour after a documented oxidant exposure.');
  if (patient.recognitionAtTick === null) return prompt('methemoglobinemia-recognize', true,
    'Record this as a suspected dyshemoglobin pattern, and act on it as one.',
    'Cyanosis that high-concentration oxygen has not fixed, chocolate-brown blood, a wide gap between the two saturations, and a named oxidant support urgent suspicion. No single number makes the diagnosis — pulmonary, circulatory, hemolytic, inherited, medication and other causes all stay open, and the gap is the finding rather than the answer.');
  if (patient.supportAtTick === null) return prompt('methemoglobinemia-support', true,
    'Keep what is running, stop what caused it, and name who owns her.',
    'The oxygen and the monitoring continue even though the oximeter will not reward them, because the number is unreliable here rather than the treatment. Stopping the oxidant is the part that is easy to leave until later, and the poison center or medical toxicology service and critical care both need to be called rather than assumed.');
  if (patient.hazardsAtTick === null) return prompt('methemoglobinemia-hazards', true,
    'Read the co-oximetry and the antidote’s two contraindication hazards in the same breath.',
    'Co-oximetry measures the dyshemoglobin directly and reports 32%, which the pulse oximeter cannot tell you. In the same look: G6PD deficiency carries a risk of severe hemolysis, and serotonergic medicines carry a serotonin-toxicity risk. Neither is a reason to do nothing, and both belong to the team choosing the treatment — this lesson selects no product, dose, route or eligibility result.');
  if (patient.reassessmentAtTick === null) return prompt('methemoglobinemia-observe', false,
    'Record the intent as intent, let the authored interval pass, and read the report.',
    'The interval is a contrast rather than a required wait or a predicted response time. Nothing here says how fast a real methemoglobin level falls, or in whom.');
  return prompt('methemoglobinemia-handoff', true,
    'Hand off a number that fell and a risk that did not.',
    'Methemoglobin 8%, clearer mentation, heart rate 98. One authored patient improving after a treatment is not evidence the treatment is why, and the pulse oximeter is still not the instrument that would tell you. The oxidant can keep generating methemoglobin after the antidote has cleared, so rebound, hemolysis, serotonin toxicity, repeat co-oximetry and the rescue alternatives all travel with her.');
}
