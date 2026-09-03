import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsHyperkalemicConduction, type HyperkalemicConductionAction,
  type HyperkalemicConductionProgress,
} from '../hyperkalemic-conduction';

export const HYPERKALEMIC_CONDUCTION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsHyperkalemicConductionDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsHyperkalemicConduction(scenario);
}

export interface HyperkalemicConductionDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: HyperkalemicConductionAction;
  readonly finished?: boolean;
}

/**
 * The worked example for an ECG that got better without the problem going
 * away.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. The three middle lanes are unordered and the example takes them
 * calcium, shifting, removal — a choice, not a rule. It examines nobody,
 * acquires or interprets no specimen, ECG, monitor or image, diagnoses no
 * cause, delivers no calcium, insulin, glucose, beta-agonist, binder,
 * dialysis, medication or rescue, selects no dose or target, models no
 * kinetics, decides no pacing eligibility, chooses, implants or programs no
 * device, assesses no capture, determines no disposition, and predicts no
 * outcome.
 */
export function hyperkalemicConductionDemonstrationStep(
  patient?: HyperkalemicConductionProgress,
): HyperkalemicConductionDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Her potassium is 5.8 rather than 6.9, her QRS is 98 ms rather than 154, and nothing has been removed from her yet — it has been moved, and it will come back. Nobody decided her conduction disease was hers, because nobody has seen this heart at a normal potassium. The ECG improving was the part that could have ended the review early. This ends the example, not the evaluation.' };
  }
  if (patient.reconciledAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-hyperkalemic-conduction-trajectory',
      narration: 'Put the record in order before you interpret any of it. Three timepoints, not one. A seventy-two-year-old woman with chronic kidney disease and heart failure, poor intake and an acute kidney injury, handed over to Cardiology after emergency treatment. Before: a nonhemolyzed potassium of 6.9, a rate of 38 with a palpable pulse, attenuated P waves and a QRS of 154 ms. Since: the treating team gave intravenous calcium, and insulin-glucose and a locally chosen adjunct are already running. Now: 52/min, clearer P waves, a QRS of 112 ms, 118/70, 97% on air, alert and warm. And the potassium in the immediate post-calcium record is still 6.9. Everything that follows depends on holding those three columns apart, and on not deciding yet that the potassium explains all of it.' };
  }
  if (patient.calciumResponseAtTick === null) {
    return { id: 'lanes', focus: 'monitor', progress: 0.26, action: 'review-hyperkalemic-conduction-calcium-response',
      narration: 'Three lanes are open and none of them queues behind the others. What the calcium did and did not do — and the second half of that is the one that matters, because calcium protects the membrane and removes no potassium at all. What the shifting treatment now obliges you to watch. And the removal work — the kidneys, the contributors, the owner — along with the question of whether her conduction disease is hers or her potassium\'s. The engine takes them in any order and refuses the later panel until all three have landed, which is a fair picture of a post-emergency review where the phone calls overlap. Start with whichever you would start with.' };
  }
  if (patient.shiftSurveillanceAtTick === null) {
    return { id: 'shift', focus: 'monitor', progress: 0.44, action: 'review-hyperkalemic-conduction-shift-surveillance',
      narration: 'Shifting treatment creates two new things to watch, and both of them bite later. The reported insulin-glucose and the locally selected adjunct move potassium into cells; they do not take it out of her. So the potassium comes back, which is what rebound means and why serial measurement rather than one repeat is the requirement. And the insulin outlasts the glucose, so hypoglycemia is not a remote possibility but an expected complication with a baseline and serial checks attached to it. You select no drug, no dose, no route and no glucose rescue here — what you are recording is the surveillance the reported treatment has already committed somebody to.' };
  }
  if (patient.removalDeviceAtTick === null) {
    return { id: 'removal', focus: 'actions', progress: 0.6, action: 'review-hyperkalemic-conduction-removal-and-device-restraint',
      narration: 'Get the potassium out, find what is putting it in, and leave the pacemaker question alone. Shifting is a holding measure; removal is the treatment, and it belongs to the kidneys, the contributors and a named renal owner, with a dialysis contingency if the trajectory does not turn. The restraint at the end of that sentence is the teaching point: she has a slow rhythm and wide conduction in the middle of a metabolic disturbance that is actively being corrected, and deciding she needs a permanent device now would be deciding it about a heart nobody has seen at a normal potassium. Defer it — and put persistent conduction disease after correction on the list as an explicit trigger for expert reevaluation, so deferring is not the same as forgetting.' };
  }
  if (patient.laterPanelAtTick === null) {
    return { id: 'panel', focus: 'monitor', progress: 0.78, action: 'review-hyperkalemic-conduction-later-panel',
      narration: 'Let time pass, then read the later panel — and read it as one point on a line. The fixed later report is a potassium of 5.8, a glucose of 92, sinus rhythm at 62 with visible P waves, a QRS of 98 ms and preserved perfusion. That is better in every column, and it is a serial measurement rather than a result. It does not prove the potassium was the sole cause of her conduction disturbance, it does not prove the correction is durable, and 5.8 is not normal. The improvement is real and the surveillance is unchanged by it.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-hyperkalemic-conduction-reassessment',
    narration: 'Hand off the watching, not a conclusion. What goes across is serial potassium, glucose, ECG and kidney function, the removal progress, the rebound risk, the medication and illness contributors, the triggers for compromise and pulse loss, the device question deliberately left open, and named owners for each. What does not go across is a decision: no treatment prescribed, no dose, no target, no pacing, no device, no disposition and no prognosis. Nothing in this lesson examines her, acquires or interprets a specimen, ECG, monitor or image, diagnoses a cause, delivers calcium, insulin, glucose, a beta-agonist, a binder, dialysis, a medication or a rescue, selects a dose or a target, models kinetics, decides pacing eligibility, chooses, implants or programs a device, assesses capture, determines disposition or prognosis, or predicts recurrence or outcome.' };
}
