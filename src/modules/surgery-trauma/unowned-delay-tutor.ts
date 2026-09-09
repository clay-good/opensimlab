import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { UnownedDelaySnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link built from a
 * citation is a guess rather than a lookup. The tray already sends a reader to the source view.
 */

/**
 * Observed-state guidance for a wait that nobody decided.
 *
 * The prompts never say the delay has harmed her, because nothing in the lesson can establish
 * that and the randomised evidence would not support it if it tried. They point instead at the
 * only thing that is unambiguously true and unambiguously fixable: nobody owns the wait.
 */
export function unownedDelayInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly unownedDelay?: UnownedDelaySnapshot;
}) {
  const patient = input.unownedDelay;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.fractureRecordedAtTick === null) return prompt('unowned-delay-fracture', true,
    'Write the total down, in hours.',
    `${patient.hoursSinceAdmission} hours, ${patient.cancellations} cancellations, ${patient.fastedHours} hours fasted, and nobody disputing that she needs the operation. Nobody has ever seen that sentence, because each piece of it happened to a different person on a different shift.`);
  if (patient.delayReasonsRecordedAtTick === null) return prompt('unowned-delay-reasons', true,
    'Take each delay in turn and write down who asked.',
    'A scan for a murmur that is in no examination entry. A review by nobody named. A list nobody rebooked her from. Each had a reason at the time; not one has an author, which is why the total belongs to nobody.');
  if (patient.pendingRecordedAtTick === null) return prompt('unowned-delay-pending', true,
    'Separate what is outstanding from what is merely still written down.',
    'The echocardiogram is not booked and nobody has said what it would change. No medical question is documented. What is left is a slot — and a slot and a scan are fixed by two different telephone calls.');
  if (patient.escalationAtTick === null) return prompt('unowned-delay-escalate', true,
    'Give the wait an owner. Ask for a name, not for concern.',
    'A named slot with a named consultant. General escalation produces sympathy; a name produces a place on a list, and the person holding that list has not been told any of this.');
  if (patient.schedulingIntentAtTick === null) return prompt('unowned-delay-intent', true,
    'Record bounded intent and arrange nothing.',
    'The order of the list, whatever preoperative testing they actually want, the anaesthetic assessment and the fasting instruction are theirs. Writing down that those decisions exist is not making them.');
  if (patient.boundariesReviewedAtTick === null) return prompt('unowned-delay-boundaries', true,
    'Review evidence that contradicts itself, and say what survives.',
    'Two observational bodies find delay associated with death; a randomised trial that moved the median from 24 hours to 6 found nothing. What survives is not a target. It is that a wait with no author is not a plan.');
  if (!patient.listLost) return prompt('unowned-delay-hold', false,
    'Notice what will move and what will not.',
    'Her pulse and her pressure are what they were on admission and will stay there. The only number in this case that changes is the clock, and it changes whether or not anybody is watching it.');
  if (!patient.teamResponded) return prompt('unowned-delay-list', true,
    'The evening has gone. Add it to the total rather than to tonight.',
    'Third cancellation, nineteen fasted hours, tomorrow is day three. Recorded as a total it is a different conversation from "she was bumped again", which is the conversation that produced the first two.');
  if (!patient.teamObserved) return prompt('unowned-delay-reassess', true,
    'Take a current assessment now they have answered.',
    'Yours predates their reply and the lost evening. They have her against a named slot and own the scheduling and the fasting, and both are decided against the current picture.');
  return prompt('unowned-delay-handoff', false,
    'Hand off a wait that now has an author.',
    'A completed scan, a confirmed slot and a theatre time are not handoff gates. What travels is the total in hours, each delay with its missing author, and the name of the person who now holds it.');
}
