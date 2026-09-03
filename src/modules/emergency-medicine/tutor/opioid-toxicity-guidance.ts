import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { OpioidToxicityProgress } from '../opioid-toxicity';

export const OPIOID_TOXICITY_TUTOR_VERSION = '0.1.0';

export interface OpioidToxicityPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the antidote. Naloxone is the thing everyone
 * knows about this diagnosis, and it is neither the first treatment nor the
 * durable one: the patient is dying of not breathing, which a bag fixes in
 * seconds, and the drug that caused it outlasts the drug that reverses it.
 * The engine gates the antagonist behind ventilation, and then authors a
 * twenty-five-minute panel that gets worse.
 *
 * It is silent on the unassisted setting, silent once the safety plan is
 * recorded, and silent for any scenario version it was not written against.
 */
export function opioidToxicityInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: OpioidToxicityProgress },
): OpioidToxicityPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.recurrencePlanAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.patternReviewedAtTick === null) return prompt('opi-pattern', true,
    'Confirm there is a pulse, then read what is actually killing him.',
    'Unresponsive, definite pulse at 58, respirations four a minute, SpO₂ 78%, end-tidal carbon dioxide 68, pinpoint pupils, glucose 102, reported fentanyl. The pulse is the first thing because it decides which algorithm you are in, and the rest describes one problem: he is not ventilating. The end-tidal of 68 is the number that says so most plainly — the saturation tells you about oxygen, which supplemental oxygen can paper over, while the carbon dioxide tells you about breathing, which nothing but ventilation fixes. The glucose is checked for the same reason it always is, and co-exposure stays possible; a triad is a pattern rather than a proof. This screen does not examine, confirm a pulse, or acquire real data.');

  if (patient.ventilationAtTick === null) return prompt('opi-ventilation', true,
    'Ventilate him now. This is the treatment; the antidote is the follow-up.',
    'Call for help, open the airway, oxygen, effective bag-mask ventilation, monitoring, access, and the glucose you already have. The engine will refuse the naloxone until this is recorded, and that refusal is the lesson: at four breaths a minute he has a couple of minutes of margin, and the interval between drawing up an antagonist and its taking effect is spent not breathing unless someone is squeezing a bag. Nothing about naloxone is faster than a bag-mask, and a hypoxic arrest that happens while the syringe is being prepared is a preventable one. Airway manoeuvres, ventilation quality, oxygen delivery, access, testing and team performance are not simulated.');

  if (patient.antagonistAtTick === null) return prompt('opi-naloxone', true,
    'Now the naloxone — aimed at his breathing, not at waking him up.',
    'A local-protocol intent, given while ventilation continues rather than instead of it, and titrated toward normal spontaneous breathing and protective airway reflexes. Full arousal is not the target and chasing it is how this goes wrong: too much, too fast, in someone dependent, buys vomiting, agitation and a patient who leaves before the opioid has worn off — which in this drug is the dangerous half of the encounter. A drowsy patient breathing at fourteen with a protected airway is a success. Product, route, dose, access, delivery, the pharmacology, withdrawal and individual response are not simulated.');

  if (patient.initialReassessmentAtTick === null) return prompt('opi-initial', true,
    'Read the response, and notice which number you are allowed to be pleased about.',
    'Respirations fourteen, SpO₂ 97% on oxygen, end-tidal carbon dioxide down to 43, pulse 72, responds to voice and still drowsy. That is the result you wanted: ventilation adequacy rather than wakefulness, which is why the persistent drowsiness is not a failure of the dose. No severe withdrawal is authored, which is worth noticing as the other way this could have gone. This panel is authored rather than modelled and is not a prediction about any individual.');

  if (patient.recurrenceReviewedAtTick === null) return prompt('opi-recurrence', true,
    'Twenty-five minutes on, look again — and expect the direction to have reversed.',
    'Respirations down to seven, SpO₂ 90% even on oxygen, end-tidal carbon dioxide climbing back to 58, drowsiness deeper, pulse still there at 64. This is the point of the lesson. Naloxone has a short duration of action and many opioids, fentanyl and its analogues especially, do not — so the antagonist wears off while the agonist is still bound, and the patient sinks back down. The person most at risk from this is the one who woke up well, felt fine, and was allowed to walk out of a waiting room forty minutes after a dose. Recurrent depression here is authored precisely to teach that.');

  return prompt('opi-plan', true,
    'Treat it again, and then treat the thing that will happen after you stop watching.',
    'Renewed airway and ventilation support, a repeat naloxone intent, and contingencies for a longer-acting antagonist strategy and higher-acuity care if this keeps happening — plus evaluation for co-exposure and complications, because a second dip is also the moment to ask what else is on board. Then observation until recurrence risk is low with normal consciousness and normal vital signs, which is a clinical endpoint rather than a fixed number of hours. And the part that outlives the visit: take-home naloxone with instructions on using it, and a link to treatment. The overdose you prevent with those is the one nobody in this department will ever see. Delivery, later response, observation duration, counselling, dispensing, disposition and outcome are outside this lesson.');
}
