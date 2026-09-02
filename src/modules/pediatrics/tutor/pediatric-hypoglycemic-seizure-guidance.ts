import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PediatricHypoglycemicSeizureProgress } from '../pediatric-hypoglycemic-seizure';

export const PEDIATRIC_HYPOGLYCEMIC_SEIZURE_TUTOR_VERSION = '0.1.0';

export interface PediatricHypoglycemicSeizurePrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * There is no wrong turn to answer, because this engine case authors none.
 * The trap is a single number: a glucose of 34 becomes 86, the child wakes up,
 * and the room relaxes. A corrected glucose is a treated symptom, not an
 * explained seizure — nobody knows yet why a previously well five-year-old ran
 * out of sugar. Rescue and the cause review are unordered, so there is a beat
 * for each of the three ways that pair can be half done. It is silent on the
 * unassisted setting, silent once the handoff is recorded, and silent for any
 * scenario version it was not written against.
 */
export function pediatricHypoglycemicSeizureInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PediatricHypoglycemicSeizureProgress },
): PediatricHypoglycemicSeizurePrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('phs-trajectory', true,
    'The convulsion has stopped. Read what it left behind.',
    'A previously well five-year-old, 18 kg, had a witnessed generalized convulsion of about ninety seconds that ended before this surface opened. He is drowsy, localizes and opens his eyes to voice, and he is not safe to swallow — that last part is a fact about the route, and it is the reason the rescue is not a cup of juice. He has a pulse, he is breathing spontaneously, his saturation is 99% on air, his refill is two seconds and his heart rate is 132. The supplied qualified glucose is 34. You did not examine him, take that sample or interpret it.');
  if (patient.recognitionAtTick === null) return prompt('phs-recognition', true,
    'Name it as time-critical, and keep the cause open while you do.',
    'A stopped seizure plus a glucose of 34 is a pediatric hypoglycemic emergency, and the supplied association is what justifies immediate qualified rescue rather than further investigation first. Two things stay true at the same time here. The rescue cannot wait for a cause. And the association is not the cause: no fever, no meningism, no trauma, no focal deficit, no known diabetes and no reported insulin or glucose-lowering exposure is authored — all fixed snapshots — while illness, ingestion or exposure, fasting, and metabolic, endocrine and hepatic causes stay wide open. A previously well five-year-old does not usually run out of sugar for no reason.');
  if (patient.rescueAtTick === null && patient.safetyAtTick === null) return prompt('phs-parallel', true,
    'Two things start now: the sugar, and the question of why.',
    'Begin with rescue ownership. Experienced pediatric, nursing, pharmacy, airway-capable and escalation teams take immediate seizure safety, locally protocolized glucose correction, cardiorespiratory surveillance, repeated glucose review, access and airway contingencies, and frequent neurological reassessment. He is not safe to swallow, so the route is theirs to choose along with the formulation, the concentration, the dose, the volume, the rate and the access — you select none of it. What you record is that the people who can do it own it, now.');
  if (patient.rescueAtTick === null) return prompt('phs-rescue', true,
    'The cause review is running. His glucose is still 34.',
    'Opening the cause and recurrence work was right, and it raises nobody\'s blood sugar. Activating rescue ownership means experienced pediatric, nursing, pharmacy, airway-capable and escalation teams own the immediate seizure safety, the locally protocolized glucose correction, the cardiorespiratory surveillance, the repeated glucose review, the access and airway contingencies, and the frequent neurological reassessment. A child who is not safe to swallow needs that decided by them and started now, not after the cause is clearer.');
  if (patient.safetyAtTick === null) return prompt('phs-safety', true,
    'Rescue is owned. Now ask why a well child ran out of sugar.',
    'This is the half that gets skipped once the number comes up. Experienced teams keep serial consciousness, seizure activity, airway, breathing, circulation, temperature, glucose, intake, medication and exposure history, endocrine, metabolic, hepatic, infectious and injury review, safeguarding, recurrence and escalation. Two of those are worth saying out loud: an accidental or non-accidental ingestion is on the list for a previously well child, and so is safeguarding — asked as part of the work rather than as an accusation. The fixed negatives you were handed are snapshots, and none of them closes the question.');
  if (patient.laterResponseAtTick === null) return prompt('phs-later', true,
    'Let time pass, then check the child rather than the meter.',
    'The fixed later report has him awake, following commands, using age-appropriate speech, still tired, with no recurrent convulsion, a heart rate of 106, a MAP of 76, a saturation of 99% and a glucose of 86. That is exactly the moment the room relaxes, and it is worth being precise about what those numbers earned. They do not prove the treatment caused the change, they do not establish the cause of the seizure, they do not make the euglycemia durable, they do not prove neurological recovery, and they do not exclude recurrence. He is better. Nothing is explained.');
  return prompt('phs-handoff', true,
    'Hand off a child who woke up with the question still open.',
    'What travels is the witnessed convulsion and its duration, the postictal state and the swallow safety that shaped the route, the glucose of 34 and the later 86 with the interval between them, who owns the rescue and what was given by them, the neurological and glucose reassessments and when the next ones are due, the causes still open — illness, ingestion or exposure, fasting, endocrine, metabolic, hepatic — the safeguarding review as part of that work, the recurrence triggers, and the caregiver context. Nothing here claims a treatment effect, a proven cause, durable euglycemia, neurological recovery, freedom from recurrence, disposition, prognosis or outcome.');
}
