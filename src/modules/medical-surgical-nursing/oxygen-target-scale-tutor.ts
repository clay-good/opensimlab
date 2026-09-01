import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { OxygenTargetScaleSnapshot } from '@platform/kernel/protocol';

export const OXYGEN_TARGET_SCALE_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a score compared with the wrong range.
 *
 * The dangerous move here arrives as a helpful one: the chart says a number is
 * high, and the obvious way to fix a saturation is to raise it. No prompt ever
 * suggests touching the oxygen, and none selects, sets, or implies a flow. They
 * also refuse the reassuring reading in the other direction — the corrected
 * score is not an improvement, because nothing about her changed in that minute
 * — and they never let the diagnosis choose the scale, which requires a blood
 * gas and a documented decision rather than a label.
 */
export function oxygenTargetScaleInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly oxygenTargetScale?: OxygenTargetScaleSnapshot;
}) {
  const patient = input.oxygenTargetScale;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.prescriptionCheckedAtTick === null) return prompt('oxygen-target-prescription', true,
    'Read the prescription before the chart.',
    `The range prescribed for her is ${patient.prescribedTargetRange}, and the decision to use that scale is documented. Everything after this depends on which range she is being compared with.`);
  if (patient.chartCheckedAtTick === null) return prompt('oxygen-target-chart', true,
    'Now read the chart, and note which scale it was scored on.',
    'A mismatch is a statement about two documents. You have read one of them.');
  if (patient.mismatchRecordedAtTick === null) return prompt('oxygen-target-mismatch', true,
    'Record that the two disagree, before changing anything.',
    `The prescription says scale ${patient.prescribedScale} and the chart is scored on scale ${patient.chartedScale}. Recording it first is what leaves a trace of why the number moved.`);
  if (patient.rescoredAtTick === null) return prompt('oxygen-target-rescore', true,
    'Rescore on the prescribed scale.',
    `${patient.saturationPercent}% breathing air scores ${patient.prescribedScaleScore} rather than ${patient.chartedScore}, because that is where she is meant to be. The saturation has not moved.`);
  if (patient.consequencesRecordedAtTick === null) return prompt('oxygen-target-consequences', true,
    'Record what the rescore changes, and what it does not.',
    'The score changed and nothing else did. She is the same, the saturation is the same, and a score of zero on the correct scale is not a statement that she is well.');
  if (patient.confirmationAtTick === null) return prompt('oxygen-target-confirm', true,
    'Take the mismatch and the recalculated score to the team.',
    'With both attached, it is a confirmation request. Without them it is a question about which chart to use, which is a different and much weaker thing to ask.');
  if (patient.boundariesReviewedAtTick === null) return prompt('oxygen-target-boundaries', true,
    'Review what puts a patient on the second scale.',
    'Hypercapnic respiratory failure confirmed on blood gas, with a prescribed lower range and a documented decision. A diagnosis on its own does not do it, and neither does an assumption at the bedside.');
  if (patient.monitoringAtTick === null) return prompt('oxygen-target-monitor', true,
    'Keep the observation frequency where her condition sets it.',
    'The corrected score is not a reason to observe her less often. What changed was the comparison, not the patient.');
  if (patient.colleagueAskedToRaiseOxygen && !patient.reviewArrived) return prompt('oxygen-target-colleague', true,
    'Answer the offer of oxygen with the range, not the score.',
    `She is inside ${patient.prescribedTargetRange} at ${patient.saturationPercent}%. The score that prompted the offer was the one comparing her with a range she is not prescribed, and raising the oxygen would be treating a chart.`);
  if (!patient.reviewArrived) return prompt('oxygen-target-await', false,
    'Continue observing while the confirmation is awaited.',
    'This authored interval predicts no real response time, and the chart is already recording her against the right range.');
  if (!patient.reviewObserved) return prompt('oxygen-target-reassess', true,
    'Take a current assessment now the team has confirmed it.',
    'They confirm the scale, the range, and that the unused section should have been crossed out — and that a zero on the correct scale still is not a statement that she is well.');
  return prompt('oxygen-target-handoff', false,
    'Hand off the scale, the range, and why the number changed.',
    'A better score is not a handoff gate. What travels is which scale she is prescribed, what she scored on it, and that the chart had been comparing her with somebody else’s range.');
}
