import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { CountedRateSnapshot } from '@platform/kernel/protocol';
import { supportsCountedRate, type CountedRateAction } from '../counted-rate';

export const COUNTED_RATE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsCountedRateDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsCountedRate(scenario);
}

export interface CountedRateDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: CountedRateAction; readonly finished?: boolean;
}

/**
 * The worked example for a column of numbers nobody counted.
 *
 * The tidy ending here would be a corrected chart, and the example refuses it.
 * The earlier entries are somebody else's observation and they stay exactly as
 * written, because they are the only evidence that the trend was unreliable.
 * The example also never explains the rate: no cause is available in this
 * lesson, and inventing one is the same error in the other direction.
 */
export function countedRateDemonstrationStep(patient?: CountedRateSnapshot): CountedRateDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The column travels exactly as it was written, next to a rate somebody counted. Nothing was corrected and nothing was explained. This ends the example, not the admission.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.trendReviewedAtTick === null) {
    return { id: 'trend', focus: 'actions', progress: 0.08, action: 'review-the-charted-trend',
      narration: 'Read the charted column first, and read it as a distribution. Six entries across the night take two distinct values, 18 and 20. As a trend that is a stable patient. As a distribution it is what estimation looks like when it is written down.' };
  }
  if (patient.countedAtTick === null) {
    return { id: 'count', focus: 'actions', progress: 0.22, action: 'count-for-a-full-minute',
      narration: 'Count it yourself for a full sixty seconds: 28. Nothing else about her has changed and no other observation is new. The difference between this number and the column above it is not a change in the patient.' };
  }
  if (patient.discrepancyRecordedAtTick === null) {
    return { id: 'discrepancy', focus: 'actions', progress: 0.36, action: 'record-the-discrepancy',
      narration: 'Record both numbers and leave them unreconciled. The earlier entries stay as they were written, because they belong to whoever wrote them and because altering them would destroy the only evidence that the trend was unreliable. The discrepancy is the finding.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.5, action: 'escalate-on-the-counted-value',
      narration: 'Escalate on the counted rate, and give the charted column with it. The reviewer needs to know that the record they are about to open does not show this.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.62, action: 'review-boundaries',
      narration: 'Review what the rate is and is not. It is the strongest single predictor among the routine observations and the least reliably measured; a rising rate precedes desaturation, so her normal saturation does not make it redundant. Whether a monitor-derived rate is equivalent to a counted one is not established, and this lesson does not claim it either way.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.72, action: 'monitor',
      narration: 'Shorten the interval, and record that each rate is counted for a full minute rather than estimated. A shorter interval filled with estimates measures nothing new.' };
  }
  if (!patient.reviewArrived) {
    return { id: 'await', focus: 'monitor', progress: 0.82,
      narration: 'Keep counting while the review is awaited. This authored delay predicts no real response time, and the charted column will not move, because it records what was written rather than what is happening.' };
  }
  if (!patient.reviewObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.9, action: 'reassess',
      narration: 'Take a current assessment now the review has happened. The team counted independently and reached the same number, and recorded that the chart gave no indication of it. No cause has been established here and none is claimed.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the column as written, the counted rate beside it, the discrepancy recorded rather than resolved, and that the call was made on the number somebody counted. A corrected chart and an explained cause were never the gates.' };
}
