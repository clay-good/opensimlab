import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { DeferredStepSnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link built from a
 * citation is a guess rather than a lookup. The tray already sends a reader to the source view.
 */

/**
 * Observed-state guidance for a step attached to somebody's arrival.
 *
 * The prompts never name an agent or a dose, never say she will become infected, and never
 * blame the registrar in theatre. The finding is the attachment, and a learner who leaves
 * believing the answer is to be cross with orthopaedics has learned the wrong thing.
 */
export function deferredStepInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly deferredStep?: DeferredStepSnapshot;
}) {
  const patient = input.deferredStep;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.injuryRecordedAtTick === null) return prompt('deferred-step-injury', true,
    'Write the injury down against the right clock.',
    `${patient.minutesSinceInjury} minutes since the injury, ${patient.minutesSinceArrival} since she arrived. The published thresholds are measured from the injury, and using the wrong clock hands you nineteen minutes you do not have.`);
  if (patient.pendingStepRecordedAtTick === null) return prompt('deferred-step-pending', true,
    'Record the step that has not happened.',
    'No antibiotic. Nobody decided against one, no allergy, no contraindication, no disagreement anywhere. A step everybody agrees with and nobody has taken is invisible until it is written down as outstanding.');
  if (patient.attachmentRecordedAtTick === null) return prompt('deferred-step-attachment', true,
    'Record what the interval is attached to.',
    'The board ties it to the review, and the review is tied to a registrar in theatre. That is a timed step waiting on a person becoming free — and nobody in that sentence has done anything wrong.');
  if (patient.escalationAtTick === null) return prompt('deferred-step-escalate', true,
    'Ask for a decision, not a visit.',
    'Injury, time of it, no documented allergy, does this wait for your review. That is a telephone call. Nothing about the wound will be clearer when somebody walks in.');
  if (patient.prescribingIntentAtTick === null) return prompt('deferred-step-intent', true,
    'Record bounded intent and choose nothing.',
    'Whether anything is given, which, how much and by what route, the dressing, and the debridement and its timing are theirs. Writing down that those decisions exist is not making them.');
  if (patient.boundariesReviewedAtTick === null) return prompt('deferred-step-boundaries', true,
    'Review two thresholds that do not agree, measured from two different moments.',
    'Sixty-six minutes from injury in one series; a hundred and twenty from arrival in another, whose own median comparison missed significance. Both retrospective. There is no stopwatch — only an interval that is not free.');
  if (!patient.reviewSlipped) return prompt('deferred-step-hold', false,
    'Watch which number moves.',
    'Her pulse, her pressure and her foot will be exactly like this all night. The only thing moving is the clock, and the outcome it is being spent against is ninety days away.');
  if (!patient.teamResponded) return prompt('deferred-step-slip', true,
    'The review has moved. Say what moved with it.',
    'Half past five now. Nothing about her changed; the step simply travelled with the person it was attached to, which is what attaching it to a person means.');
  if (!patient.teamObserved) return prompt('deferred-step-reassess', true,
    'Take a current assessment now they have answered.',
    'Yours predates their reply and the slipped review. They own the prescription, the dressing and the debridement, and all three are decided against the current picture.');
  return prompt('deferred-step-handoff', false,
    'Hand off a step that is no longer waiting on somebody’s arrival.',
    'A completed review, a written chart and a theatre slot are not handoff gates. What travels is the injury with the minutes measured from it, and what the interval had been attached to.');
}
