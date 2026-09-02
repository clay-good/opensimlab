import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsSymptomaticBradycardia, type SymptomaticBradycardiaAction,
  type SymptomaticBradycardiaProgress,
} from '../symptomatic-bradycardia';

export const SYMPTOMATIC_BRADYCARDIA_DEMONSTRATION_VERSION = '0.1.0';

export function supportsSymptomaticBradycardiaDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsSymptomaticBradycardia(scenario);
}

export interface SymptomaticBradycardiaDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: SymptomaticBradycardiaAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a slow rhythm that is not treated because it is slow.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Where the middle pair is unordered the example takes context
 * first — a choice, not a rule, and the engine accepts the other order just as
 * readily. It examines nobody, acquires and interprets no ECG or monitor,
 * makes no diagnosis, changes no medication, gives no atropine, oxygen or
 * infusion, paces nothing, reaches no eligibility conclusion, selects or
 * implants or programs no device, performs no procedure, determines no
 * disposition, and predicts no recurrence or outcome.
 */
export function symptomaticBradycardiaDemonstrationStep(
  patient?: SymptomaticBradycardiaProgress,
): SymptomaticBradycardiaDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She leaves in the rhythm she arrived in, still on the medication she arrived on, with no cause established and no device decided. What changed is that her symptoms are now attached to a rhythm, a referral, an owner and a safety net. The rate of 44 never decided anything. This ends the example, not the evaluation.' };
  }
  if (patient.stabilityAtTick === null) {
    return { id: 'stability', focus: 'monitor', progress: 0.12, action: 'reconcile-symptomatic-bradycardia-stability',
      narration: 'Read the rate through the patient in front of you, not on its own. A sixty-nine-year-old woman at a return rhythm visit, three weeks of fatigue and exertional lightheadedness, and a fixed report of sinus bradycardia at 44 with a PR of 178 ms, a QRS of 88 ms and no AV block or acute ischemic pattern. Her pressure is 134/72, her saturation 98% on air, and she is alert, warm and has a palpable pulse — no authored hypotension, altered mentation, shock, ischemic discomfort, acute heart failure or syncope. Symptomatic and unstable are different words. Her symptoms are real and are the reason for the visit, and they are chronic rather than acute compromise; that distinction is what makes this an evaluation rather than the emergency bradycardia pathway, and it is a current fact rather than a settled one.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'review', focus: 'monitor', progress: 0.3, action: 'review-symptomatic-bradycardia-context',
      narration: 'Two review lanes are open, and the engine does not mind which you take first. One lane is what could be causing or contributing to this: her metoprolol, and whether it is still indicated and being taken as prescribed; thyroid, electrolyte, temperature, hemoglobin, infection, hypoxemia, sleep, ischemic, structural and exercise context. The other is the fixed ambulatory record, where a completed patch and diary already exist. Both must land before a referral, and the order between them is genuinely yours. Take the one you would take with her in the room — and whichever you take, reviewing an indication is not the same as changing a prescription, because nothing here stops her metoprolol.' };
  }
  if (patient.correlationAtTick === null) {
    return { id: 'correlation', focus: 'monitor', progress: 0.5, action: 'correlate-symptomatic-bradycardia-record',
      narration: 'The context is reviewed. Now ask whether her episodes and the slow rate happen at the same time. The completed patch and diary are already in the record: her typical exertional lightheadedness repeatedly aligns with sinus rates of 38 to 44, and there is no high-grade AV block, long pause, atrial fibrillation or ventricular arrhythmia reported. That alignment is what the evaluation rests on, and it is worth being precise about how little else it establishes. It does not make one heart rate or one pause length diagnostic, and it does not prove sinus-node dysfunction — the teaching waveform illustrates the rhythm and does not diagnose the node. A symptom that coincides with a slow rate is a reason to evaluate, not a mechanism.' };
  }
  if (patient.pacingEvaluationAtTick === null) {
    return { id: 'pacing', focus: 'actions', progress: 0.72, action: 'record-symptomatic-bradycardia-pacing-evaluation',
      narration: 'Refer for a shared conversation, and notice everything the referral does not decide. Both lanes are complete, so an individualized cardiology and electrophysiology pacing evaluation is the right next step — as intent, and as a conversation. What belongs in it is her symptom burden, her goals, her preferences, the alternatives, what she is hoping to get back, and the tradeoffs of a procedure and a device she would carry for the rest of her life. What does not belong in it is a conclusion: no eligibility finding, no device, no mode, no lead, no date, no guaranteed benefit and no mortality claim. Pacing here is a shared decision about a person with symptoms, and not something a rate of 44 earns on its own.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-symptomatic-bradycardia-plan',
    narration: 'Close it with a name, a follow-up, and the changes that would not wait. Her rhythm at the end of this visit is the rhythm she arrived with, and the plan is what changed. Record how her symptoms will be tracked and when she is seen again — locally determined, because this lab sets no interval — and record who owns it, so the referral is somebody\'s rather than everybody\'s. The safety net is the part worth being concrete about: syncope, hypotension, confusion, shock, ischemic discomfort, dyspnea or acute heart failure, worsening hypoxemia, poor perfusion or a lost pulse are the changes that stop being an outpatient question. What stays open should stay written: the cause, the medication, her preferences, and the device questions nobody has answered. Nothing here diagnoses, changes a medication, gives atropine or oxygen, starts an infusion, paces, decides eligibility, selects or implants or programs a device, sets a disposition, or predicts recurrence or outcome.' };
}
