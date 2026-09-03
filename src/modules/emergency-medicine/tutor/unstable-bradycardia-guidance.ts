import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { UnstableBradycardiaProgress } from '../unstable-bradycardia';

export const UNSTABLE_BRADYCARDIA_TUTOR_VERSION = '0.1.0';

export interface UnstableBradycardiaPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is treating the number. Thirty-eight is not an
 * emergency; thirty-eight with a pressure of 78/46, a drowsy patient and cold
 * mottled skin is. And the support bundle the engine gates ahead of the
 * atropine is not ceremony — hypoxia is a cause of bradycardia, so the oxygen
 * may be treating the rhythm rather than accompanying it.
 *
 * It is silent on the unassisted setting, silent once the reassessment is
 * recorded, and silent for any scenario version it was not written against.
 */
export function unstableBradycardiaInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: UnstableBradycardiaProgress },
): UnstableBradycardiaPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.reviewedAtTick === null) return prompt('brady-review', true,
    'The rate is not the finding. What the rate is doing to him is.',
    'Regular sinus bradycardia at 38 with a palpable pulse — and blood pressure 78/46, drowsy, ischaemic chest discomfort, cool mottled extremities, delayed capillary refill, SpO₂ 91% on room air with a patent airway and spontaneous breathing. A rate of 38 in a sleeping endurance athlete is a normal finding; the same number here is an emergency, and the difference is entirely in the second half of that list. That is what "unstable" means and it is the word that decides whether you treat at all. The bradycardia is authored as clinically inappropriate and associated with cardiopulmonary compromise; what is causing it is deliberately not diagnosed, because the treatment for the next two minutes is the same either way.');

  if (patient.supportedAtTick === null) return prompt('brady-support', true,
    'Oxygen, help, monitor, access — and this is not the preamble to the drug.',
    'Confirm the patent airway and spontaneous breathing, then oxygen, help, continuous cardiorespiratory and pulse monitoring, and vascular access. The engine gates the atropine behind this, and the reason is better than "do things in order": hypoxia is itself a cause of bradycardia, and this patient is at 91% on room air. The oxygen may be treating the rhythm rather than merely accompanying it, and a bradycardia that improves with oxygen alone tells you something no dose of atropine could. Notice also what is deliberately not selected — positive-pressure ventilation, because his breathing is adequate, and ventilating an adequately breathing patient here costs preload he cannot spare. Actual oxygen delivery, access and equipment operation are not simulated.');

  if (patient.atropineAtTick === null) return prompt('brady-atropine', true,
    'Now the atropine — one milligram, and know what you are buying with it.',
    'A fixed 1 mg intravenous intent for persistent bradycardia with cardiopulmonary compromise. It is worth being clear that this is a holding measure rather than a cure: atropine blocks vagal tone at the sinus and atrioventricular nodes, so it works when excess vagal tone is the problem and is unreliable when the block is below the node or the myocardium is ischaemic. Which is why the thing you do while giving it is arrange what comes next — pacing and adrenergic infusions exist for the case where this does not hold, and neither is on this screen. Preparation, delivery, repeat dosing, contraindication assessment and any individual response prediction are outside this vignette.');

  return prompt('brady-reassess', true,
    'Let a tick pass, then read the perfusion rather than the rate.',
    'The authored panel comes back at 68 with a pressure of 112/70, SpO₂ 96%, alert, the chest discomfort resolving, warm extremities and better capillary refill. Read that in the same order you read the first one: it is the mentation and the skin that say this worked, and the heart rate is only the mechanism. The reassessment sits one engine tick behind the drug because a rhythm asked about at the instant an intent is recorded reports the clock rather than the patient. And the thing not to take from a good panel is permission to stop: the cause was never diagnosed, atropine is temporary, and reversible-cause evaluation and escalation planning remain necessary. Repeat dosing, pacing, adrenergic infusions, definitive diagnosis, recurrence, disposition and outcome remain outside this lesson.');
}
