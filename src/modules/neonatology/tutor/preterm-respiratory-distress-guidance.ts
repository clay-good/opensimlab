import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PretermRespiratoryDistressProgress } from '../preterm-respiratory-distress';

export const PRETERM_RESPIRATORY_DISTRESS_TUTOR_VERSION = '0.1.1';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a support decision made by what he is doing.
 *
 * For a spontaneously breathing preterm infant who needs respiratory support,
 * qualified initial CPAP is reasonable rather than routine intubation. What
 * puts this newborn on that branch is the spontaneous breathing, not the
 * gestation, and naming which finding decides is what stops the branch being a
 * reflex. The prompts are equally careful with the number: 30% to 100% is a
 * reasonable initial range under 32 weeks, and the 30% here is one qualified
 * team's choice inside it rather than a figure to carry to the next bedside.
 * At ten minutes the grunting and retractions persist and nothing has been
 * excluded. None of these prompts operates a device, selects a setting, or
 * delivers care, because that is the qualified team's work.
 */
export function pretermRespiratoryDistressInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly pretermRespiratoryDistress?: PretermRespiratoryDistressProgress;
}) {
  const patient = input.pretermRespiratoryDistress;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.1' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('preterm-respiratory-support', true,
    'Confirm the CPAP-capable team and the thermal plan as one requirement.',
    'A trained preterm team, CPAP-capable and airway-ready support, the shared clock, a thermal plan, transport ownership, communication, dignity and a parent who has asked a direct question. At 1.25 kg the warmth is not a comfort measure running alongside the respiratory care; it is part of it.');
  if (patient.contextAtTick === null) return prompt('preterm-respiratory-context', true,
    'Separate what he is doing from what he is.',
    'Twenty-nine weeks and four days, 1.25 kg, cesarean birth for severe preeclampsia, ninety seconds elapsed — and spontaneous breathing, grunting, intercostal and subcostal retractions, heart rate 154, respiratory rate 68, preductal saturation 62%, 36.5°C under wrap and hat. No apnea, no gasping, no obstruction. The gestation describes him; the breathing decides this.');
  if (patient.recognitionAtTick === null) return prompt('preterm-respiratory-recognize', true,
    'Choose the branch on the breathing, and say so.',
    'For a spontaneously breathing preterm infant who needs respiratory support, qualified initial CPAP is reasonable rather than routine intubation. The finding that puts him there is that he is breathing for himself with distress, not that he is 29 weeks. A saturation of 62% at ninety seconds is expected in transition and is not read alone.');
  if (patient.readinessAtTick === null) return prompt('preterm-respiratory-readiness', true,
    'Take the range, not the number, and know what leaves this branch.',
    'Preductal oximetry guides the oxygen, and 30% to 100% is a reasonable initial range under 32 weeks; the 30% start here is one qualified team’s choice inside that range rather than a prescription to carry elsewhere. Wrap, hat and temperature surveillance address hypothermia while avoiding hyperthermia. Apnea, gasping, a heart rate under 100 or ineffective breathing belongs to the positive-pressure branch, which is a different lesson than this one.');
  if (patient.reassessmentAtTick === null) return prompt('preterm-respiratory-observe', false,
    'Let the authored interval pass, then read the qualified team’s report.',
    'Ten minutes is a contrast rather than a required wait or a promised response time. Nothing here says how quickly a real preterm chest answers CPAP.');
  return prompt('preterm-respiratory-handoff', true,
    'Hand off a working support and an undiagnosed newborn.',
    'Saturation 90% on 35%, heart rate 148, rate 62, 36.6°C, no observed apnea — and still grunting, still retracting. The support is working and the disease is unnamed: respiratory distress syndrome, infection, air leak and congenital disease are all still open, adequate ventilation is unproven, and the next team needs each of them stated.');
}
