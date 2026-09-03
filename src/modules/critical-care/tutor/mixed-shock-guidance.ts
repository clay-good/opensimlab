import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MixedShockProgress } from '../mixed-shock';

export const MIXED_SHOCK_TUTOR_VERSION = '0.1.0';

export interface MixedShockPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the label. Two lessons in this module have
 * just taught opposite fluid decisions for septic and cardiogenic shock, and
 * this patient is both — so the pull is to decide which one she really is and
 * then apply that lesson's answer. The mottled knees and the warm hands are on
 * the same patient, and the honest reading holds both rather than picking.
 *
 * It is silent on the unassisted setting, silent once the trajectory is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function mixedShockInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: MixedShockProgress },
): MixedShockPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessmentAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('mxs-recognition', true,
    'The clues disagree with each other. Say that out loud rather than resolving it early.',
    'Two days after culprit-vessel PCI for an anterior infarct, an intubated sixty-six-year-old woman with a new right-lower-lobe pneumonia is deteriorating despite reported vasoactive support. Her MAP is 54, rate 122 in sinus, refill four seconds, confusion increasing, urine 10 mL/h, lactate up from 3.4 to 5.1, temperature 39.1, and 92% on 0.50 with bilateral crackles. And the finding worth stopping on: her knees are mottled while her hands stay warm. That is a patient with cold physiology in one place and warm physiology in another, and it is not a measurement error — it is the point. Activate shock, cardiac and infection help now, off that trajectory, because a patient who does not fit a label is not a patient who can wait for one.');
  if (patient.hemodynamicsAtTick === null) return prompt('mxs-hemodynamics', true,
    'Read the panel as one patient with two problems, not as a vote between two diagnoses.',
    'The echo reports an ejection fraction of 25% with a preserved right ventricle, no effusion, and no acute severe mitral regurgitation or ventricular-septal defect. The catheter panel reports a cardiac index of 1.7, a wedge of 24, a central venous pressure of 11 and a systemic vascular resistance of 720. The first three of those describe a failing, congested pump; the last one, with a temperature of 39.1 and a consolidated lobe, describes vasodilation. Both are true at once, which is what mixed means, and forcing a single label would make one half of her invisible. Two cautions the lesson is firm about: those are suggested ranges rather than diagnostic cutoffs, and she is already on vasoactive support, which changes what every one of those numbers means. Keep rhythm, ischemia, mechanical complications, the right heart, obstruction, bleeding, medication and equipment on the list while you do it.');
  if (patient.supportAtTick === null) return prompt('mxs-support', true,
    'Support both halves. Neither one is the real problem with the other one as noise.',
    'Tone support for the vasodilated half and an expert review of output support for the failing pump — recorded together, because treating one and waiting to see is how a patient like this spends an hour getting worse in a way nobody can attribute. What is excluded is the thing both previous lessons in this trio have already argued about: blind fluid loading. Her wedge is 24 and her lungs have B-lines, so there is no volume problem to solve, and the septic half of her physiology does not change that. No dose, no agent and no target is selected here; the support stays expert-selected and reassessment-dependent, which is the only honest form for a decision this uncertain.');
  if (patient.causesAtTick === null) return prompt('mxs-causes', true,
    'Two causes, both still open. The classification does not close either one.',
    'The cardiac pathway is live: she is two days from a PCI with an ejection fraction of 25%, and rhythm, ischemia and mechanical complications all remain questions rather than settled facts. The infection pathway is live too: a right-lower-lobe consolidation and a temperature of 39.1 need source control and antimicrobial work of their own. The failure this step exists to prevent is subtle and common — having named the shock mixed, a team can treat the naming as the answer and let one of the two pathways quietly go unowned. Both stay active, in parallel, and neither is closed by the label.');
  return prompt('mxs-reassessment', true,
    'Read the response across every axis, and resist the word resolved.',
    'The fixed response improves, and improvement in a patient with two physiologies is the easiest thing in this module to over-read: it is consistent with either half responding, or with both partly, and it distinguishes none of that. Perfusion, haemodynamics, congestion, infection, gas exchange and organ trajectory are all read together, exactly as they were at the start, and no universal endpoint is claimed. Nothing here examines her, acquires monitoring, a catheter or a test, calculates, diagnoses, delivers oxygen, fluid or a drug, obtains access, doses, images, performs a procedure, revascularizes, treats the source, provides mechanical support, transfers, determines disposition, or predicts outcome.');
}
