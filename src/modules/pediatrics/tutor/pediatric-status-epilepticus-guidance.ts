import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PediatricStatusEpilepticusProgress } from '../pediatric-status-epilepticus';

export const PEDIATRIC_STATUS_EPILEPTICUS_TUTOR_VERSION = '0.1.0';

export interface PediatricStatusEpilepticusPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * There is no wrong turn to answer, because this engine case authors none.
 * The lesson turns on two clocks. The first is running: fourteen and a half
 * minutes of convulsion and two documented first-line doses already given, so
 * the next drug is a different drug rather than a third benzodiazepine. The
 * second is the one at the end, where the movements stop and a still child
 * gets read as a controlled seizure. Second-line ownership and the safety
 * review are unordered, so there is a beat for each of the three ways that
 * pair can be half done. It is silent on the unassisted setting, silent once
 * the handoff is recorded, and silent for any scenario version it was not
 * written against.
 */
export function pediatricStatusEpilepticusInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PediatricStatusEpilepticusProgress },
): PediatricStatusEpilepticusPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('pse-trajectory', true,
    'Start with the clock, because the clock is what decides the next drug.',
    'A previously well six-year-old, 20 kg, is fourteen and a half minutes into a first witnessed bilateral generalized convulsion with no recovery between movements. The experienced-team record verifies two documented appropriate weight-based first-line benzodiazepine doses, at seizure minutes five and ten. Product, dose, concentration, route and delivery are deliberately not shown and were not yours to select or verify. The supplied findings: heart rate 146, MAP 81, saturation 94% on air, refill two seconds, and a point-of-care glucose of 108 — which matters because a treatable cause has already been looked for and is not the answer here. Note what you cannot have: the respiratory rate is not reliably countable during the movements and there is no capnography.');
  if (patient.recognitionAtTick === null) return prompt('pse-recognition', true,
    'Two adequate doses have failed. Say that, because it changes the drug class.',
    'Persistent convulsive status after two documented appropriate first-line doses is the pattern, and naming it is what stops the most common error in this room: reaching for a third benzodiazepine. More of the same is not the next step — the next step is a second-line agent, chosen and given by the qualified team. The absences you were handed narrow without closing: no fever, no nonblanching rash, no reported trauma, no known ingestion, no known epilepsy, no known diabetes, and yet witness limits, infection, structural, toxic, metabolic and medication causes stay open. You have diagnosed nothing and timed nothing.');
  if (patient.secondLineAtTick === null && patient.safetyAtTick === null) return prompt('pse-parallel', true,
    'The second-line drug and the airway do not queue behind each other.',
    'Start by activating second-line ownership. Qualified pediatric, neurology, nursing, pharmacy, airway-capable, critical-care, laboratory, imaging and safeguarding teams are available now, and the agent, the dose, the concentration, the route, the access and the infusion are all theirs. The reason this is urgent rather than merely correct is that time in convulsive status is the variable nobody gets back. What you record is that somebody owns the next drug, immediately, and without waiting for the airway and cause work to finish first.');
  if (patient.secondLineAtTick === null) return prompt('pse-second-line', true,
    'The airway and the causes are being watched. She is still convulsing.',
    'Opening that review was right and it does not stop a seizure. Activating second-line ownership means the qualified team owns the next agent and everything about how it is given — none of which you select or verify. A third benzodiazepine is not what comes next, and every minute this stays unowned is a minute of continuing convulsive status. Record the ownership now; the review you have already started keeps running alongside it rather than being replaced by it.');
  if (patient.safetyAtTick === null) return prompt('pse-safety', true,
    'The drug is owned. Now hold the airway, the causes, and the refractory line.',
    'Three things run together here. Her airway and breathing, because you cannot count a respiratory rate through the movements and there is no capnography, and because the second-line agent itself can depress her breathing — experienced airway and oxygen support is immediately available and that is not incidental. The causes, which the authored absences narrow without excluding. And the refractory boundary: what would count as failure of this agent, and who gets called when it does. Deciding that in advance is the difference between escalating and noticing late.');
  if (patient.laterResponseAtTick === null) return prompt('pse-later', true,
    'Let time pass, then be careful about what stillness means.',
    'The fixed minute-25 report: no visible convulsions since minute eighteen. She is drowsy, opens her eyes to voice, localizes and moves symmetrically, is not at baseline, and is not safe to swallow. Heart rate 116, respiratory rate 22, saturation 98%. The movements stopping is the thing everyone in the room wanted, and it is also the most over-read finding in this lesson. It does not prove the treatment caused it, does not establish electrographic seizure control, does not make control durable, does not prove neurological recovery, does not identify the cause, and does not exclude recurrence. A child who has stopped moving and is not back to herself is a child who still needs watching, not a child who is finished.');
  return prompt('pse-handoff', true,
    'Hand off a seizure that has stopped being visible.',
    'What travels is the seizure clock from onset, the two documented first-line doses and their times, that they failed, who owns the second-line agent and when it was given, the airway and breathing risk including that her rate could not be counted during the movements and that the agent can depress it, the minute-25 state described as not at baseline and not safe to swallow, the explicit gap between no visible convulsion and no seizure, the refractory triggers and who gets called, the causes still open, and the caregiver context. Nothing here claims a cause, a treatment effect, electrographic or durable control, neurological recovery, freedom from recurrence, disposition, prognosis or outcome.');
}
