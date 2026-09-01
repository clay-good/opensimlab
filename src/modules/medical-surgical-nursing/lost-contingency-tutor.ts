import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { LostContingencySnapshot } from '@platform/kernel/protocol';

export const LOST_CONTINGENCY_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link
 * built from a citation is a guess rather than a lookup. The tray already sends
 * a reader to the source view, which shows the declared citations in full.
 */

/**
 * Observed-state guidance for a plan that was not said.
 *
 * Nothing here is missing. The contingency is in the notes, written yesterday,
 * and every part of it is recoverable — so the prompts never ask anyone to
 * remember what was said, and never invite a plan of the learner's own. Both
 * would replace a recoverable record with a reconstruction from memory, which
 * is the failure one step further along. They also refuse the two readings that
 * make the gap disappear: that nothing said means nothing applies, and that a
 * quiet handover describes a stable patient.
 */
export function lostContingencyInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly lostContingency?: LostContingencySnapshot;
}) {
  const patient = input.lostContingency;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.spokenRecordedAtTick === null) return prompt('lost-contingency-spoken', true,
    'Write down what was actually said, now, before it fades.',
    'Within the minute rather than from memory later. What was said is the only part of this with no record of its own, and it is the half of the comparison you are about to make.');
  if (patient.notesCheckedAtTick === null) return prompt('lost-contingency-notes', true,
    'Read the post-operative review in the notes.',
    'A gap between what was said and what is written is a claim about both documents, and so far you have one of them.');
  if (patient.gapRecordedAtTick === null) return prompt('lost-contingency-gap', true,
    'Record it as a transmission gap, in those terms.',
    'The contingency is in the notes and was not in the handover. That is not a documentation failure and not a clinical error — nobody did anything wrong, and the plan was never lost.');
  if (patient.reconstructedAtTick === null) return prompt('lost-contingency-reconstruct', true,
    'Reconstruct it from the record, in the surgical team’s words.',
    'Not from anyone’s recollection and not in your own words. Every part of it is recoverable, which is the difference between this and a plan that genuinely went missing.');
  if (patient.consequencesRecordedAtTick === null) return prompt('lost-contingency-consequences', true,
    'Record what the gap changed, and what it did not.',
    'It did not change the plan or the patient. It changed who knew and for how long, which is the part that matters to whoever reads this next.');
  if (patient.confirmationAtTick === null) return prompt('lost-contingency-confirm', true,
    'Ask the team to confirm the plan still stands as written.',
    'Carrying the reconstruction with you makes this a confirmation. Without it, the same call is a request for a new plan, which is a different and weaker thing to ask for.');
  if (patient.boundariesReviewedAtTick === null) return prompt('lost-contingency-boundaries', true,
    'Review what the evidence here does and does not cover.',
    'Contingency planning is among the elements observers most often find absent from spoken handovers. Who was studied, and where, bounds how far that carries.');
  if (patient.monitoringAtTick === null) return prompt('lost-contingency-monitor', true,
    `Keep measuring hourly, against the threshold the plan names.`,
    `${patient.urineThresholdMl} millilitres, with consecutive hours counted rather than judged. A single hour is not two, and the plan says so.`);
  if (!patient.confirmationArrived) return prompt('lost-contingency-await', false,
    'Keep counting the hours while the confirmation is awaited.',
    'This authored interval predicts no real response time. The plan is already the plan; the call is about who knows it.');
  if (!patient.confirmationObserved) return prompt('lost-contingency-reassess', true,
    'Take a current assessment now the team has answered.',
    'What is worth carrying is the plan as written, the gap as a transmission gap, and the hours as counted.');
  return prompt('lost-contingency-handoff', false,
    'Hand off the plan in the words it was written in.',
    'A triggered contingency and a completed shift are not handoff gates. What travels is the plan, that it was in the notes and not in the handover, and how many hours have been counted against it.');
}
