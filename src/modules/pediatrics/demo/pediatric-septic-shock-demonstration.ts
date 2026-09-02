import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsPediatricSepticShock, type PediatricSepticShockAction,
  type PediatricSepticShockProgress,
} from '../pediatric-septic-shock';

export const PEDIATRIC_SEPTIC_SHOCK_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPediatricSepticShockDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPediatricSepticShock(scenario);
}

export interface PediatricSepticShockDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PediatricSepticShockAction; readonly finished?: boolean;
}

/**
 * The worked example for a child two aliquots did not fix.
 *
 * Its narration is generated from the tutor's own prose, so the two cannot
 * drift apart. Of the unordered pair it takes rescue first and source second,
 * which is one valid order rather than the required one. The example examines
 * nobody, calculates no score, acquires and interprets no culture, specimen,
 * lactate, laboratory test, ultrasound or image, identifies no source or
 * pathogen, chooses no antimicrobial, drug, dose, concentration, route,
 * access, fluid, bolus, volume, rate, vasoactive, oxygen, device or flow,
 * performs no source-control procedure, and determines no disposition or
 * outcome.
 */
export function pediatricSepticShockDemonstrationStep(
  patient?: PediatricSepticShockProgress,
): PediatricSepticShockDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is holding on one infusion, with the reason she is in shock still in her abdomen and a team already planning what to do about it. Nothing here was fixed. Everything here has an owner. This ends the example, not the evaluation.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.1, action: 'reconcile-pediatric-septic-shock-care-and-trajectory',
      narration: 'Read the direction she is moving in, not the numbers on their own. A previously well four-year-old, 16 kg, three days of fever with worsening abdominal pain, vomiting and almost no urine. A qualified examination and ultrasound localize right-lower-quadrant inflammation and complex fluid concerning for a perforated appendiceal source, which is not the same as a confirmed one. The experienced team took cultures and a lactate without delaying anything, gave empiric antimicrobial cover at minute fifteen, and gave two individually reassessed 10 mL/kg aliquots at minutes ten and twenty-five. Compare arrival with minute thirty-five: a refill of four seconds is now six, a MAP of 54 is now 43, urine of 0.3 mL/kg/h is now 0.2, and a child who was tired is now drowsy at GCS 11. Everything reasonable has been done, and she is going the wrong way.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognition', focus: 'monitor', progress: 0.28, action: 'recognize-pediatric-septic-shock-after-fluid-reassessment',
      narration: 'Two aliquots did not fix this, and the third is not automatic. The supplied expert report assigns two cardiovascular Phoenix points — one for a MAP of 32 to 44 at her age, one for a lactate of 5 to 10.9 — and zero elsewhere. Suspected infection plus that score is pediatric septic shock. You do not calculate it, and Phoenix classifies overt organ dysfunction rather than screening for it early. What changes the next step is the pair of new findings: bibasal crackles and a liver edge three centimeters down. Those are congestion warnings. They are not proof that the fluid caused them, and they are not permission to ignore the shock — they are the reason the next thing you reach for is not another bolus. No further fluid is authored here, pending expert reassessment.' };
  }
  if (patient.rescueAtTick === null) {
    return { id: 'rescue', focus: 'actions', progress: 0.46, action: 'activate-pediatric-septic-shock-critical-care-and-vasoactive-ownership',
      narration: 'Two things have to start now, and neither can wait for the other. She needs qualified critical-care and vasoactive ownership, and she needs the source clarified and a source-control plan formed. Sequencing them is how children in this state lose an hour. Start by activating the rescue: experienced critical-care, nursing, pharmacy and access teams take continuous perfusion and congestion reassessment and one locally selected first-line vasoactive, started without waiting for central access. No agent, dose, rate, route, pump, cumulative fluid total or MAP target is chosen by you, and none is universal.' };
  }
  if (patient.sourceAtTick === null) {
    return { id: 'source', focus: 'actions', progress: 0.64, action: 'escalate-pediatric-septic-shock-source-control',
      narration: 'Rescue is running. The source will not clarify itself. A vasoactive supports her while the reason she is in shock is still in her abdomen. Escalating means experienced pediatric, surgical, infectious-disease, laboratory and imaging teams own urgent source clarification and source-control planning now, in parallel with the rescue rather than after it succeeds. The appendiceal source stays concerning and unconfirmed: no pathogen, no procedure, no timing and no outcome is declared here, by them or by you.' };
  }
  if (patient.laterResponseAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-pediatric-septic-shock-later-response',
      narration: 'Let time pass with both running, then read what moved and what did not. At minute ninety one unnamed vasoactive infusion is active, no additional bolus and no source procedure has happened, and source-control planning continues. She is tired but answering appropriately at GCS 13, her MAP is 60, her refill is three seconds, her pulses are better though her extremities are still cool, her urine is 0.4 mL/kg/h and her lactate is 5.4. Real movement, and worth naming. Now the other column: the crackles and the hepatomegaly persist, and the supplied cardiovascular Phoenix subscore is still 2 — one vasoactive, and a lactate still between 5 and 10.9. This is partial stabilization with active shock. It does not prove the treatment caused the change, does not resolve the shock, does not control the source, and does not say where she goes next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-pediatric-septic-shock-active-risk',
    narration: 'Hand off a child who is holding, on support, with the cause still in place. What travels is the active shock and the perfusion and congestion trends, the fluid balance and why no third aliquot was given, the one unnamed vasoactive and who owns it, the antimicrobial review, the unresolved source and pathogen with the source-control planning still in progress, the triggers that would mean this is failing, the caregiver context, and the named pediatric, critical-care, nursing, pharmacy, laboratory, imaging and surgical owners. Nothing here claims a causal treatment effect, shock resolution, source control, durable recovery, disposition, prognosis or outcome.' };
}
