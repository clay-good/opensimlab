import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { IcuHandoffProgress } from '../icu-handoff';

export const ICU_HANDOFF_TUTOR_VERSION = '0.1.0';

export interface IcuHandoffPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is inheriting the headline. Someone who has been
 * at this bedside for twelve hours says "stable septic shock on low-dose
 * support", and that sentence is the most efficient thing in the handover and
 * the most dangerous — it arrives as a conclusion, and conclusions are the part
 * of a handover nobody re-derives. The second reflex is politeness: the numbers
 * contradict a colleague, and saying so out loud is the work.
 *
 * It is silent on the unassisted setting, silent once the handoff is accepted,
 * and silent for any scenario version it was not written against.
 */
export function icuHandoffInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: IcuHandoffProgress },
): IcuHandoffPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.acceptanceAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.readinessAtTick === null) return prompt('ich-readiness', true,
    'Before a word is said: are you actually able to receive this?',
    'Who is receiving, whether you both have attention on the same patient, that the monitoring does not go unwatched while you talk, that you can ask questions, and that the bedside stays covered. This is the least interesting step in the lesson and it is first for a reason: a handover given to someone half-listening in a corridor is where the sentence you are about to be told stops being examined. None of the things that actually degrade handovers — staffing, workload, interruptions, how well two people communicate — are measured here, and pretending otherwise would be the wrong lesson.');
  if (patient.contentAtTick === null) return prompt('ich-content', true,
    'Take the whole handover — and take it as a claim, not as the truth.',
    'The headline is "stable septic shock on low-dose support". Also arriving: the patient summary, the active support, the dated data, the task list, the pending cholangitis source control, and the contingencies. Receive all of it, including the parts that will turn out to be wrong, because you cannot cross-check what you did not hear. The framing is the whole step: every item is a claim requiring bedside verification rather than ground truth. That is not distrust of the person handing over — they have been awake for twelve hours watching a number move slowly, which is precisely the situation in which a trend is invisible from the inside.');
  if (patient.crossCheckAtTick === null) return prompt('ich-crosscheck', true,
    'Now put the sentence next to the numbers. They disagree.',
    'Ninety minutes: heart rate 94 to 118, MAP 70 to 64 while the noradrenaline went from 0.08 to 0.22, refill 2 to 5 seconds, lactate 3.1 to 5.8, urine 30 to 5 mL an hour, EtCO2 35 to 30 on unchanged ventilation. Read the second one carefully — a pressure that fell while the support nearly tripled is worse than a pressure that fell, because the number was held up. "Low-dose" was true when someone last said it. And the EtCO2 falling on unchanged ventilation is cardiac output leaving, not a lung problem. Then check the rest: the patient, the monitor, the airway and circuit, the access, the infusion path, the pumps, the concentrations and rates, compatibility, the medications, the labs, the urine, the orders and the documentation — because a vasopressor that is not arriving looks exactly like a vasopressor that is not working. Alternate causes stay open.');
  if (patient.escalationAtTick === null) return prompt('ich-escalate', true,
    'Say the corrected version out loud, to people, with names on the tasks.',
    'This is worsening shock with source control still pending, and the escalation is the point at which the cross-check becomes other people\'s knowledge rather than yours. Critical care, nursing, pharmacy, respiratory therapy and urgent source control. Then the parts that make an escalation more than an announcement: the immediate priorities across airway, breathing, perfusion, the infusion path, labs, antimicrobials and the source; the triggers that say this is failing; the contingencies for each; and a named owner for every task. Unowned tasks at shift change are the ones that do not happen. None of this is performed here — no assessment, no communication, no treatment, no source control.');
  return prompt('ich-accept', true,
    'Accept it deliberately, and know what the fifteen minutes did and did not prove.',
    'Synthesis first — worsening shock, active support, pending source control, the immediate tasks, the triggers, the contingencies, the owners, the escalation route — and then the acknowledgement of responsibility, in that order, because accepting a patient you have not summarised is how a handover becomes a formality. The bridge response at fifteen minutes: heart rate 108, MAP 70, EtCO2 33, saturation 96% on an unchanged 0.35, temperature 38.9. Better, and specifically not evidence about the thing that is wrong with her: the lactate, the urine, the source control, whether any of this holds, and how she does are all still open. Nothing here assesses, communicates, treats, controls a source, diagnoses, determines disposition, or predicts outcome.');
}
