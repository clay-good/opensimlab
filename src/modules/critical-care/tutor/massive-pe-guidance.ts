import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MassivePeProgress } from '../massive-pe';

export const MASSIVE_PE_TUTOR_VERSION = '0.1.0';

export interface MassivePePrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the urge to do more diagnosing. He is the
 * sickest patient in the module and everything about him invites another
 * study, another opinion, another confirmation — and the diagnosis has already
 * been made by an imaging report in his notes. The second reflex is subtler and
 * is the one the lesson is really built on: a bridge that carries his
 * circulation is not treatment of his clot, and it is very easy to relax once
 * the numbers improve as though it were.
 *
 * It is silent on the unassisted setting, silent once the trajectory is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function massivePeInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: MassivePeProgress },
): MassivePePrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessmentAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('mpe-recognition', true,
    'Name the failure state and call everybody. This step is first because nothing else buys him time.',
    'A fifty-seven-year-old intubated man with an imaging-confirmed saddle pulmonary embolism, still hypotensive despite parenteral anticoagulation and three vasoactive infusions. MAP 50, rate 132 in sinus, refill six seconds, mottled and cool, not following commands, five millilitres of urine in the last hour, and a lactate going from 5.2 to 8.1. He is 82% on an inspired oxygen fraction of 1.0. That is circulatory and respiratory failure together in a patient already on the treatment, which is the category the guidelines call E2R and the rest of us call out of options. PERT, shock, resuscitation, perfusion and ECMO-capable teams are activated now, before the review, because the people who can help him take time to assemble and he does not have any.');
  if (patient.patternAtTick === null) return prompt('mpe-pattern', true,
    'Read what is already in the notes. Do not go looking for a diagnosis you have.',
    'The fixed CT reports acute central pulmonary emboli. The fixed echo reports severe right-ventricular dilation and hypokinesis, septal flattening, a small left ventricle and no effusion, with no tension pneumothorax and no active external bleeding pattern reported. That is acute obstructive right-heart failure, and it is the same septal-flattening picture as the previous lesson arriving by a different route. The reason this step is a review rather than a work-up is that the answer is already here, and the most expensive thing anybody could do now is order another study to be sure. Two things stay visible while you read it: the bleeding risk, which decides what can safely be given, and the possibility that something else is contributing alongside the clot.');
  if (patient.supportAtTick === null) return prompt('mpe-support', true,
    'Support the ventricle you have, and do not load it with fluid.',
    'Systemic perfusion, oxygenation, ventilation, rhythm and the anticoagulation already running all get reviewed together and specifically for a failing, pressure-loaded right ventricle. Blind fluid loading is excluded for the same reason it was in the last lesson, and more sharply: this ventricle is obstructed at its outflow, so volume has nowhere to go and distends the one chamber keeping him alive. The ventilation deserves its own thought, because the pressures that recruit a lung are the pressures that raise the afterload he is failing against. No dose, no target and no delivery here — this is a review, and everything in it belongs to the teams you just called.');
  if (patient.ecmoAtTick === null) return prompt('mpe-ecmo', true,
    'Activate the bridge — and be exact about what a bridge is not.',
    'Veno-arterial ECMO is a stabilization bridge for refractory Category E2 shock: it takes over the circulation the obstruction has defeated and buys time for something else to work. It does not touch the clot. It is also resource- and candidacy-dependent rather than a rule — whether it is available and whether it is right for this man are decisions belonging to the teams and the institution, not to a protocol and not to you. You cannulate nothing and run nothing. Recording the pathway as activated is what stops the bridge being discussed rather than arranged.');
  return prompt('mpe-reassessment', true,
    'His numbers improve. Say precisely what that does and does not mean.',
    'The fixed response improves, and everything about that is a circulation being carried rather than a clot being treated: the obstruction is exactly where it was, and the bridge is the reason the numbers moved. That is the whole distinction this lesson exists for, and it is easiest to lose at exactly this moment. Whether any additional advanced reperfusion is warranted stays individualized and open — its usefulness in a patient already on VA-ECMO is not established, so neither doing it nor withholding it is the automatic answer. Nothing here examines him, acquires or interprets monitoring, CT, echo, laboratory or haemodynamic data, diagnoses, delivers oxygen, ventilation, anticoagulation, fluid or a drug, obtains access, doses, performs CPR, cannulation, ECMO, thrombectomy, thrombolysis or embolectomy, transfers, determines disposition, or predicts outcome.');
}
