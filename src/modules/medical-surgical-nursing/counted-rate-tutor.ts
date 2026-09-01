import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { CountedRateSnapshot } from '@platform/kernel/protocol';

export const COUNTED_RATE_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a column of numbers nobody counted.
 *
 * The temptation here is to treat the chart as the adversary and fix it. The
 * earlier entries are somebody else's observation, and rewriting them destroys
 * the only evidence that the trend was unreliable — so the prompts hold the
 * discrepancy open rather than closing it, and never ask for the record to be
 * corrected. They also stop short of explaining the rate: this lesson supplies
 * no cause, and a tutor that guessed one would be answering a question the
 * scenario deliberately leaves to the review.
 */
export function countedRateInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly countedRate?: CountedRateSnapshot;
}) {
  const patient = input.countedRate;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trendReviewedAtTick === null) return prompt('counted-rate-trend', true,
    'Read the charted column as a distribution, not as a trend.',
    'Six entries taking two distinct values is what estimation looks like once it is written down. As a trend it says stable; as a distribution it says nobody counted.');
  if (patient.countedAtTick === null) return prompt('counted-rate-count', true,
    'Count the rate yourself, for a full sixty seconds.',
    'It is the strongest single predictor among the routine observations and the one most often estimated. Nothing else here will tell you whether the column is a record of the patient or of the process.');
  if (patient.discrepancyRecordedAtTick === null) return prompt('counted-rate-discrepancy', true,
    'Record both numbers, and do not reconcile them.',
    'The gap between them is the finding. Leaving the earlier entries as written is what preserves the evidence that the trend was unreliable, and it is the only reason anyone reading later can see it.');
  if (patient.escalationAtTick === null) return prompt('counted-rate-escalate', true,
    'Escalate on the counted value, and hand over the chart as it stands.',
    'The reviewer needs both: the number you counted, and the fact that the record they are about to open does not show it.');
  if (patient.boundariesReviewedAtTick === null) return prompt('counted-rate-boundaries', true,
    'Review what the rate is and is not.',
    'A rising rate precedes desaturation, so a normal saturation does not make it redundant. Whether a monitor-derived rate is equivalent to a counted one is not established in the retrievable evidence, and this lesson does not settle it either way.');
  if (patient.monitoringAtTick === null) return prompt('counted-rate-monitor', true,
    'Shorten the interval, and record that each rate is counted.',
    'A shorter interval filled with estimates measures nothing new. The method belongs in the record beside the frequency.');
  if (!patient.reviewArrived) return prompt('counted-rate-await', false,
    'Keep counting while the review is awaited.',
    'This authored delay predicts no real response time. The charted column will not change, because it is a record of what was written rather than of what is happening.');
  if (!patient.reviewObserved) return prompt('counted-rate-reassess', true,
    'Take a current full assessment now the review has happened.',
    'The independent count is the part worth carrying: it reached the same number, and the chart still showed nothing.');
  return prompt('counted-rate-handoff', false,
    'Hand off the discrepancy rather than a corrected chart.',
    'An explained cause and a tidy record are not handoff gates. What travels is the column as written, the counted rate, and that the call was made on the one that was counted.');
}
