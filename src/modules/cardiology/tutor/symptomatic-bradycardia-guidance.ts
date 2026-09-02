import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { SymptomaticBradycardiaProgress } from '../symptomatic-bradycardia';

export const SYMPTOMATIC_BRADYCARDIA_TUTOR_VERSION = '0.1.0';

export interface SymptomaticBradycardiaPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the number. A rate of 44 invites treatment
 * on its own, and nothing in this lesson is decided by it: the symptoms carry
 * the evaluation and the temporal link carries the referral. The middle pair
 * is unordered, so the tutor names whichever review lane is still open rather
 * than insisting on a sequence the engine does not enforce. It is silent on
 * the unassisted setting, silent once the handoff is recorded, and silent for
 * any scenario version it was not written against.
 */
export function symptomaticBradycardiaInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: SymptomaticBradycardiaProgress },
): SymptomaticBradycardiaPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.stabilityAtTick === null) return prompt('ssb-stability', true,
    'Read the rate through the patient in front of you, not on its own.',
    'A sixty-nine-year-old woman at a return rhythm visit, three weeks of fatigue and exertional lightheadedness, and a fixed report of sinus bradycardia at 44 with a PR of 178 ms, a QRS of 88 ms and no AV block or acute ischemic pattern. Her pressure is 134/72, her saturation 98% on air, and she is alert, warm and has a palpable pulse — no authored hypotension, altered mentation, shock, ischemic discomfort, acute heart failure or syncope. Symptomatic and unstable are different words. Her symptoms are real and are the reason for the visit, and they are chronic rather than acute compromise; that distinction is what makes this an evaluation rather than the emergency bradycardia pathway, and it is a current fact rather than a settled one.');
  if (patient.contextAtTick === null && patient.correlationAtTick === null) return prompt('ssb-review', true,
    'Two review lanes are open, and the engine does not mind which you take first.',
    'One lane is what could be causing or contributing to this: her metoprolol, and whether it is still indicated and being taken as prescribed; thyroid, electrolyte, temperature, hemoglobin, infection, hypoxemia, sleep, ischemic, structural and exercise context. The other is the fixed ambulatory record, where a completed patch and diary already exist. Both must land before a referral, and the order between them is genuinely yours. Take the one you would take with her in the room — and whichever you take, reviewing an indication is not the same as changing a prescription, because nothing here stops her metoprolol.');
  if (patient.contextAtTick === null) return prompt('ssb-context', true,
    'The record is correlated. Now go looking for what is causing it — without stopping her medication.',
    'The reflex a beta blocker invites here is to stop it, and the reason to resist is that nobody has established it is the cause, and it may be treating something she needs treated. Reviewing an indication is not the same as changing a prescription, and neither the review nor this lab adjusts her dose. The same restraint applies to the rest of the list: thyroid, electrolytes, temperature, hemoglobin, infection, hypoxemia, sleep, ischemia, structure and conditioning are all reviewed, and none of them is declared the answer. A cause that is reviewed and left open is a better record than one that was chosen because a review needed to conclude.');
  if (patient.correlationAtTick === null) return prompt('ssb-correlation', true,
    'The context is reviewed. Now ask whether her episodes and the slow rate happen at the same time.',
    'The completed patch and diary are already in the record: her typical exertional lightheadedness repeatedly aligns with sinus rates of 38 to 44, and there is no high-grade AV block, long pause, atrial fibrillation or ventricular arrhythmia reported. That alignment is what the evaluation rests on, and it is worth being precise about how little else it establishes. It does not make one heart rate or one pause length diagnostic, and it does not prove sinus-node dysfunction — the teaching waveform illustrates the rhythm and does not diagnose the node. A symptom that coincides with a slow rate is a reason to evaluate, not a mechanism.');
  if (patient.pacingEvaluationAtTick === null) return prompt('ssb-pacing', true,
    'Refer for a shared conversation, and notice everything the referral does not decide.',
    'Both lanes are complete, so an individualized cardiology and electrophysiology pacing evaluation is the right next step — as intent, and as a conversation. What belongs in it is her symptom burden, her goals, her preferences, the alternatives, what she is hoping to get back, and the tradeoffs of a procedure and a device she would carry for the rest of her life. What does not belong in it is a conclusion: no eligibility finding, no device, no mode, no lead, no date, no guaranteed benefit and no mortality claim. Pacing here is a shared decision about a person with symptoms, and not something a rate of 44 earns on its own.');
  return prompt('ssb-handoff', true,
    'Close it with a name, a follow-up, and the changes that would not wait.',
    'Her rhythm at the end of this visit is the rhythm she arrived with, and the plan is what changed. Record how her symptoms will be tracked and when she is seen again — locally determined, because this lab sets no interval — and record who owns it, so the referral is somebody\'s rather than everybody\'s. The safety net is the part worth being concrete about: syncope, hypotension, confusion, shock, ischemic discomfort, dyspnea or acute heart failure, worsening hypoxemia, poor perfusion or a lost pulse are the changes that stop being an outpatient question. What stays open should stay written: the cause, the medication, her preferences, and the device questions nobody has answered. Nothing here diagnoses, changes a medication, gives atropine or oxygen, starts an infusion, paces, decides eligibility, selects or implants or programs a device, sets a disposition, or predicts recurrence or outcome.');
}
