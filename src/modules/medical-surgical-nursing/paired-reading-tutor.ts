import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { PairedReadingSnapshot } from '@platform/kernel/protocol';

export const PAIRED_READING_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a device error that runs one way.
 *
 * Every instinct at this bedside is a perfusion instinct: reposition the probe,
 * warm the hand, try another finger. The discrepancy here is optical, so none of
 * those corrects it, and a tutor that suggested one would be sending the learner
 * to do something that cannot work while the arterial value sits unread. The
 * prompts also stop short of two claims the evidence does not carry: that the
 * oximeter is broken, and that this patient's condition has a name. Neither is
 * available here.
 */
export function pairedReadingInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly pairedReading?: PairedReadingSnapshot;
}) {
  const patient = input.pairedReading;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.oximeterRecordedAtTick === null) return prompt('paired-reading-oximeter', true,
    'Record it as an oximeter reading rather than as the saturation.',
    'The two are not the same claim, and only one of them is what you have. Writing down which one you have is what makes the later pair readable.');
  if (patient.boundariesReviewedAtTick === null) return prompt('paired-reading-boundaries', true,
    'Review what this measurement can and cannot do.',
    'The error is optical rather than a perfusion artifact, so repositioning the probe, warming the hand, or moving to another digit does not correct it. It also runs in one direction: toward reassurance.');
  if (patient.monitoringAtTick === null) return prompt('paired-reading-monitor', true,
    'Watch the breathing itself, in words, not through the device.',
    'Respiratory rate counted and work of breathing described do not depend on the reading in question. Where the arterial value is the one being acted on, the record should say so explicitly.');
  if (!patient.gasReturned) return prompt('paired-reading-await', false,
    'Continue observing while the arterial result is awaited.',
    'There is only one number so far, and pairing needs both from the same minute. This authored delay predicts no real turnaround time.');
  if (patient.pairedAtTick === null) return prompt('paired-reading-pair', true,
    'Record both values together, with the time they were taken.',
    'A pair from the same minute in the same patient is the whole evidence. Apart, each is arguable; together they are a measured discrepancy.');
  if (patient.gapExplainedAtTick === null) return prompt('paired-reading-gap', true,
    'Record what this gap is not.',
    'Not a poor trace, a cold hand, nail covering, motion, or a malpositioned probe — the trace was good and the reading steady. Naming the excluded explanations is what stops the next person repeating them.');
  if (patient.escalationAtTick === null) return prompt('paired-reading-escalate', true,
    'Escalate on the arterial value, with the oximeter reading labelled beside it.',
    'Escalating on the oximeter number would be escalating on the number in question. The reviewer needs both, and needs to know which is which.');
  if (!patient.reviewArrived) return prompt('paired-reading-observe', false,
    'Keep the observation going while the review is awaited.',
    'The oximeter will keep reading what it reads. That is the limitation rather than a fault developing, and nothing about it will announce itself at the bedside.');
  if (!patient.reviewObserved) return prompt('paired-reading-reassess', true,
    'Take a current full assessment now the review has happened.',
    'What is worth carrying is the pair and the direction of the error, not a corrected device or a settled diagnosis. Neither is available here.');
  return prompt('paired-reading-handoff', false,
    'Hand off the pair and the direction the error runs.',
    'A normal-looking oximeter reading is not a handoff gate, and neither is an explanation. What travels is both values from the same minute, what the gap is not, and that the call was made on the arterial one.');
}
