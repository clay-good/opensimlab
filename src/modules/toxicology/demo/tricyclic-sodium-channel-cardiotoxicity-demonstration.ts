import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsTricyclic, type TricyclicAction, type TricyclicProgress,
} from '../tricyclic-sodium-channel-cardiotoxicity';

export const TRICYCLIC_DEMONSTRATION_VERSION = '0.1.0';

export function supportsTricyclicDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsTricyclic(scenario);
}

export interface TricyclicDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: TricyclicAction; readonly finished?: boolean;
}

/**
 * The worked example for a wide complex that is not the rhythm problem it
 * resembles.
 *
 * A regular wide-complex tachycardia with a low pressure comes with an obvious
 * script, and following it here is the harm. This example keeps the electrical
 * picture coupled to the exposure, the seizure, the pressure and the pH rather
 * than closing on the interval, assembles the people needed for the second
 * seizure and the second episode of hypotension before either happens, and
 * finishes on a narrower QRS described as a response that can come back rather
 * than as a resolution. It selects no solution, concentration, dose, target,
 * antiarrhythmic, airway technique, ventilation setting, or rescue.
 */
export function tricyclicDemonstrationStep(
  patient?: TricyclicProgress,
): TricyclicDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on with a narrower complex, a better pressure, and every one of the things that produced the first set still able to produce a second. Nothing was proven and nothing was excluded. This ends the example, not the poisoning.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-toxicology-tricyclic-product-clock-cns-seizure-perfusion-ecg-and-whole-patient',
      narration: 'Put the product, the seizure and the pressure in the same sentence as the wide complex. Ninety minutes after an amitriptyline-only ingestion, with one generalized seizure that has already stopped, confusion, dry mucosa, mydriasis and a MAP of 59, breathing spontaneously and handling secretions. That is one poisoning presenting in several systems at once, not a rhythm with a history attached.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.24, action: 'recognize-toxicology-tricyclic-sodium-channel-cardiotoxicity-pattern-without-qrs-only-closure',
      narration: 'Name the sodium-channel pattern and refuse to close on the QRS. A QRS of 132 ms with a terminal rightward axis and a prominent terminal R in aVR supports it, does not make the diagnosis alone, and does not grade her — exposure, conduction, hypotension, CNS state, seizure, acid-base and the coingestion question stay coupled. It is also why a sodium-channel-blocking antiarrhythmic would be the wrong instinct for the wide complex in front of you.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.4, action: 'activate-toxicology-tricyclic-poison-center-resuscitation-cardiac-airway-seizure-and-safety-ownership',
      narration: 'Put people in the room for the things that have not happened yet. Poison center or medical toxicology, resuscitation and critical care, nursing and pharmacy, an airway-capable clinician, owners for the next seizure, the rhythm and the perfusion, and compassionate nonjudgmental safety ownership. She has had one seizure and one period of hypotension; the second of each does not wait for the room to be ready.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.56, action: 'review-toxicology-tricyclic-supplied-ecg-perfusion-acid-base-electrolyte-coingestion-and-rescue-boundary',
      narration: 'Read the electrical picture with the pressure, the pH and the potassium, and keep the rescue question open. pH 7.34, bicarbonate 19 and potassium 3.7 sit underneath a conduction problem that acidemia makes worse. What refractory rescue would mean, and who decides it, belongs on the table now rather than at the point of arrest — and this example selects no solution, concentration, dose, target, antiarrhythmic, airway technique, ventilation setting, lipid or extracorporeal support.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'record-toxicology-tricyclic-bounded-qualified-bicarbonate-and-rescue-intent-with-strict-later-review',
      narration: 'Record the bicarbonate intent and the refractory-rescue preparedness as intent, let the authored interval pass, and read the qualified team’s 3-hour report. The interval is a contrast rather than a required wait, and nothing here says how any individual case moves.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-toxicology-tricyclic-recurrent-conduction-shock-seizure-acidemia-rescue-and-active-risk',
    narration: 'QRS 104 ms, MAP 79, pH 7.43, clearer mentation, no further seizure. That is a response, and it is neither proof the treatment caused it nor evidence of durable electrical or perfusion stability. Redistribution continues, the conduction delay and the hypotension can recur, no coingestant has been excluded, and the potassium at 3.4 is still moving — so hand all of it off as live.' };
}
