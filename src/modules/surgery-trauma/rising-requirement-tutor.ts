import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { RisingRequirementSnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link built from a
 * citation is a guess rather than a lookup. The tray already sends a reader to the source view.
 */

/**
 * Observed-state guidance for a limb whose only moving finding is the requirement.
 *
 * The prompts never say this is compartment syndrome, because nothing available in the lesson
 * can establish that. They keep pointing at the one quantity that is actually changing and at
 * the clock attached to it, and they push the call earlier rather than toward a better number.
 */
export function risingRequirementInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly risingRequirement?: RisingRequirementSnapshot;
}) {
  const patient = input.risingRequirement;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.injuryRecordedAtTick === null) return prompt('rising-requirement-clock', true,
    'Write the injury down with the hours already on it.',
    `A tibial fracture ${patient.hoursSinceInjury} hours ago in a cast is not background. Every judgement after this is about how long a compartment may already have been under pressure, and that number has to be visible to the next person.`);
  if (patient.requirementRecordedAtTick === null) return prompt('rising-requirement-requirement', true,
    'Record the requirement as a direction, not a complaint.',
    `${patient.analgesiaRequests} requests, each sooner than the last, with pain on passive stretch. A patient hurting after a fracture is unremarkable; a patient needing more every hour is the finding, and it is the only thing here that is moving.`);
  if (patient.pressureLimitsRecordedAtTick === null) return prompt('rising-requirement-reading', true,
    'Write down what the 34 can and cannot settle.',
    'In the monitored series 53 of 116 patients passed an absolute 30 mmHg and three had the syndrome. The quantity that discriminated was the differential against diastolic, followed over time. One reading is neither.');
  if (patient.escalationAtTick === null) return prompt('rising-requirement-escalate', true,
    'Call them now, before any further number.',
    'The measurement is worth having and it is theirs to arrange. Clearing it first only spends the interval that this diagnosis is actually made or missed in.');
  if (patient.decompressionIntentAtTick === null) return prompt('rising-requirement-intent', true,
    'Record bounded intent and do nothing.',
    'Repeat assessment, continuous measurement instead of one reading, and any decision to decompress are theirs. Writing down that those decisions exist is not making them.');
  if (patient.boundariesReviewedAtTick === null) return prompt('rising-requirement-boundaries', true,
    'Review two measures that fail in opposite directions.',
    'Clinical findings miss most cases at 13 to 19 percent sensitivity but are worth a great deal when absent. The absolute pressure over-calls. Knowing which way each one fails is the whole of the reasoning here.');
  if (!patient.worsened) return prompt('rising-requirement-observe', false,
    'Watch what does not change.',
    'The pulse, the refill, the sensation and every monitored number will stay exactly where they are. That is not reassurance; it is this diagnosis behaving normally.');
  if (!patient.teamResponded) return prompt('rising-requirement-hold', true,
    'Hold the call you have made.',
    'He has asked a fourth time and passive extension now stops him mid-sentence, with the foot still warm and the pulse still there. That combination is the point: the limb is asking for help through the one channel a monitor does not carry.');
  if (!patient.teamObserved) return prompt('rising-requirement-reassess', true,
    'Take a current assessment now they have answered.',
    'Yours predates their reply and the fourth request. They own the repeat assessment and the decision, and both are made on the current picture.');
  return prompt('rising-requirement-handoff', false,
    'Hand off the clock and the direction.',
    'A confirmed diagnosis, a repeat pressure and a decision about theatre are not handoff gates. What travels is the hours on the limb, the requirement climbing through them, and what one reading could not settle.');
}
