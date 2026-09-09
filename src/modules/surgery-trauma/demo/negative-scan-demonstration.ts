import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { NegativeScanSnapshot } from '@platform/kernel/protocol';
import { supportsNegativeScan, type NegativeScanAction } from '../negative-scan';

export const NEGATIVE_SCAN_DEMONSTRATION_VERSION = '0.1.0';

export function supportsNegativeScanDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsNegativeScan(scenario);
}

export interface NegativeScanDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: NegativeScanAction; readonly finished?: boolean;
}

/**
 * The worked example for a scan that cannot say no.
 *
 * A demonstration is expected to arrive somewhere, and this one deliberately does not
 * arrive at a diagnosis. It ends with the leak neither confirmed nor excluded and the
 * decision sitting with the operating team, because that is the honest end of this problem
 * — and because an example that concluded "it was a leak" would teach the reflex the
 * lesson exists to refuse.
 */
export function negativeScanDemonstrationStep(
  patient?: NegativeScanSnapshot,
): NegativeScanDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The trajectory is handed on with the leak neither confirmed nor excluded and the operative decision where it belongs. Nothing was proved and nothing needed to be. This ends the example, not his admission.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.operativeCourseRecordedAtTick === null) {
    return { id: 'course', focus: 'actions', progress: 0.08, action: 'record-the-operative-course',
      narration: 'Start with the operation, not the observations. A sigmoid resection with a primary anastomosis and no diverting stoma, five days ago, predicts flatus, tolerated intake and less analgesia than yesterday. That is the thing everything else is abnormal against.' };
  }
  if (patient.progressRecordedAtTick === null) {
    return { id: 'progress', focus: 'actions', progress: 0.20, action: 'record-the-failure-to-progress',
      narration: 'Record the divergence with its duration. No flatus, not eating, more analgesia, and 36 hours above 100 — one finding, not four. Taken singly each is close to routine after bowel resection, with a positive predictive value of 4 to 11 percent. Taken together, over a day and a half, they say he has stopped following his own course.' };
  }
  if (patient.scanLimitsRecordedAtTick === null) {
    return { id: 'limits', focus: 'actions', progress: 0.32, action: 'record-what-the-scan-excludes',
      narration: 'Now the scan, written down as what it actually says. No evidence of a leak is not the same sentence as no leak. Published negative predictive values are 0.70 in one series and 88 percent in another, and the free fluid and free gas it reports fit both day five and a leak.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.44, action: 'escalate-to-the-operating-team',
      narration: 'Ring the team that made the anastomosis. Not radiology, and not for permission. State the operation, the course he has stopped following, and that the investigation could not exclude what you are worried about.' };
  }
  if (patient.surgicalIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.56, action: 'record-bounded-surgical-intent',
      narration: 'Record bounded intent and choose nothing. Re-imaging, looking directly, and any return to theatre are theirs. A decision to reoperate on this presentation is clinical, and no scan result grants or withholds it.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.66, action: 'review-boundaries',
      narration: 'Review what none of this settles. Three single-centre studies, small numerators, and the two imaging series disagreeing with each other by fourteen points on sensitivity. They give the shape of the problem, not a probability for this abdomen.' };
  }
  if (!patient.roundCompleted) {
    return { id: 'observe', focus: 'monitor', progress: 0.76,
      narration: 'Watch the interval rather than the monitor. The call is already made, so this authored gap is a contrast rather than a clinical wait. What is worth noticing is how little happens.' };
  }
  if (!patient.teamResponded) {
    return { id: 'hold', focus: 'monitor', progress: 0.86,
      narration: 'The observations are repeated and unchanged. He has vomited once and still has not passed flatus. That is not reassurance and it is not deterioration — it is the same divergence, one round longer. This patient was never going to make the decision for anybody.' };
  }
  if (!patient.teamObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.93, action: 'reassess',
      narration: 'Take a current assessment now they have answered and confirmed the anastomosis from their own record. They own the re-imaging and the theatre decision, and both are made on the current picture rather than the one from before the call.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the trajectory rather than the numbers. A confirmed leak, a repeat scan and a decision about theatre are not handoff gates. What travels is the operation, the course he stopped following, and what the report could not rule out.' };
}
