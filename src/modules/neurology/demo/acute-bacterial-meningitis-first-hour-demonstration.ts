import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMeningitis, type MeningitisAction, type MeningitisProgress,
} from '../acute-bacterial-meningitis-first-hour';

export const MENINGITIS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMeningitisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMeningitis(scenario);
}

export interface MeningitisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MeningitisAction; readonly finished?: boolean;
}

/**
 * The worked example for an hour that gets spent on the wrong things.
 *
 * Everything here is decided by what happens in parallel rather than in
 * sequence. She is alert, oriented and nonfocal, which is precisely the state
 * in which a lumbar puncture does not wait for routine imaging — the scan is
 * for the features she does not have. So this example gets the owners and the
 * precautions moving before working the diagnostic question, ties the imaging
 * decision to the list that would actually justify it, and puts the empiric
 * pathway on a track no test can hold up. It performs no lumbar puncture,
 * interprets no CSF, and chooses no regimen, dose, route, or fluid.
 */
export function meningitisDemonstrationStep(
  patient?: MeningitisProgress,
): MeningitisDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on treated, tapped and still without an organism named. Nothing was proven and nothing was excluded — not the pathogen, not the definitive regimen, not what her hearing does. This ends the example, not the illness.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-neurology-meningitis-clock-meningeal-infection-neurologic-and-whole-patient',
      narration: 'Say how fast this arrived, and say what she still has intact. Fourteen hours of worsening headache and fever, then six hours of photophobia, repeated vomiting and painful neck movement, at 39.3°C with a heart rate of 118. And she is GCS 15, oriented in four domains, with clear speech, equal reactive pupils, a symmetric examination and no rash. Both halves matter: the first says how little time there is, and the second is what makes the next few minutes simple rather than complicated.' };
  }
  if (patient.ownershipAtTick === null) {
    return { id: 'ownership', focus: 'actions', progress: 0.26, action: 'activate-neurology-meningitis-qualified-time-critical-infection-neurologic-resuscitation-and-precaution-ownership',
      narration: 'Turn this into a service before turning it into a puzzle. One clinician thinking carefully is the slowest possible version of this hour. Qualified infection, neurological, resuscitation and nursing ownership, plus locally appropriate precautions, all start now — precautions included, because they protect the people around her and stop being retrofittable the moment she is moved. The diagnostic question is worth working, and it is worth working with the team already assembled.' };
  }
  if (patient.diagnosticsAtTick === null) {
    return { id: 'diagnostics', focus: 'monitor', progress: 0.46, action: 'review-neurology-meningitis-lp-safety-no-routine-imaging-and-parallel-diagnostic-boundary',
      narration: 'Check the list that would justify a scan, and notice she is not on it. Routine pre-puncture imaging is for altered consciousness, focal deficit, abnormal pupils, posturing, uncontrolled seizure, bleeding risk, extensive purpura, severe immunocompromise or rapid decline — and this supplied state has none of them, which is what supports a prompt qualified lumbar puncture here. That is a judgement about this minute rather than a permanent clearance, and continuous reassessment can reopen it. Meanwhile no blood marker settles the question: the leukocytes, the CRP and the procalcitonin are consistent with bacterial meningitis and exclude nothing.' };
  }
  if (patient.treatmentAtTick === null) {
    return { id: 'treatment', focus: 'actions', progress: 0.64, action: 'activate-neurology-meningitis-qualified-early-empiric-antimicrobial-and-adjunct-pathway-without-diagnostic-delay',
      narration: 'Put the empiric pathway on a track that no test can hold up. Early qualified intravenous antimicrobial and adjunctive treatment runs through the local pathway, and the point of activating it now is that neither the tap nor the imaging nor the cultures is allowed to delay it. No regimen, dose or route is chosen here — what is being decided is only that the treatment clock and the diagnostic clock run alongside each other rather than one behind the other.' };
  }
  if (patient.laterAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.82, action: 'review-neurology-meningitis-strict-later-csf-clinical-and-supplied-treatment-trajectory',
      narration: 'Let the authored interval pass and read the qualified team’s 45-minute report. The interval is a contrast rather than a required wait, and nothing here says what any individual patient does next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-meningitis-organism-treatment-complication-public-health-hearing-and-active-risk',
    narration: 'Cloudy fluid, an opening pressure of 29, 2,200 white cells at 91% neutrophils, protein 190, a glucose ratio of 0.27 and a lactate of 5.2 — and a Gram stain showing abundant white cells and no organism, with culture, susceptibility and PCR still pending. A negative Gram stain narrows nothing, and empiric treatment was given before any of this returned, which is the shape the hour was supposed to have. Hand off the organism, the definitive regimen, the complications, the public-health duties and the hearing follow-up.' };
}
