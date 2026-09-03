import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsCardiogenicShock, type CardiogenicShockAction, type CardiogenicShockProgress,
} from '../cardiogenic-shock';

export const CARDIOGENIC_SHOCK_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCardiogenicShockDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCardiogenicShock(scenario);
}

export interface CardiogenicShockDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CardiogenicShockAction;
  readonly finished?: boolean;
}

/**
 * The worked example for a shock the previous lesson's instincts would treat
 * wrongly.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. There is no unordered lane here: five beats in the only order
 * the engine accepts. It examines nobody, acquires no monitoring or test,
 * diagnoses nothing, delivers no oxygen or drug, obtains no access, doses
 * nothing, images nothing, catheterizes, revascularizes, supports, transfers
 * and dispositions nobody, and predicts no outcome.
 */
export function cardiogenicShockDemonstrationStep(
  patient?: CardiogenicShockProgress,
): CardiogenicShockDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.reassessmentAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'His numbers are better and his artery is shut. Nothing was given, nothing was opened, and no device was chosen — what the review produced was a bridge with a reason and a queue in the right order. The fluid a MAP of 58 asks for would have gone into his lungs, and the device a shocked anterior infarct asks for would have been layered onto the problem rather than fixing it. This ends the example, not the evaluation.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.12, action: 'recognize-cardiogenic-shock-trajectory',
      narration: 'Say that he is in shock, and call the people who fix it — before you know exactly what kind. A sixty-four-year-old man with an acute anterior STEMI pattern, deteriorating while the catheterization pathway is being mobilised. Invasive pressure 78/48 with a MAP of 58, 112/min in sinus, cool mottled extremities, refill of five seconds, new confusion, ten millilitres of urine in the last hour, and a lactate climbing from 3.1 to 4.8. He is 91% on supplemental oxygen at a rate of 28 with bilateral crackles. The MAP is the least interesting number there: the brain, the skin, the kidney and the lactate all say the same thing, and they say it more reliably than a pressure does. Activating the shock and catheterization teams is a step of its own because it takes time you do not have later, and because it should happen off the trajectory rather than off a diagnosis.' };
  }
  if (patient.phenotypeAtTick === null) {
    return { id: 'phenotype', focus: 'monitor', progress: 0.3, action: 'review-cardiogenic-shock-cause-and-phenotype',
      narration: 'Look at the heart before you support it — and specifically at the things that would change everything. The fixed ECG reports persistent anterior ST elevation. The fixed echo reports severe left-ventricular systolic dysfunction with anterior and apical akinesis, a preserved right ventricle, no pericardial effusion, and no reported acute severe mitral regurgitation or ventricular-septal defect, with bilateral B-lines supporting congestion. Every one of those negatives is doing work. A tamponade, a right-ventricular infarct, an acute severe mitral regurgitation or a ruptured septum each turn this into a different emergency with a different first move, and the last two would need a surgeon rather than a vasopressor. What the panel supports is a left-sided, congested, pump-failure phenotype — which is also the reason the fluid this patient\'s pressure invites you to give would go into his lungs.' };
  }
  if (patient.bridgeAtTick === null) {
    return { id: 'bridge', focus: 'actions', progress: 0.52, action: 'record-cardiogenic-shock-bridge',
      narration: 'A bridge, linked to his perfusion — and no primary fluid loading. The point of a vasopressor here is to buy the time it takes to open an artery, and that is all it is: bounded, tied to reassessment, and not a treatment for the infarct. No universal target is set and no dose is selected, because the number that matters is his perfusion rather than a figure someone chose in advance. The instruction the lesson is most specific about is the negative one. He has a failing left ventricle and lungs full of B-lines, so primary fluid loading has nowhere useful to go — and if you have just come from the septic-shock lesson, notice that the same instinct that was right there is wrong here, which is the whole reason both lessons exist.' };
  }
  if (patient.causeControlAtTick === null) {
    return { id: 'cause', focus: 'actions', progress: 0.74, action: 'escalate-cardiogenic-shock-cause-control',
      narration: 'Now the only thing that actually changes his trajectory: open the culprit vessel. The bridge holds him; the revascularization is what treats him, and prompt culprit-vessel work comes before any unselected device escalation or routine treatment of his other vessels. That order matters because a shocked patient with an anterior infarct invites mechanical support, and support layered onto an artery that is still shut is expensive, invasive, and not the fix. Inotrope, invasive-haemodynamic, transfer and temporary-support decisions stay expert, phenotype, trajectory, risk and resource dependent — no device here is routine, and you select none of it.' };
  }
  return { id: 'reassessment', focus: 'monitor', progress: 0.9, action: 'reassess-cardiogenic-shock-trajectory',
    narration: 'Read the response, and notice how much of the work it leaves untouched. The fixed response improves, and improvement at this point means the bridge is doing what a bridge does. It does not mean the shock is treated, because the artery is the shock and it is not open yet; nor does it close the shock team\'s work, the revascularization decisions, the device questions or the organ trajectory. Pressure, perfusion, congestion, rhythm, gas exchange and organ function all get read together, exactly as they were at the start. Nothing here examines him, acquires monitoring or a test, diagnoses, delivers oxygen or a drug, obtains access, doses, images, catheterizes, revascularizes, provides mechanical support, transfers, determines disposition, or predicts outcome.' };
}
