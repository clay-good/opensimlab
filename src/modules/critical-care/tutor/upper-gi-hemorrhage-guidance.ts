import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { UpperGiHemorrhageProgress } from '../upper-gi-hemorrhage';

export const UPPER_GI_HEMORRHAGE_TUTOR_VERSION = '0.1.0';

export interface UpperGiHemorrhagePrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is waiting for the haemoglobin. It is the number
 * everyone reaches for in a bleed and the slowest thing in the room — a falling
 * pressure, a five-second refill and a lactate that doubled had already said
 * this, and a restrictive threshold is a starting point for a stable patient
 * rather than a permission slip in one who is actively bleeding. The second
 * reflex is treating a bridge as an answer: a better pressure after a
 * resuscitation says the resuscitation worked, not that the ulcer stopped.
 *
 * It is silent on the unassisted setting, silent once the trajectory is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function upperGiHemorrhageInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: UpperGiHemorrhageProgress },
): UpperGiHemorrhagePrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessmentAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('ugi-recognize', true,
    'She is bleeding again, and the perfusion said so before the count did.',
    'A sixty-eight-year-old woman who had a duodenal ulcer treated endoscopically, now with two fresh episodes of haematemesis and melena. MAP 55, heart rate 122, refill five seconds, cold hands, urine 10 mL an hour, lactate from 2.1 to 4.6, haemoglobin from 8.4 to 6.8. Read the order of that list: the perfusion findings and the lactate are the recurrence, and the haemoglobin is the last to arrive and the easiest to argue with. Recurrent bleeding after hemostasis is a different problem from a first bleed — it means the treated lesion has failed — and it needs GI, the hemorrhage team, critical care and the blood bank activated together rather than one at a time.');
  if (patient.patternAtTick === null) return prompt('ugi-pattern', true,
    'Say what is bleeding and what else could be, before you act on the story.',
    'Recurrent haematemesis and melena after prior duodenal-ulcer hemostasis is the likely answer, and the fixed review is what keeps it from becoming the only one: a soft nontender abdomen, no reported cirrhosis and no known varices — which matters, because a variceal bleed is a different pathway entirely — no external bleeding, no chest pain or focal neurology. Still open: her airway, because someone vomiting blood with a falling pressure is an aspiration risk and this screen does not manage that; her medications and coagulation; her comorbidities; and other sources. And the line worth carrying out of here — the haemoglobin is one part of a trajectory, not a perfusion measurement. It tells you about a number in a tube, not about whether her organs are getting blood.');
  if (patient.resuscitationAtTick === null) return prompt('ugi-resuscitate', true,
    'Resuscitate her — and do not let 7 make the decision for you.',
    'Hemodynamic support, large-bore access, serial counts, coagulation, fibrinogen, chemistry, lactate, type and crossmatch, medications, comorbidities, the blood bank. On transfusion the record says restrictive intent, individualized to active bleeding and to the whole patient, and explicitly that 7 g/dL is not a universal trigger. That distinction is the point of this step: a restrictive threshold comes from trials of stable patients, and she is actively bleeding with a MAP of 55 and a lactate of 4.6, which is exactly the situation the threshold was never meant to govern. Restrictive is a default to reason from, not a rule to hide behind. Nothing is accessed, sampled, given or transfused on this screen.');
  if (patient.hemostasisAtTick === null) return prompt('ugi-hemostasis', true,
    'Reopen hemostasis now, and know the next two doors before you need them.',
    'Repeat endoscopy for recurrent ulcer bleeding, running alongside the resuscitation rather than after it — she does not get stabilized first and scoped later, because the bleeding is why she is unstable. And the failure pathways get named in advance, while there is time to arrange them: transcatheter angiographic embolization after failed repeat endoscopic hemostasis, and surgery preserved for when embolization is unavailable or fails. Deciding that at three in the morning after the second endoscopy fails is how a delay happens. No endoscopy, embolization, surgery or hemostasis occurs here.');
  return prompt('ugi-reassess', true,
    'A better pressure means the resuscitation worked. It does not mean she stopped bleeding.',
    'MAP 68, heart rate 104, refill three seconds, mentation clearer, and no further haematemesis during a brief window. Every one of those is a bridge signal — evidence that volume and support reached her — and none of them is hemostasis. The temptation is to relax here, and the specific danger is that a bleed which is still going will look exactly like this until it does not. So the repeat endoscopy stands, and the serial haemoglobin, the lactate, the urine output, the medication decisions, the organ trajectory and the failure pathways all stay open. Nothing here examines, samples, transfuses, doses, scopes, embolizes, operates, diagnoses, determines disposition, or predicts outcome.');
}
