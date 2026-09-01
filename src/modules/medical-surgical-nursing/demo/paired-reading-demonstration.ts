import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { PairedReadingSnapshot } from '@platform/kernel/protocol';
import { supportsPairedReading, type PairedReadingAction } from '../paired-reading';

export const PAIRED_READING_DEMONSTRATION_VERSION = '0.1.0';

export function supportsPairedReadingDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsPairedReading(scenario);
}

export interface PairedReadingDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: PairedReadingAction; readonly finished?: boolean;
}

/**
 * The worked example for a device error that runs one way.
 *
 * The demonstration form is a hazard here, because the obvious way to fill the
 * wait before the arterial result is to do something to the probe. Every one of
 * those actions is refused by the lesson and none of them would work, so this
 * example does not perform one: it records the reading for what it is, bounds
 * the measurement, watches the breathing directly, and waits. It also never
 * calls the oximeter faulty, and never names what is wrong with the patient.
 */
export function pairedReadingDemonstrationStep(patient?: PairedReadingSnapshot): PairedReadingDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'Both numbers travel together with the minute they were taken, and so does the direction the error runs. The device was never repositioned and never called faulty. This ends the example, not the admission.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.oximeterRecordedAtTick === null) {
    return { id: 'oximeter', focus: 'actions', progress: 0.08, action: 'record-the-oximeter-reading',
      narration: 'Record it as an oximeter reading rather than as the saturation: 94 percent on room air, good trace, respiratory rate 24. Those are two different claims and only one of them is what you have.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.2, action: 'review-boundaries',
      narration: 'Review what the measurement can do. The discrepancy is optical rather than a perfusion artifact, so repositioning the probe, warming the hand, or changing digits does not correct it — and the error runs one way, toward reassurance.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.3, action: 'monitor',
      narration: 'Watch the breathing itself. The rate counted and the work of breathing described in words do not depend on the number that is in question.' };
  }
  if (!patient.gasReturned) {
    return { id: 'await', focus: 'monitor', progress: 0.42,
      narration: 'Wait for the arterial result rather than filling the time at the probe. There is only one number so far, and pairing needs both from the same minute. This authored delay predicts no real turnaround time.' };
  }
  if (patient.pairedAtTick === null) {
    return { id: 'pair', focus: 'actions', progress: 0.56, action: 'record-the-paired-values',
      narration: 'Record both together with the time: oximeter 94 percent, arterial 86 percent, same minute, same patient. Apart, each number is arguable. Together they are a measured discrepancy.' };
  }
  if (patient.gapExplainedAtTick === null) {
    return { id: 'gap', focus: 'actions', progress: 0.66, action: 'record-what-the-gap-is-not',
      narration: 'Record what the gap is not: not a poor trace, a cold hand, nail covering, motion, or a malpositioned probe. The trace was good and the reading steady. Naming the excluded explanations is what stops the next person working through them again.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.78, action: 'escalate-on-the-arterial-value',
      narration: 'Escalate on the arterial value of 86 percent, with the oximeter reading given alongside and labelled as one. Escalating on the oximeter number would be escalating on the number in question.' };
  }
  if (!patient.reviewObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.9, action: 'reassess',
      narration: 'Take a current assessment. What is carried forward is the pair and the direction of the error. No device fault has been demonstrated and no diagnosis has been made here.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off both values from the same minute, what the gap is not, and that the call was made on the arterial one. A reassuring oximeter reading was never the gate, and neither was an explanation.' };
}
