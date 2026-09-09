import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { TransientResponseSnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link built from a
 * citation is a guess rather than a lookup. The tray already sends a reader to the source view.
 */

/**
 * Observed-state guidance for a pressure that keeps answering and keeps falling.
 *
 * The prompts never name an injury and never say what the operation will find, because nothing
 * in the lesson can establish either. They keep pointing at the shape of the response and at
 * the clock, which are the only two things a learner in this room actually has.
 */
export function transientResponseInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly transientResponse?: TransientResponseSnapshot;
}) {
  const patient = input.transientResponse;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.mechanismRecordedAtTick === null) return prompt('transient-response-mechanism', true,
    'Write the mechanism down with the clock still running on it.',
    `Front of the car into a barrier, ${patient.minutesSinceInjury} minutes ago, tender abdomen, free fluid already reported. The minutes are the one quantity in this room nobody can put back, so they belong in the record as a number that moves.`);
  if (patient.responseRecordedAtTick === null) return prompt('transient-response-shape', true,
    'Record what his pressure did, not what it is.',
    `${patient.bolusCount} boluses. The first held ${patient.firstResponseHeldMinutes} minutes, the second ${patient.secondResponseHeldMinutes}. Each answer smaller, each one sooner. Any single reading out of that pattern reads as a patient who is fine.`);
  if (patient.imagingLimitsRecordedAtTick === null) return prompt('transient-response-picture', true,
    'Record what a picture can and cannot do here — both halves.',
    'Early whole-body imaging was associated with better survival across 4,621 registry patients, so this is not an argument against scanning. It is an argument about a patient who will not stay up long enough to lie still in one, for a site free fluid has already made likely.');
  if (patient.escalationAtTick === null) return prompt('transient-response-escalate', true,
    'Call the team that can stop it. Now, not after something.',
    'Not a scan, not another bolus, not the cross-match. Each of those is an interval, and the studies about this measure the harm in single minutes.');
  if (patient.operativeIntentAtTick === null) return prompt('transient-response-intent', true,
    'Record bounded intent and choose nothing.',
    'The transfer, whether any imaging happens on the way or not at all, and the operation with its timing and content are theirs. Writing down that those decisions exist is not making them.');
  if (patient.boundariesReviewedAtTick === null) return prompt('transient-response-boundaries', true,
    'Review three retrospective studies that disagree.',
    'Up to 0.35 percent a minute in one; a hazard ratio of 1.89 past ten minutes in another, which that paper calls almost threefold; and better survival with early imaging in a third. None is randomised and none is a stopwatch.');
  if (!patient.fallen) return prompt('transient-response-hold', false,
    'Watch the interval rather than the number.',
    'Nothing new is going to arrive to make this decision for you. The next thing that happens is the pressure going down again, and it will happen whether or not anybody has called.');
  if (!patient.teamResponded) return prompt('transient-response-fallen', true,
    'It fell again. Say what the interval did.',
    'Third fall, five minutes after a second that lasted nine, with nothing taken away. That is the pattern completing itself, and it is exactly what you already recorded.');
  if (!patient.teamObserved) return prompt('transient-response-reassess', true,
    'Take a current assessment now they have answered.',
    'Yours predates their reply and the third fall. They own the transfer, the imaging question and the operation, and all three are decided against the current picture.');
  return prompt('transient-response-handoff', false,
    'Hand off a decision that already exists, with its clock attached.',
    'A named injury, a completed scan and cross-matched blood are not handoff gates. What travels is the mechanism with the minutes on it, the shape of the response, and that nobody waited.');
}
