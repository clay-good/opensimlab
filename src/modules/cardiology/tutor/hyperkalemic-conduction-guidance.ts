import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { HyperkalemicConductionProgress } from '../hyperkalemic-conduction';

export const HYPERKALEMIC_CONDUCTION_TUTOR_VERSION = '0.1.0';

export interface HyperkalemicConductionPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the ECG getting better. The QRS narrowed, the
 * P waves came back, and her potassium is exactly what it was — calcium
 * protects the membrane and removes nothing, and mistaking one for the other
 * is how a treated hyperkalemia becomes an untreated one. The three review
 * lanes in the middle are genuinely parallel, so the tutor names whichever
 * remain rather than imposing an order. It is silent on the unassisted
 * setting, silent once the handoff is recorded, and silent for any scenario
 * version it was not written against.
 */
export function hyperkalemicConductionInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: HyperkalemicConductionProgress },
): HyperkalemicConductionPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.reconciledAtTick === null) return prompt('hkc-trajectory', true,
    'Put the record in order before you interpret any of it. Three timepoints, not one.',
    'A seventy-two-year-old woman with chronic kidney disease and heart failure, poor intake and an acute kidney injury, handed over to Cardiology after emergency treatment. Before: a nonhemolyzed potassium of 6.9, a rate of 38 with a palpable pulse, attenuated P waves and a QRS of 154 ms. Since: the treating team gave intravenous calcium, and insulin-glucose and a locally chosen adjunct are already running. Now: 52/min, clearer P waves, a QRS of 112 ms, 118/70, 97% on air, alert and warm. And the potassium in the immediate post-calcium record is still 6.9. Everything that follows depends on holding those three columns apart, and on not deciding yet that the potassium explains all of it.');
  if (patient.calciumResponseAtTick === null && patient.shiftSurveillanceAtTick === null
    && patient.removalDeviceAtTick === null) return prompt('hkc-lanes', true,
    'Three lanes are open and none of them queues behind the others.',
    'What the calcium did and did not do — and the second half of that is the one that matters, because calcium protects the membrane and removes no potassium at all. What the shifting treatment now obliges you to watch. And the removal work — the kidneys, the contributors, the owner — along with the question of whether her conduction disease is hers or her potassium\'s. The engine takes them in any order and refuses the later panel until all three have landed, which is a fair picture of a post-emergency review where the phone calls overlap. Start with whichever you would start with.');
  if (patient.calciumResponseAtTick === null) return prompt('hkc-calcium', true,
    'Say what the calcium did — and then say, in the same sentence, what it did not do.',
    'The QRS narrowed from 154 to 112 ms and the P waves became visible again, which is a real and important change. It is also entirely a membrane effect. Her potassium in the authored post-calcium record is 6.9, exactly where it started, because calcium does not remove potassium and was never going to. This is the single most consequential misreading available in this lesson: a monitor that looks better is the thing most likely to persuade a team the emergency is over, and what has actually happened is that they have bought time. The clock is still running.');
  if (patient.shiftSurveillanceAtTick === null) return prompt('hkc-shift', true,
    'Shifting treatment creates two new things to watch, and both of them bite later.',
    'The reported insulin-glucose and the locally selected adjunct move potassium into cells; they do not take it out of her. So the potassium comes back, which is what rebound means and why serial measurement rather than one repeat is the requirement. And the insulin outlasts the glucose, so hypoglycemia is not a remote possibility but an expected complication with a baseline and serial checks attached to it. You select no drug, no dose, no route and no glucose rescue here — what you are recording is the surveillance the reported treatment has already committed somebody to.');
  if (patient.removalDeviceAtTick === null) return prompt('hkc-removal', true,
    'Get the potassium out, find what is putting it in, and leave the pacemaker question alone.',
    'Shifting is a holding measure; removal is the treatment, and it belongs to the kidneys, the contributors and a named renal owner, with a dialysis contingency if the trajectory does not turn. The restraint at the end of that sentence is the teaching point: she has a slow rhythm and wide conduction in the middle of a metabolic disturbance that is actively being corrected, and deciding she needs a permanent device now would be deciding it about a heart nobody has seen at a normal potassium. Defer it — and put persistent conduction disease after correction on the list as an explicit trigger for expert reevaluation, so deferring is not the same as forgetting.');
  if (patient.laterPanelAtTick === null) return prompt('hkc-panel', true,
    'Let time pass, then read the later panel — and read it as one point on a line.',
    'The fixed later report is a potassium of 5.8, a glucose of 92, sinus rhythm at 62 with visible P waves, a QRS of 98 ms and preserved perfusion. That is better in every column, and it is a serial measurement rather than a result. It does not prove the potassium was the sole cause of her conduction disturbance, it does not prove the correction is durable, and 5.8 is not normal. The improvement is real and the surveillance is unchanged by it.');
  return prompt('hkc-handoff', true,
    'Hand off the watching, not a conclusion.',
    'What goes across is serial potassium, glucose, ECG and kidney function, the removal progress, the rebound risk, the medication and illness contributors, the triggers for compromise and pulse loss, the device question deliberately left open, and named owners for each. What does not go across is a decision: no treatment prescribed, no dose, no target, no pacing, no device, no disposition and no prognosis. Nothing in this lesson examines her, acquires or interprets a specimen, ECG, monitor or image, diagnoses a cause, delivers calcium, insulin, glucose, a beta-agonist, a binder, dialysis, a medication or a rescue, selects a dose or a target, models kinetics, decides pacing eligibility, chooses, implants or programs a device, assesses capture, determines disposition or prognosis, or predicts recurrence or outcome.');
}
