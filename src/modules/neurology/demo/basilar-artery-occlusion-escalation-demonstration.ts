import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsBasilarLvo, type BasilarLvoAction, type BasilarLvoProgress,
} from '../basilar-artery-occlusion-escalation';

export const BASILAR_LVO_DEMONSTRATION_VERSION = '0.1.0';

export function supportsBasilarLvoDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsBasilarLvo(scenario);
}

export interface BasilarLvoDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: BasilarLvoAction; readonly finished?: boolean;
}

/**
 * The worked example for a clock that reads like a closed door.
 *
 * Ten hours ends the conversation in the anterior circulation and does not end
 * it here. The posterior syndrome is the one that gets under-called, and the
 * escalation is not downstream of the thrombolysis question — the two run
 * alongside each other, which is why the boundary exists to trigger a phone
 * call rather than a decision. So this example reads the clock as a reason to
 * hurry, keeps the secretions a snapshot rather than a reassurance, and refuses
 * to let the activation wait on anything. It scores nobody, excludes no mimic,
 * determines no eligibility, and selects no device, drug, dose, route, airway,
 * or anesthetic.
 */
export function basilarLvoDemonstrationStep(
  patient?: BasilarLvoProgress,
): BasilarLvoDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'He is handed on exactly as he arrived, with the owners called and the vessel still an open question. Nothing was proven and nothing was excluded — not patency, not reperfusion, not whether his airway holds. This ends the example, not the stroke.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-neurology-basilar-lvo-clock-posterior-syndrome-and-whole-patient',
      narration: 'Read ten hours as a reason to hurry, not as a door that has closed. Witnessed abrupt diplopia, vertigo, severe dysarthria and left-sided weakness ten hours ago, now drowsy but following commands, with impaired horizontal eye movements and marked ataxia. The supplied NIHSS is 14 against a prestroke Rankin of 0 — a man who was fully independent this morning. A posterior syndrome is the one that gets filed under something benign, and the clock that would settle the question elsewhere does not settle it here.' };
  }
  if (patient.imagingAtTick === null) {
    return { id: 'imaging', focus: 'monitor', progress: 0.24, action: 'review-neurology-basilar-lvo-imaging-selection-and-open-mimics',
      narration: 'Read the two imaging facts that make this a live question rather than a late one. Noncontrast CT reports no hemorrhage and a pc-ASPECTS of 8, and the CTA reports a mid-basilar occlusion. Those are selection facts, not a mechanism and not a verdict — and the authored absences of seizure, trauma, fever, hypoglycemia and intoxication are snapshots taken once, so mimics, etiology, bleeding context and deterioration all stay open.' };
  }
  if (patient.boundaryAtTick === null) {
    return { id: 'boundary', focus: 'actions', progress: 0.42, action: 'recognize-neurology-basilar-lvo-thrombectomy-escalation-boundary',
      narration: 'Name the escalation boundary as something that has already been met. The supplied boundary describes a disabling posterior deficit with a demonstrated basilar occlusion and preserved posterior tissue. Saying it out loud is what converts a set of facts into a reason to move — and it is a description of the case rather than a decision about his eligibility, which stays with the qualified teams.' };
  }
  if (patient.activationAtTick === null) {
    return { id: 'activation', focus: 'actions', progress: 0.6, action: 'activate-neurology-basilar-lvo-qualified-endovascular-and-airway-capable-ownership',
      narration: 'Call the endovascular and airway-capable owners now, and let nothing hold that call. Escalation does not wait on the thrombolysis review or on watching which way he goes: those run alongside the call rather than in front of it, and time spent waiting is the only thing here that cannot be recovered. The airway travels with it — he has a cough and handles secretions at this snapshot, and bulbar findings with fluctuating alertness are exactly the combination that stops being true without warning.' };
  }
  if (patient.laterAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-neurology-basilar-lvo-strict-later-neurologic-and-airway-trajectory',
      narration: 'Let the authored interval pass and read the qualified team’s later report. The interval is a contrast rather than a required wait, and nothing here says what any individual deficit does next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-basilar-lvo-clocks-imaging-deterioration-and-unresolved-outcome',
    narration: 'He is still drowsy, still dysarthric, still weak on the left, still coughing and handling secretions. Unchanged is not failure and not reassurance: nothing here proves the vessel is open or closed, nothing proves reperfusion or a treatment effect, and the airway is protected only as far as this snapshot goes. Hand off the clocks, the imaging, the thrombolysis review, the deterioration and airway risk, the etiology, the procedure and its complications, and the disposition.' };
}
