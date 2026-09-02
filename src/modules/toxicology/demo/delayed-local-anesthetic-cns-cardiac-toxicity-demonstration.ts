import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsDelayedLast, type DelayedLastAction, type DelayedLastProgress,
} from '../delayed-local-anesthetic-cns-cardiac-toxicity';

export const DELAYED_LAST_DEMONSTRATION_VERSION = '0.1.0';

export function supportsDelayedLastDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsDelayedLast(scenario);
}

export interface DelayedLastDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: DelayedLastAction; readonly finished?: boolean;
}

/**
 * The worked example for a poisoning that is still being delivered.
 *
 * Thirty-eight hours after the block nobody is thinking about local anesthetic,
 * and the quiet warnings were never going to be the loud part. The source is a
 * pump, which means a room doing excellent resuscitation can leave it running:
 * every other step here is somebody's reflex, and stopping the infusion is
 * nobody's by default. So this example says the catheter first, puts source
 * cessation in the same breath as the airway and the lipid, and reads the wide
 * QRS and the acidemia as one loop. It touches no catheter and selects no
 * oxygen setting, sedative, lipid product, dose, route, rhythm intervention, or
 * circuit.
 */
export function delayedLastDemonstrationStep(
  patient?: DelayedLastProgress,
): DelayedLastDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on narrower, warmer and still drowsy, with the drug already in her tissue still arriving. Nothing was proven and nothing was excluded — not the cause, not the rhythm, not whether she convulses again. This ends the example, not the toxicity.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-toxicology-delayed-last-source-clock-prodrome-seizure-cardiac-and-whole-patient',
      narration: 'Say that the catheter is still there, and then say what it has been doing. Thirty-eight hours after ankle fixation, with a continuous ropivacaine catheter still in place: metallic taste, bilateral tinnitus, perioral tingling, dysarthria and agitation twelve minutes before arrival, then a seventy-second convulsion. Now sinus bradycardia at 48 with ectopy, 82/46, shallow breathing at 10. A poisoning that is still being delivered is a different problem from one that already was.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.24, action: 'recognize-toxicology-delayed-last-coupled-pattern-without-classic-sequence-clock-symptom-or-ecg-only-closure',
      narration: 'Name the CNS and the cardiac phases as one event, and refuse the four ways this gets closed early. No classic sequence, no clock, no single symptom, no seizure and no ECG interval diagnoses or grades her alone — and the tidy textbook order is the thing least worth relying on, because presentations vary and hers is already past the excitatory part. A wide QRS of 124 ms with bradycardia and ectopy is the cardiac phase, not an incidental interval. Epilepsy, stroke, infection, metabolic causes, other sodium-channel blockers and a coingestion all stay open.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.4, action: 'activate-toxicology-delayed-last-source-airway-seizure-cardiac-toxicology-lipid-and-refractory-rescue-ownership',
      narration: 'Give source cessation an owner in the same breath as the airway and the lipid. Everything else here is somebody’s reflex: the airway, the seizure, the rhythm, the pressure. Stopping the infusion is nobody’s by default, and it is the only step that changes how much drug she is still receiving. Qualified source cessation, airway, seizure, cardiac, poison-center, lipid-rescue and extracorporeal-support ownership all start together, and the catheter itself stays qualified-team work.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.56, action: 'review-toxicology-delayed-last-supplied-source-delivery-cns-ecg-perfusion-acid-base-electrolyte-and-differential-boundary',
      narration: 'Read the conduction and the acidosis as one loop, and keep the rescue a question. A QRS of 124 ms with a pH of 7.28, a PCO2 of 48 and a lactate of 4.1 is a loop rather than a list: acidemia worsens sodium-channel blockade, and hypoventilation feeds the acidemia. Catheter verification, the reservoir, the pump, the rate, the connection and whether it migrated are all still qualified-team work — an unverified pump is not a cleared one. Lipid and extracorporeal eligibility are specialist-led and this example determines neither.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'record-toxicology-delayed-last-bounded-qualified-source-airway-seizure-lipid-acid-base-modified-resuscitation-and-ecls-intent-with-strict-later-review',
      narration: 'Record the source cessation, the oxygenation and ventilation, the seizure care, the lipid emulsion, the acid-base support, the modified resuscitation, the serial CNS, ECG, perfusion and electrolyte surveillance, and the extracorporeal contingency as intents. Let the authored interval pass and read the qualified team’s 20-minute report. The interval is a contrast rather than a required wait, and nothing here says how fast any individual conduction interval narrows.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-toxicology-delayed-last-recurrent-seizure-arrhythmia-shock-airway-acidemia-source-lipid-and-refractory-risk',
    narration: 'Sinus at 76, 104/64, QRS 104 ms, arousable and no recurrent visible seizure. Local anesthetic already in tissue keeps arriving after the pump stops, so hand off recurrent seizure, arrhythmia, shock, the airway, the acidemia, the source and the refractory contingency as live — and prove none of it, not the lipid, not the rhythm, not the next hour.' };
}
