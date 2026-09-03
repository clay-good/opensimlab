import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { HypertensiveEmergencyProgress } from '../hypertensive-emergency';

export const HYPERTENSIVE_EMERGENCY_TUTOR_VERSION = '0.1.0';

export interface HypertensiveEmergencyPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is 238/134. A number that large asks to be
 * treated on sight, and the lesson makes the learner earn it twice: once by
 * verifying how it was taken, and once by finding the organ injury that turns
 * a severe pressure into an emergency. Having earned it, the second reflex
 * arrives — bringing the number down fast — and the answer to that is a
 * refusal to supply any recipe at all, in either direction. It is silent on
 * the unassisted setting, silent once the handoff is recorded, and silent for
 * any scenario version it was not written against.
 */
export function hypertensiveEmergencyInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: HypertensiveEmergencyProgress },
): HypertensiveEmergencyPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.measurementAtTick === null) return prompt('hte-measurement', true,
    'Before the number means anything, say how it was taken.',
    'A fifty-eight-year-old woman with hypertension and a three-week gap in her supply, three days of headache and bilateral blurred vision, and an initial reading of 238/134. What makes that reading usable is what came after it: documented rest, correct positioning, a correctly sized cuff, and repeated readings of 236/132 in the right arm and 232/130 in the left. Both arms, several times, under conditions somebody wrote down. This is not administrative — a cuff that is too small on an arm that is too big is the commonest way a patient gets treated for an emergency they do not have, and the two-arm comparison is also how a pressure difference that would change the whole pathway gets found. She is 86/min in sinus, 16 breaths, 98% on air, 36.8 degrees, alert, coherent, nonfocal and warm. A marked pressure on its own is still not an emergency.');
  if (patient.organInjuryAtTick === null) return prompt('hte-organ', true,
    'Now find the thing that makes this an emergency, because the pressure is not it.',
    'The fixed fundus report describes bilateral flame hemorrhages, cotton-wool spots and optic-disc edema. Her creatinine is 2.1 mg/dL against 0.9 mg/dL six months ago, with 2+ protein and microscopic hematuria. That is acute retinal and renal injury happening now, and it — not the 236 — is what makes this a hypertensive emergency rather than severe hypertension needing an outpatient plan. The distinction is the entire lesson, and it runs both ways: this patient needs urgent treatment and a patient with the same numbers and no organ injury does not. You perform no fundoscopy, collect no specimen and interpret no real test; these are authored reports, and while you read them keep the other organ emergencies in mind, because pulmonary edema, an acute coronary syndrome, an aortic syndrome, a stroke or a bleed each open a different pathway.');
  if (patient.phenotypeAtTick === null && patient.reductionIntentAtTick === null) return prompt('hte-parallel', true,
    'Two lanes, either order — what kind of emergency this is, and starting to treat it.',
    'The engine accepts them either way round and refuses the later panel until both have landed, because in a real unit somebody is reviewing the ECG and the echo while somebody else is arranging monitored control. Neither waits for the other: the phenotype work is not a prerequisite for treating, and treating is not a reason to stop asking what else is going on. Whichever you take first, the treating lane supplies no numbers of any kind — no drug, no dose, no rate, no percentage, no universal target — because a fast fall is its own injury, and a brain and a pair of kidneys adapted to living at 236 lose perfusion at pressures that would be unremarkable in somebody else. Rapid normalization is the harm, not the goal. What is worth carrying into both is that this is a renal-retinal presentation rather than a cardiac or neurologic one, and that the refill gap is the obvious explanation rather than the established one.');
  if (patient.phenotypeAtTick === null) return prompt('hte-phenotype', true,
    'Say which emergency this is by saying which ones it is not — for now.',
    'The fixed ECG reports sinus rhythm and LVH with no acute ischemic change; the lungs are clear and the echo reports an LVEF of 60%, concentric LVH, no acute heart-failure finding and no effusion. There is no chest or back pain, no dyspnea, no pregnancy, no pressure or pulse asymmetry, no focal deficit, no seizure and no altered mentation. That makes this renal-retinal rather than pulmonary edema, an acute coronary syndrome, an aortic syndrome, a stroke, a bleed or a pregnancy-related emergency — each of which has its own pathway and its own pressure targets, which is why the phenotype has to be named rather than assumed. Every one of those is a snapshot and a change trigger rather than a permanent exclusion. And the cause stays open: the three-week refill gap is the obvious answer, and medication access, adherence, kidney disease, substances, interactions and secondary causes are all still on the table rather than closed by it.');
  if (patient.reductionIntentAtTick === null) return prompt('hte-reduction', true,
    'Record prompt, monitored, controlled reduction — and no numbers of any kind.',
    'Prompt because the injury is happening now, monitored because you cannot control a pressure you are not watching closely, controlled because a fast fall is its own injury: a brain and a pair of kidneys that have adapted to living at 236 lose perfusion at pressures that would be unremarkable in somebody else, which is why rapid normalization is the harm and not the goal. What is deliberately absent is any recipe. No drug, no dose, no infusion rate, no fixed percentage, no universal target — because the target is syndrome-specific and this lesson refuses to hand you a number that would be wrong in the next patient. Preserving perfusion and using the organ-specific pathway is the frame; the arithmetic belongs to the team in front of the patient.');
  if (patient.laterPanelAtTick === null) return prompt('hte-panel', true,
    'Let time pass, then read the forty-five-minute report — and notice who produced it.',
    'The fixed report is 212/122, 82/min, alert and nonfocal, an easing headache, persistent visual symptoms, warm perfusion and no chest or back pain or dyspnea. The pressure has come down by about ten percent, which is the shape of a controlled reduction rather than a rescue, and the experienced team achieved it — you delivered nothing, so none of this is evidence about a drug. The detail worth stopping on is the one that has not moved: her vision. The headache easing is the symptom most likely to reassure and the least specific; the persistent visual symptoms belong to the retinal injury that made this an emergency, and they are the reason nobody is finished.');
  return prompt('hte-handoff', true,
    'Hand off three hours of trajectory and two problems that are still open.',
    'The fixed three-hour report is 188/106, 80/min, an improved headache, vision not worse, alert and nonfocal, clear lungs, a urine output of 38 mL/h and a creatinine still 2.1 mg/dL. Read those last two together: the urine output is adequate, which is the reassurance that the reduction has not cost her kidneys their perfusion, and the creatinine has not moved, which is the reminder that the injury has not resolved. Vision not worse is not vision better. What goes across is the pressure and symptom trajectory, the renal and retinal injury still open, the causes nobody has established, the treatment choices nobody has made, the ownership and the change triggers. Nothing here examines her, performs fundoscopy, collects a specimen, acquires or interprets any test, diagnoses a cause, selects or delivers a drug, dose, infusion rate, percentage or target, performs a procedure, determines disposition or prognosis, or predicts outcome.');
}
