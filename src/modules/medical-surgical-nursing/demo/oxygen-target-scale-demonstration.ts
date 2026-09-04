import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { OxygenTargetScaleSnapshot } from '@platform/kernel/protocol';
import { supportsOxygenTargetScale, type OxygenTargetScaleAction } from '../oxygen-target-scale';

export const OXYGEN_TARGET_SCALE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsOxygenTargetScaleDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsOxygenTargetScale(scenario);
}

export interface OxygenTargetScaleDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: OxygenTargetScaleAction; readonly finished?: boolean;
}

/**
 * The worked example for a score compared with the wrong range.
 *
 * The harm in this lesson arrives as a helpful offer: a colleague reads the
 * score off the chart and suggests putting some oxygen on her. The example
 * never touches the oxygen and never names a flow, and it answers that offer
 * with the prescribed range rather than with a number. It also refuses the
 * reassuring reading in the other direction — the corrected score is not an
 * improvement, because nothing about her changed in that minute.
 */
export function oxygenTargetScaleDemonstrationStep(patient?: OxygenTargetScaleSnapshot): OxygenTargetScaleDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'What travels is the scale she is prescribed, what she scored on it, and that the chart had been comparing her with somebody else’s range. No oxygen was selected, set, or delivered at any point. This ends the example, not her admission.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.prescriptionCheckedAtTick === null) {
    return { id: 'prescription', focus: 'actions', progress: 0.06, action: 'check-the-prescription',
      narration: `Read the prescription before the chart. The range prescribed for her is ${patient.prescribedTargetRange}, and the decision to score her on that scale is documented. Everything after this depends on which range she is being compared with.` };
  }
  if (patient.chartCheckedAtTick === null) {
    return { id: 'chart', focus: 'actions', progress: 0.16, action: 'check-the-chart',
      narration: `Now read the chart and note which scale it was scored on. ${patient.saturationPercent}% breathing air, scored on scale ${patient.chartedScale}, giving ${patient.chartedScore}. A mismatch is a statement about two documents, and now you have read both.` };
  }
  if (patient.mismatchRecordedAtTick === null) {
    return { id: 'mismatch', focus: 'actions', progress: 0.28, action: 'record-the-scale-mismatch',
      narration: `Record that the two disagree before changing anything: prescribed on scale ${patient.prescribedScale}, charted on scale ${patient.chartedScale}, running side by side. Recording it first is what leaves a trace of why the number is about to move.` };
  }
  if (patient.rescoredAtTick === null) {
    return { id: 'rescore', focus: 'actions', progress: 0.4, action: 'rescore-on-the-prescribed-scale',
      narration: `Rescore on the prescribed scale: ${patient.saturationPercent}% breathing air scores ${patient.prescribedScaleScore} rather than ${patient.chartedScore}. The saturation has not moved, and neither has she.` };
  }
  if (patient.consequencesRecordedAtTick === null) {
    return { id: 'consequences', focus: 'actions', progress: 0.5, action: 'record-what-the-rescore-changes',
      narration: 'Record what changed and what did not. The score changed; she did not. And a score of zero on the correct scale is not a statement that she is well — it says she is where she was prescribed to be.' };
  }
  if (patient.confirmationAtTick === null) {
    return { id: 'confirm', focus: 'actions', progress: 0.62, action: 'confirm-the-scale-with-the-team',
      narration: 'Take the recorded mismatch and the recalculated score to the qualified team. With both attached this is a confirmation request; without them it is a question about which chart to use.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.72, action: 'review-boundaries',
      narration: 'Review what puts a patient on the second scale: hypercapnic respiratory failure confirmed on blood gas, a prescribed lower range, and a documented decision. A diagnosis on its own does not do it.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.8, action: 'monitor',
      narration: 'Keep the observation frequency where her condition sets it. A corrected score is not a reason to look at her less often, because what changed was the comparison rather than the patient.' };
  }
  if (!patient.reviewArrived) {
    return { id: patient.colleagueAskedToRaiseOxygen ? 'colleague' : 'await', focus: 'monitor', progress: 0.88,
      narration: patient.colleagueAskedToRaiseOxygen
        ? `A colleague reads the old score and offers to put some oxygen on her. This is the harm the guideline names, and it arrives as help rather than as a mistake. The answer is the range, not the number: she is inside ${patient.prescribedTargetRange} at ${patient.saturationPercent}%, and nothing here selects, sets, or delivers oxygen.`
        : 'Continue observing while the confirmation is awaited. This authored interval predicts no real response time, and the chart is already recording her against the right range.' };
  }
  if (!patient.reviewObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.93, action: 'reassess',
      narration: 'Take a current assessment now the team has confirmed it. They confirm the scale and the range, record that the unused section should have been crossed out, and note that a zero on the correct scale is still not a statement that she is well.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the scale, the range, and why the number changed. A better-looking score was never the gate, and the number that prompted an offer of oxygen was the one comparing her with a range she is not prescribed.' };
}
