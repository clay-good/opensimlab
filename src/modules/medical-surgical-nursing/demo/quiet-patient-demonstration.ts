import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { QuietPatientSnapshot } from '@platform/kernel/protocol';
import { supportsQuietPatient, type QuietPatientAction } from '../quiet-patient';

export const QUIET_PATIENT_DEMONSTRATION_VERSION = '0.1.0';

export function supportsQuietPatientDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsQuietPatient(scenario);
}

export interface QuietPatientDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: QuietPatientAction; readonly finished?: boolean;
}

/**
 * The worked example for a screen that was never done.
 *
 * The example screens him while he is asleep, which is the whole move: impaired
 * arousal is a scoreable component rather than a reason to come back later, and
 * deferring is what produced three shifts without a result. It stops at a
 * positive screen and does not name the condition, because a screen identifies
 * who needs assessing rather than making the diagnosis — and the lesson is about
 * a missing result, not a missing label.
 */
export function quietPatientDemonstrationStep(patient?: QuietPatientSnapshot): QuietPatientDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'A result exists now where three shifts of impressions used to be, and the next screen has a time on it. Nothing has been diagnosed here and nothing needed to be. This ends the example, not the admission.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.impressionsReviewedAtTick === null) {
    return { id: 'impressions', focus: 'actions', progress: 0.08, action: 'review-the-charted-impression',
      narration: `Read the last three shifts for what they contain: ${patient.chartedImpressions.length} entries and ${patient.recordedScreenResults} screening results. The column looks consistent because it is agreement rather than measurement.` };
  }
  if (patient.screenedAtTick === null) {
    return { id: 'screen', focus: 'actions', progress: 0.24, action: 'screen-for-arousal',
      narration: 'Screen him now, as he is. Being slow to rouse is a scoreable component rather than a reason to come back later — and coming back later is exactly what produced three shifts without a single result.' };
  }
  if (patient.resultRecordedAtTick === null) {
    return { id: 'record', focus: 'actions', progress: 0.38, action: 'record-the-screen-result',
      narration: 'Record it as a screening result: the tool named, the time taken, and which components were positive. It goes alongside the earlier impressions rather than over them, because those are the evidence of how this happened.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.52, action: 'escalate-on-the-positive-screen',
      narration: 'Escalate on the result rather than on how he seems. A positive screen with its components is a different object from a worry, and it is the one a reviewer can act on. The three shifts of impressions go with it.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.64, action: 'review-boundaries',
      narration: 'Review what this subtype does. The hypoactive form is about half of cases in reported series and the most frequently missed, precisely because it does not ask for attention, and it is regularly read as depression or fatigue.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.74, action: 'monitor',
      narration: 'Put repeat screening on a schedule with its reason recorded. It fluctuates, so one result is a point rather than a line, and screening left to whoever notices something becomes an impression again.' };
  }
  if (!patient.reviewArrived) {
    return { id: 'await', focus: 'monitor', progress: 0.84,
      narration: 'Keep to the schedule while the review is awaited. This authored interval predicts no real response time, and a quiet stretch is not evidence either way — which is the sentence this whole lesson is about.' };
  }
  if (!patient.reviewObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.92, action: 'reassess',
      narration: 'Take a current assessment now the review has happened. The team reached the same conclusion and recorded that the preceding three shifts contain no screening result of any kind. What this example produced is a result, not a diagnosis.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the result, when the next screen is due, and what the record looked like before it. A named cause and a settled patient were never the gates.' };
}
