import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PediatricAnaphylaxisProgress } from '../pediatric-anaphylaxis';

export const PEDIATRIC_ANAPHYLAXIS_TUTOR_VERSION = '0.1.0';

export interface PediatricAnaphylaxisPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * There is no wrong turn to answer, because this engine case authors none,
 * and unlike most of this module there is no unordered pair either — the
 * engine refuses the broader safety review until repeat first-line ownership
 * is recorded, and that ordering is the argument. The two things this lesson
 * has to hold are a child with no hives and no swelling who is nonetheless in
 * anaphylaxis, and a second dose that must not wait for anybody to finish
 * thinking. It is silent on the unassisted setting, silent once the handoff is
 * recorded, and silent for any scenario version it was not written against.
 */
export function pediatricAnaphylaxisInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PediatricAnaphylaxisProgress },
): PediatricAnaphylaxisPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('pana-trajectory', true,
    'There are no hives. Do not let that be the finding you weigh most.',
    'A six-year-old with mild asthma and no prior anaphylaxis, stung at school at minute zero — species, allergen and causal trigger all unconfirmed. Within minutes: sudden cough and diffuse wheeze, a hoarse one-to-two-word voice, repeated vomiting, pallor, drowsiness and poor perfusion. At minute ten his heart rate is 148, his MAP is 54, his saturation is 91% on supplied oxygen, his skin is pale and cool, his pulses are weak and his refill is four seconds. A qualified responder called for help, kept him lying flat rather than standing or walking, gave oxygen, and documented one appropriate intramuscular epinephrine dose at minute five. Note the position deliberately: standing a child up in this state is its own harm.');
  if (patient.recognitionAtTick === null) return prompt('pana-recognition', true,
    'Sudden onset, more than one system, after a plausible exposure. That is the pattern.',
    'Airway, breathing and circulation are all involved — a hoarse voice, wheeze, vomiting and poor perfusion — after a witnessed sting, and it began within minutes. That is anaphylaxis, and the absent skin findings do not argue against it: no hives and no swelling in a child this sick is a known presentation and one of the reasons the diagnosis gets missed. The other absences narrow without closing. No fever, no infectious prodrome, no abrupt choking, no focal unilateral air-entry loss, no trauma, no seizure, no known food or medicine exposure — and asthma overlap, another trigger and another dangerous cause all stay open. You have scored nothing and confirmed nothing.');
  if (patient.firstLineAtTick === null) return prompt('pana-first-line', true,
    'One dose has not worked. The second one does not wait for anything else.',
    'Five minutes after an appropriate intramuscular dose, his airway, breathing and circulation are all still compromised. That is what a repeat dose is for, and it comes before the broader review rather than after it — this lesson will not let you open the airway and cause work first, because the interval is the treatment. Qualified pediatric, emergency, nursing, pharmacy, airway-capable and critical-care teams take the repeat first-line care and the resuscitation together. The product, the concentration, the dose, the route, the device, the injection, the access, the fluids and the oxygen are all theirs, and none of them was ever yours to verify.');
  if (patient.safetyAtTick === null) return prompt('pana-safety', true,
    'The second dose is owned. Now review what could still be true.',
    'Repeated airway, breathing, circulation, perfusion, neurological, skin and gastrointestinal reassessment, the trigger and alternative-cause work, how he is responding to the medicine, and the boundary at which this becomes refractory and somebody else gets called. His asthma matters here, because wheeze in a child with asthma invites the comfortable explanation and the two can be present together. The current negative findings are snapshots, and none of them has excluded anything.');
  if (patient.laterResponseAtTick === null) return prompt('pana-later', true,
    'Let time pass, then read the improvement carefully.',
    'At minute eighteen there has been no further vomiting since minute eleven, he is alert, he speaks in full short sentences with a clearer voice, and his cough and wheeze are reduced but persistent. Heart rate 122, MAP 72, saturation 97% on continued oxygen, warm with normal pulses and a refill of two seconds. That is a real and welcome change, and it is where this diagnosis is most dangerous: improvement after epinephrine does not prove the treatment caused it, does not confirm anaphylaxis, does not identify the trigger, does not resolve the airway risk or the shock, does not exclude a refractory course, and above all does not exclude a biphasic reaction. He is still on oxygen and still wheezing.');
  return prompt('pana-handoff', true,
    'Hand off a child who got better and is not out of it.',
    'What travels is the reported sting with the trigger unconfirmed, his asthma, the timing of onset and of both epinephrine doses and who gave them, the compromise that persisted through the first, the minute-18 state including the continued oxygen and the persistent wheeze, the biphasic and refractory risk with the observation that follows from it, the trigger and alternative-cause work still open, the allergy follow-up, and the caregiver conversation — including what an adrenaline autoinjector is for and when to use it, which belongs to a prescriber rather than to you. Nothing here confirms anaphylaxis or its trigger, proves a treatment effect, resolves airway risk or shock, excludes a refractory or biphasic course or recurrence, or determines disposition, prognosis or outcome.');
}
