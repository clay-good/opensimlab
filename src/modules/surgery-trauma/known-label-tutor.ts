import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { KnownLabelSnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link built from a
 * citation is a guess rather than a lookup. The tray already sends a reader to the source view.
 */

/**
 * Observed-state guidance for a diagnosis that explains everything.
 *
 * The prompts never say the label is wrong and never name a competing diagnosis. A learner who
 * leaves believing that recorded diagnoses in this population should be distrusted has learned
 * the wrong thing; what they should leave with is that explaining and excluding are different
 * operations.
 */
export function knownLabelInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly knownLabel?: KnownLabelSnapshot;
}) {
  const patient = input.knownLabel;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.labelRecordedAtTick === null) return prompt('known-label-label', true,
    'Write the label down with the work it is doing.',
    `Chronic constipation, ${patient.labelYears} years on the record, almost certainly still true — and it explains the abdomen, the not eating and the distress all at once. That is what makes it worth writing down carefully.`);
  if (patient.carerAccountRecordedAtTick === null) return prompt('known-label-carer', true,
    `Take the history from the person who can compare${patient.informantPresent ? ', while she is still here' : ' — she has gone, so record what she said before she went'}.`,
    `${patient.informantYears} years. Quiet when he is usually loud. Refused what he never refuses. That is not an opinion about a diagnosis; it is an observation nobody else in this building can make.`);
  if (patient.exclusionLimitsRecordedAtTick === null) return prompt('known-label-limits', true,
    'Record what the label cannot do.',
    'Mean 11.04 conditions each, 98.7 percent multimorbid, constipation among the five commonest. A true label here is one of about eleven, and no member of that set rules out any other.');
  if (patient.escalationAtTick === null) return prompt('known-label-escalate', true,
    'Ask for an examination he can take part in.',
    'Not an argument about the diagnosis — say plainly that the constipation is probably still there. What you are asking for is the assessment nobody has managed yet, and the time and quiet it needs.');
  if (patient.adjustmentIntentAtTick === null) return prompt('known-label-intent', true,
    'Record bounded intent, including what the examination needs to happen at all.',
    'The examination and its adjustments, any investigation and how it is explained to him, any prescribing, and whether he stays are theirs. Writing down that those decisions exist is not making them.');
  if (patient.boundariesReviewedAtTick === null) return prompt('known-label-boundaries', true,
    'Review evidence whose strongest finding backs the label.',
    'Betting on the constipation is a good bet. And 37 percent of deaths in this population were amenable to good healthcare against 13, with carers not feeling listened to significant at 0.006. Both are true at once.');
  if (!patient.carerLeft) return prompt('known-label-hold', false,
    'Notice what is about to leave the room.',
    'The observations will not move. The only instrument in this department that can tell today from last Tuesday finishes her shift at four, and she is not a test you can repeat later.');
  if (!patient.teamResponded) return prompt('known-label-handover', true,
    'She has gone. Say what left with her.',
    'The relief worker is willing and has met him twice. Nothing about the patient changed; the comparison did. That is why the account had to be written down as history rather than remembered.');
  if (!patient.teamObserved) return prompt('known-label-reassess', true,
    'Take a current assessment now they have answered.',
    'Yours predates their reply and the handover. They own the examination and its adjustments, any investigation, and the disposition.');
  return prompt('known-label-handoff', false,
    'Hand off an assessment recorded as adjusted-for, not impossible.',
    'A diagnosis, a completed examination and a disposition are not handoff gates. What travels is the label with its work, the account and its author, and that nobody has yet examined him in a way he could take part in.');
}
