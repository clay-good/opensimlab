import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PediatricSepticShockProgress } from '../pediatric-septic-shock';

export const PEDIATRIC_SEPTIC_SHOCK_TUTOR_VERSION = '0.1.0';

export interface PediatricSepticShockPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * There is no wrong turn to answer, because this engine case authors none.
 * The reflex the lesson exists to interrupt is a third aliquot, and the thing
 * it will not let you do is finish one job before starting the other: rescue
 * and source control are recorded in either order, so the tutor has a beat for
 * each of the three ways that pair can be half done. It is silent on the
 * unassisted setting, silent once the handoff is recorded, and silent for any
 * scenario version it was not written against.
 */
export function pediatricSepticShockInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: PediatricSepticShockProgress },
): PediatricSepticShockPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('pss-trajectory', true,
    'Read the direction she is moving in, not the numbers on their own.',
    'A previously well four-year-old, 16 kg, three days of fever with worsening abdominal pain, vomiting and almost no urine. A qualified examination and ultrasound localize right-lower-quadrant inflammation and complex fluid concerning for a perforated appendiceal source, which is not the same as a confirmed one. The experienced team took cultures and a lactate without delaying anything, gave empiric antimicrobial cover at minute fifteen, and gave two individually reassessed 10 mL/kg aliquots at minutes ten and twenty-five. Compare arrival with minute thirty-five: a refill of four seconds is now six, a MAP of 54 is now 43, urine of 0.3 mL/kg/h is now 0.2, and a child who was tired is now drowsy at GCS 11. Everything reasonable has been done, and she is going the wrong way.');
  if (patient.recognitionAtTick === null) return prompt('pss-recognition', true,
    'Two aliquots did not fix this, and the third is not automatic.',
    'The supplied expert report assigns two cardiovascular Phoenix points — one for a MAP of 32 to 44 at her age, one for a lactate of 5 to 10.9 — and zero elsewhere. Suspected infection plus that score is pediatric septic shock. You do not calculate it, and Phoenix classifies overt organ dysfunction rather than screening for it early. What changes the next step is the pair of new findings: bibasal crackles and a liver edge three centimeters down. Those are congestion warnings. They are not proof that the fluid caused them, and they are not permission to ignore the shock — they are the reason the next thing you reach for is not another bolus. No further fluid is authored here, pending expert reassessment.');
  if (patient.rescueAtTick === null && patient.sourceAtTick === null) return prompt('pss-parallel', true,
    'Two things have to start now, and neither can wait for the other.',
    'She needs qualified critical-care and vasoactive ownership, and she needs the source clarified and a source-control plan formed. Sequencing them is how children in this state lose an hour. Start by activating the rescue: experienced critical-care, nursing, pharmacy and access teams take continuous perfusion and congestion reassessment and one locally selected first-line vasoactive, started without waiting for central access. No agent, dose, rate, route, pump, cumulative fluid total or MAP target is chosen by you, and none is universal.');
  if (patient.rescueAtTick === null) return prompt('pss-rescue', true,
    'The source work is moving. Her pressure still has no owner.',
    'Escalating the source was right and it does nothing for the next thirty minutes of her perfusion. Activating rescue means experienced critical-care, nursing, pharmacy and access teams own continuous perfusion and congestion reassessment and one locally selected first-line vasoactive, and that it starts without waiting for central access rather than after it. You select no agent, no dose, no rate, no route, no pump and no target — the point is that the people who do are running this now.');
  if (patient.sourceAtTick === null) return prompt('pss-source', true,
    'Rescue is running. The source will not clarify itself.',
    'A vasoactive supports her while the reason she is in shock is still in her abdomen. Escalating means experienced pediatric, surgical, infectious-disease, laboratory and imaging teams own urgent source clarification and source-control planning now, in parallel with the rescue rather than after it succeeds. The appendiceal source stays concerning and unconfirmed: no pathogen, no procedure, no timing and no outcome is declared here, by them or by you.');
  if (patient.laterResponseAtTick === null) return prompt('pss-later', true,
    'Let time pass with both running, then read what moved and what did not.',
    'At minute ninety one unnamed vasoactive infusion is active, no additional bolus and no source procedure has happened, and source-control planning continues. She is tired but answering appropriately at GCS 13, her MAP is 60, her refill is three seconds, her pulses are better though her extremities are still cool, her urine is 0.4 mL/kg/h and her lactate is 5.4. Real movement, and worth naming. Now the other column: the crackles and the hepatomegaly persist, and the supplied cardiovascular Phoenix subscore is still 2 — one vasoactive, and a lactate still between 5 and 10.9. This is partial stabilization with active shock. It does not prove the treatment caused the change, does not resolve the shock, does not control the source, and does not say where she goes next.');
  return prompt('pss-handoff', true,
    'Hand off a child who is holding, on support, with the cause still in place.',
    'What travels is the active shock and the perfusion and congestion trends, the fluid balance and why no third aliquot was given, the one unnamed vasoactive and who owns it, the antimicrobial review, the unresolved source and pathogen with the source-control planning still in progress, the triggers that would mean this is failing, the caregiver context, and the named pediatric, critical-care, nursing, pharmacy, laboratory, imaging and surgical owners. Nothing here claims a causal treatment effect, shock resolution, source control, durable recovery, disposition, prognosis or outcome.');
}
