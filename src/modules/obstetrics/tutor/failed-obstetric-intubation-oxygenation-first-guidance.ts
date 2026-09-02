import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { FailedIntubationProgress } from '../failed-obstetric-intubation-oxygenation-first';

export const FAILED_INTUBATION_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for an airway that is working and not secured.
 *
 * Two attempts have failed and a supraglottic device is ventilating her with
 * sustained capnography, so the crisis is stable rather than over. The error
 * this lesson refuses is treating adequate oxygenation as permission to stop
 * thinking: the tube is not the goal, oxygen is, and a working rescue device
 * still leaves displacement, aspiration, awareness and progression to
 * can't-intubate-can't-oxygenate on the table. She is anesthetized and the
 * fetal baseline is 70, so the wake-or-proceed decision is being made for her
 * by people she cannot answer. None of these prompts examines her, manages an
 * airway, selects or manipulates a device, or makes the wake-or-proceed
 * decision.
 */
export function failedIntubationInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly failedIntubation?: FailedIntubationProgress;
}) {
  const patient = input.failedIntubation;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('intubation-support', true,
    'Say “failed intubation” out loud before you take stock of anything.',
    'Declaring it is what stops a third attempt, and repeated attempts are how a manageable airway becomes an unmanageable one. The declaration also changes what everyone else is doing: anesthesia, obstetrics, theatre, the newborn team, communication and support ownership all reorganize around an airway that is not secured. Naming the failure is an action rather than an admission.');
  if (patient.contextAtTick === null) return prompt('intubation-context', true,
    'Read the airway as working, and the situation as still open.',
    'Two failed attempts, experienced help present, and a second-generation supraglottic device ventilating her with sustained waveform capnography, bilateral air entry, a saturation recovered from a nadir of 93% to 97%. That is adequate oxygenation, which is what matters — the tube was never the goal. Beside it: a category-1 caesarean that has not happened, a fetal baseline of 70, and a patient who is anesthetized and cannot take part in any of this.');
  if (patient.safetyAtTick === null) return prompt('intubation-safety', true,
    'Let the oxygenation reassure you without letting it close anything.',
    'A working device is a rescue rather than a solution. Displacement, aspiration against an unprotected airway, awareness under an anesthetic nobody can titrate to her responses, deterioration in oxygenation, and progression to can’t-intubate-can’t-oxygenate all remain live while the saturation reads 97%. The attempt limit exists because attempts cause the harm, and front-of-neck access is a plan that belongs to the qualified team rather than a last resort nobody has thought about yet.');
  if (patient.decisionAtTick === null) return prompt('intubation-decision', true,
    'Hold wake-or-proceed as an individual judgment rather than a rule.',
    'There is no answer that is correct for every case: it turns on maternal factors, the fetal urgency at a baseline of 70, the surgical indication, aspiration and device risk, the experience of the people in the room, and what the airway is likely to do next. Whichever way it goes, the readiness runs in parallel — the birth, the newborn team, the airway plan, and the support she will need afterwards. This lesson does not make the decision, and neither does any protocol.');
  if (patient.reassessmentAtTick === null) return prompt('intubation-reassess', false,
    'Read the fixed 3-minute report as this course rather than the right course.',
    'It describes what a qualified team did here. It is a contrast rather than a recommendation, and it says nothing about what any other failed intubation should do.');
  return prompt('intubation-handoff', true,
    'Hand off an airway that is working and not safe.',
    'Nothing here establishes airway safety, excluded aspiration, excluded awareness, fetal recovery or a treatment effect. The device and its displacement risk, the aspiration question, the awareness question that she cannot answer and will have to be asked about afterwards, the birth, the newborn, the debrief she is owed, and the disposition all travel with her.');
}
