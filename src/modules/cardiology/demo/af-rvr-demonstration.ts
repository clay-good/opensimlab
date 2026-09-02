import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import { supportsAfRvr, type AfRvrAction, type AfRvrProgress } from '../af-rvr';

export const AF_RVR_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAfRvrDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAfRvr(scenario);
}

export interface AfRvrDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AfRvrAction; readonly finished?: boolean;
}

/**
 * The worked example for a rate that pulls harder than it should.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. It acquires and interprets no ECG or test, calculates no score,
 * diagnoses nothing, prescribes and delivers no medication, selects no rate or
 * rhythm agent, performs no cardioversion, determines no disposition, and
 * predicts no outcome.
 */
export function afRvrDemonstrationStep(patient?: AfRvrProgress): AfRvrDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Her rate is lower and her atrium is unchanged. Nobody chose a drug, nobody scored her, and the two questions that will actually decide her year — how long this had been going on, and what protects her from a stroke — are written down as open rather than answered. This ends the example, not the evaluation.' };
  }
  if (patient.stabilityAtTick === null) {
    return { id: 'stability', focus: 'monitor', progress: 0.12, action: 'reconcile-af-rvr-rhythm-and-stability',
      narration: 'The rate is 142 and she is stable. Both halves of that matter. A sixty-nine-year-old woman with palpitations she noticed six hours ago. The fixed twelve-lead report names an irregular narrow-complex rhythm at 142 with no pre-excitation and no acute ischemic change — and the absence of pre-excitation is not a detail, because it is what makes the ordinary rate-control thinking safe here rather than dangerous. Now the other half: her pressure is 119/71, her saturation is 97% on air, she is alert and warm, and no hypotension, shock, ischemic discomfort, acute heart failure, syncope or altered mentation is authored. Stable does not mean untreated. It means you have time to get the next decisions right instead of reaching for the fastest one.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.34, action: 'review-af-rvr-context-and-triggers',
      narration: 'Before you touch the rate, find out how long this has been going on. She noticed the palpitations six hours ago and her last symptom-free check was three days ago. That gap is the single most consequential fact in the consultation, and it means the duration is uncertain rather than six hours — which changes what can safely be done about rhythm later. The rest of the context earns its place too: prior AF, her medications and whether she has been taking them, a fixed ejection fraction of 55%, and the acute contributors that can drive a fast ventricular response rather than being caused by it. Her haemoglobin, potassium, magnesium, TSH and temperature are within the authored ranges, and no infection, alcohol binge, stimulant exposure or medication change is supplied — which narrows without concluding.' };
  }
  if (patient.rateIntentAtTick === null) {
    return { id: 'rate', focus: 'actions', progress: 0.56, action: 'record-af-rvr-rate-control-intent',
      narration: 'Record what the rate control has to respect, not which drug does it. What shapes the choice: her haemodynamics, her ventricular function at 55%, the contraindications that apply to her specifically, and how symptomatic she actually is. What this lab does not supply is an agent, a dose, or a universal target number — and the target is genuinely individual, because a resting rate that is right for a symptomatic patient with preserved function is not the same as one chosen for someone else. You select no drug and perform no cardioversion. Note the thing the number invites: treating 142 as the problem, when the rate is a symptom of the rhythm and the rhythm is a symptom of something you have only started to look for.' };
  }
  if (patient.strokePreventionAtTick === null) {
    return { id: 'stroke', focus: 'actions', progress: 0.78, action: 'record-af-rvr-stroke-prevention-intent',
      narration: 'This is a separate lane. Slowing her heart does not make it safer. The most common error in this consultation is treating stroke prevention as something that follows rate control, or as something the rate response makes less urgent. It is neither. A slower ventricular rate is a more comfortable patient with exactly the same atrium, and the thromboembolic question is decided by validated risk assessment, her bleeding context and her own preferences — not by whether she now feels better. The uncertain duration comes back here too: it is what makes cardioversion a decision with anticoagulation implications rather than a quick fix. No score is calculated and no anticoagulant is selected in this lab.' };
  }
  return { id: 'reassessment', focus: 'monitor', progress: 0.92, action: 'reassess-af-rvr-trajectory-and-follow-up',
    narration: 'Read the lower rate for what it is, then say who is watching and when. The fixed later report is a rate response, and a rate response is not a resolved rhythm, a settled duration, a made stroke-prevention decision or an identified cause. What the record needs is the monitoring, the triggers that would change the plan — recurrence, symptoms, a rate that climbs again, any of the instability that is absent now — who owns the medication decisions and the anticoagulation review, and when she is next seen. Nothing here acquires or interprets an ECG or test, calculates a score, diagnoses, prescribes or delivers medication, selects a rate or rhythm agent, performs cardioversion, determines disposition, or predicts an outcome.' };
}
