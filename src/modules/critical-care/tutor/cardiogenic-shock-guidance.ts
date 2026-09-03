import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { CardiogenicShockProgress } from '../cardiogenic-shock';

export const CARDIOGENIC_SHOCK_TUTOR_VERSION = '0.1.0';

export interface CardiogenicShockPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the fluid. A MAP of 58 with a rising lactate
 * pulls hard towards a bolus, and this patient's left ventricle is already
 * failing into lungs that are full of B-lines — the same instinct that is right
 * in septic shock is wrong here, and the module now teaches both. The second
 * reflex is the device: a shocked patient with an anterior infarct invites
 * mechanical support, and the artery is still shut.
 *
 * It is silent on the unassisted setting, silent once the trajectory is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function cardiogenicShockInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: CardiogenicShockProgress },
): CardiogenicShockPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessmentAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('cgs-recognition', true,
    'Say that he is in shock, and call the people who fix it — before you know exactly what kind.',
    'A sixty-four-year-old man with an acute anterior STEMI pattern, deteriorating while the catheterization pathway is being mobilised. Invasive pressure 78/48 with a MAP of 58, 112/min in sinus, cool mottled extremities, refill of five seconds, new confusion, ten millilitres of urine in the last hour, and a lactate climbing from 3.1 to 4.8. He is 91% on supplemental oxygen at a rate of 28 with bilateral crackles. The MAP is the least interesting number there: the brain, the skin, the kidney and the lactate all say the same thing, and they say it more reliably than a pressure does. Activating the shock and catheterization teams is a step of its own because it takes time you do not have later, and because it should happen off the trajectory rather than off a diagnosis.');
  if (patient.phenotypeAtTick === null) return prompt('cgs-phenotype', true,
    'Look at the heart before you support it — and specifically at the things that would change everything.',
    'The fixed ECG reports persistent anterior ST elevation. The fixed echo reports severe left-ventricular systolic dysfunction with anterior and apical akinesis, a preserved right ventricle, no pericardial effusion, and no reported acute severe mitral regurgitation or ventricular-septal defect, with bilateral B-lines supporting congestion. Every one of those negatives is doing work. A tamponade, a right-ventricular infarct, an acute severe mitral regurgitation or a ruptured septum each turn this into a different emergency with a different first move, and the last two would need a surgeon rather than a vasopressor. What the panel supports is a left-sided, congested, pump-failure phenotype — which is also the reason the fluid this patient\'s pressure invites you to give would go into his lungs.');
  if (patient.bridgeAtTick === null) return prompt('cgs-bridge', true,
    'A bridge, linked to his perfusion — and no primary fluid loading.',
    'The point of a vasopressor here is to buy the time it takes to open an artery, and that is all it is: bounded, tied to reassessment, and not a treatment for the infarct. No universal target is set and no dose is selected, because the number that matters is his perfusion rather than a figure someone chose in advance. The instruction the lesson is most specific about is the negative one. He has a failing left ventricle and lungs full of B-lines, so primary fluid loading has nowhere useful to go — and if you have just come from the septic-shock lesson, notice that the same instinct that was right there is wrong here, which is the whole reason both lessons exist.');
  if (patient.causeControlAtTick === null) return prompt('cgs-cause', true,
    'Now the only thing that actually changes his trajectory: open the culprit vessel.',
    'The bridge holds him; the revascularization is what treats him, and prompt culprit-vessel work comes before any unselected device escalation or routine treatment of his other vessels. That order matters because a shocked patient with an anterior infarct invites mechanical support, and support layered onto an artery that is still shut is expensive, invasive, and not the fix. Inotrope, invasive-haemodynamic, transfer and temporary-support decisions stay expert, phenotype, trajectory, risk and resource dependent — no device here is routine, and you select none of it.');
  return prompt('cgs-reassessment', true,
    'Read the response, and notice how much of the work it leaves untouched.',
    'The fixed response improves, and improvement at this point means the bridge is doing what a bridge does. It does not mean the shock is treated, because the artery is the shock and it is not open yet; nor does it close the shock team\'s work, the revascularization decisions, the device questions or the organ trajectory. Pressure, perfusion, congestion, rhythm, gas exchange and organ function all get read together, exactly as they were at the start. Nothing here examines him, acquires monitoring or a test, diagnoses, delivers oxygen or a drug, obtains access, doses, images, catheterizes, revascularizes, provides mechanical support, transfers, determines disposition, or predicts outcome.');
}
