import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { PossibleSepsisSnapshot } from '@platform/kernel/protocol';
import { supportsPossibleSepsis, type PossibleSepsisAction } from '../possible-sepsis';

export const POSSIBLE_SEPSIS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPossibleSepsisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPossibleSepsis(scenario);
}

export interface PossibleSepsisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PossibleSepsisAction; readonly finished?: boolean;
}

/**
 * The worked example for a clock that runs either way.
 *
 * The example does not treat immediately and does not wait. It takes the
 * deferral tier the guidance actually describes — time-limited investigation
 * against a recorded ceiling, with close monitoring as the condition — and it
 * records the intent inside that ceiling. It never assigns the likelihood tier,
 * because the operational definitions separating possible from probable are not
 * supplied here, and it never rules infection in or out on one result.
 */
export function possibleSepsisDemonstrationStep(patient?: PossibleSepsisSnapshot): PossibleSepsisDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The recorded time of first suspicion travels, along with what was known when and whether the intent fell inside the ceiling. No tier was assigned and nothing was ruled out on one result. This ends the example, not the admission.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.timeZeroAtTick === null) {
    return { id: 'time-zero', focus: 'actions', progress: 0.06, action: 'record-time-zero',
      narration: 'Record the time infection was first suspected. The three hours run from that moment whether or not anyone writes it down, and recording it is what makes the ceiling visible rather than retrospective.' };
  }
  if (patient.uncertaintyAtTick === null) {
    return { id: 'uncertainty', focus: 'actions', progress: 0.16, action: 'record-uncertainty',
      narration: 'Write the uncertainty as it stands: infection cannot be excluded, there is no shock, and senior assessment is requested. That is a complete statement — a likelihood tier would be a different and less honest one.' };
  }
  if (patient.assessmentAtTick === null) {
    return { id: 'assessment', focus: 'actions', progress: 0.28, action: 'request-time-limited-assessment',
      narration: 'Request a time-limited course of rapid investigation. Time-limited is the whole of it: this is not an interval of observation, and the ceiling keeps running underneath it.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.4, action: 'review-boundaries',
      narration: 'Review why the guidance is tiered. Shock, and probable or definite sepsis without it, carry a strong recommendation to treat within the hour; the deferral tier that applies here is conditional on continuing close monitoring, which is what makes an unbounded deferral something else.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.5, action: 'monitor',
      narration: 'Set close continuous observation while the assessment runs. The tier being relied on is conditional on exactly this, and without it the deferral is no longer the one the guidance describes.' };
  }
  if (patient.immediatePathApplies && patient.antimicrobialIntentAtTick === null) {
    return { id: 'immediate', focus: 'actions', progress: 0.8, action: 'record-antimicrobial-intent',
      narration: 'The pressure has fallen and the lactate has risen further. This is no longer a possible-sepsis question and the ceiling has already passed, so record the intent now and record both of those facts with it.' };
  }
  if (!patient.investigationReturned) {
    return { id: 'observe', focus: 'monitor', progress: 0.6,
      narration: 'Keep the observation close while the investigation runs. The ceiling is visible and running, and this authored interval predicts no real turnaround time.' };
  }
  if (!patient.investigationObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.72, action: 'reassess',
      narration: 'Take a current full assessment now the investigation has returned. A returned result is not an observed patient, and no single biomarker rules infection in or out.' };
  }
  if (patient.antimicrobialIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.84, action: 'record-antimicrobial-intent',
      narration: 'Record bounded antimicrobial intent against the ceiling, inside it. The tier permitted a time-limited course of investigation rather than an open one, and this is where that course ends.' };
  }
  if ((patient.observation?.atTick ?? -1) < patient.antimicrobialIntentAtTick) {
    // Recording the intent moves the model's state, so the assessment taken
    // before it no longer describes the run. One more look, then handoff stands.
    return { id: 'recheck', focus: 'actions', progress: 0.92, action: 'reassess',
      narration: 'Reassess once more with the intent recorded. The intent changed what the record says, and the patient in front of you is what it has to be checked against.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the recorded clock with the uncertainty: the time of first suspicion, what was known when, and that the intent fell inside the ceiling. A settled tier and an identified organism were never the gates.' };
}
