import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricSvt, type PediatricSvtAction, type PediatricSvtProgress,
} from '../pediatric-supraventricular-tachycardia';

export const PEDIATRIC_SVT_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricSvtDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricSvt(scenario);
}

export interface PediatricSvtDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricSvtAction; readonly finished?: boolean;
}

/**
 * The worked example for a rhythm that converts and settles nothing.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The steps are a strict line, so this example has only one order
 * available to it. It examines and monitors nobody, acquires and interprets no
 * ECG or other test, diagnoses nothing and assigns no mechanism, performs no
 * vagal maneuver, places no access, selects no modality, drug, product,
 * concentration, dose, route, volume, rate, device, energy or sedation,
 * performs no cardioversion, and determines no disposition or outcome.
 */
export function pediatricSvtDemonstrationStep(
  patient?: PediatricSvtProgress,
): PediatricSvtDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'His rhythm is sinus and his hands are warm, and nobody here knows the mechanism, the cause, or whether it comes back tonight. That is the honest state of it, and it is why he is going to a cardiologist rather than home. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-svt-clock-rhythm-and-whole-child',
      narration: 'Read the rhythm through the child, and start the clock at forty-five minutes. A previously well six-year-old, sitting at school, who abruptly felt his heart pounding and became dizzy. The supplied ECG report describes a very regular narrow-complex rhythm at 210 a minute, QRS 70 ms, nonvariable RR intervals and no clearly visible P waves — a probable SVT pattern, and deliberately not one established mechanism. The abruptness and the fixed rate are what separate this from a sinus tachycardia that would vary and would have a reason. He is awake and answering, anxious and dizzy, with a blood pressure of 96/60 and a saturation of 98% on air — and pale cool distal extremities, a refill of four seconds, and peripheral pulses that are weak against a central pulse at the same 210. Forty-five minutes of that is a load his ventricle has been carrying the whole time.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-svt-with-perfusion-compromise',
      narration: 'A normal blood pressure is not the same as adequate perfusion. Say that out loud. The temptation here is the number that looks fine. His pressure is 96/60 and he is talking to you, so nothing feels urgent — and his hands are cold, his refill is four seconds, and his peripheral pulses are weak. That is perfusion compromise in a child who is compensating, and compensating is a thing children do well right up until they stop. Naming the boundary is what makes the next step urgent rather than routine. The absences narrow without excluding: no prior SVT, no known congenital heart disease, no fever, no vomiting or poor intake, no stimulant or medicine exposure, no respiratory distress — and another rhythm, pre-excitation, structural heart disease, heart failure and a contributor all stay open. You have interpreted no ECG and assigned no mechanism.' };
  }
  if (patient.careAtTick === null) {
    return { id: 'care', focus: 'actions', progress: 0.46, action: 'activate-pediatric-svt-qualified-rhythm-care-and-resuscitation-ownership',
      narration: 'Hand the rhythm to the people who own it, before you review anything else. Qualified pediatric rhythm-care, resuscitation, airway-capable, nursing, pharmacy and cardiology teams are available immediately, and the whole ladder is theirs: the vagal maneuver and how it is done, the access, the drug, the product, the concentration, the dose, the route, the flush, the modality, the energy, the sedation and the monitoring around all of it. You perform no maneuver and choose no modality. This lesson puts that ownership before the broader review for the same reason the anaphylaxis lesson puts the second dose first — a rhythm that has run for forty-five minutes in a child with cold hands is not a thing to think about for another ten.' };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'actions', progress: 0.64, action: 'review-pediatric-svt-support-causes-heart-failure-and-deterioration-boundary',
      narration: 'The rhythm has an owner. Now hold the support, the causes, and the line. What continues in parallel: his perfusion and mentation, the ventricular consequence of a sustained rate, whether heart failure is developing, the contributors and alternative rhythms that the fixed absences did not exclude, and the boundary at which this becomes deterioration and the response changes. Pre-excitation matters here because it changes what is safe, and it has not been excluded by anything you were given. The snapshots you have are of this minute, and a compensating child is the one whose reassessment interval should be shortest.' };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-svt-later-response',
      narration: 'Let time pass, then treat conversion as a checkpoint rather than an ending. The fixed later report has sinus rhythm at 118, a blood pressure of 102/66, a saturation of 99% and a normal temperature. That is the outcome everybody wanted and it is remarkably easy to over-read. It does not say a learner-delivered intervention did anything — you delivered none. It does not prove a causal treatment effect, does not establish the mechanism or the cause, does not make the conversion durable, does not prove the ventricle has recovered from forty-five minutes at 210, does not exclude heart failure or deterioration, and does not exclude recurrence. Sinus rhythm is where the cardiology question starts, not where it stops.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-svt-recurrence-cardiology-and-caregiver-risk',
    narration: 'Hand off a converted rhythm with everything about it still open. What travels is the abrupt onset and the forty-five minutes at 210, the supplied ECG description and that no mechanism was ever assigned, the perfusion compromise underneath a normal blood pressure, who owned the rhythm care and what they did, the conversion as a checkpoint with the time it happened, the recurrence risk and what would signal it, the cardiology follow-up including that pre-excitation and structural disease remain open questions for them, the contributors still unexcluded, and the caregiver conversation about what happened and what to do if it happens again. Nothing here proves SVT, excludes sinus tachycardia, establishes a mechanism or cause, claims a treatment effect or a durable conversion, excludes heart failure, deterioration or recurrence, or determines disposition, prognosis or outcome.' };
}
