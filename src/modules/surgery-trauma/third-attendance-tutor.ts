import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { ThirdAttendanceSnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link built from a
 * citation is a guess rather than a lookup. The tray already sends a reader to the source view.
 */

/**
 * Observed-state guidance for a question two people have already answered.
 *
 * The prompts never say a diagnosis was missed, and they never criticise either previous
 * clinician, because the lesson is about how a record is read rather than about how it was
 * written — and a learner who leaves believing the answer is to distrust colleagues has
 * learned the wrong thing.
 */
export function thirdAttendanceInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly thirdAttendance?: ThirdAttendanceSnapshot;
}) {
  const patient = input.thirdAttendance;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.attendancesRecordedAtTick === null) return prompt('third-attendance-visits', true,
    'Write the three visits down with what each one found.',
    `${patient.attendances} attendances in ${patient.daysSinceFirst} days. "Seen twice and sent home" describes the department; what each examination found describes her.`);
  if (patient.priorLimitsRecordedAtTick === null) return prompt('third-attendance-prior', true,
    'Record what those two entries can actually say.',
    'Both are accurate. Both were written by somebody who did not have today. They establish that two people looked, which is not the same as establishing that there is nothing there now.');
  if (patient.changeRecordedAtTick === null) return prompt('third-attendance-change', true,
    'Record the comparison, not the snapshot.',
    'Generalised on Sunday, one place today. Worse when the trolley is knocked. She ate breakfast on Tuesday and nothing today. No single examination contains that; only three of them do.');
  if (patient.escalationAtTick === null) return prompt('third-attendance-escalate', true,
    'Ask for the examination nobody has done yet.',
    'Not a complaint about two colleagues and not a second opinion on their notes. A third assessment, of a patient who is on her third attendance.');
  if (patient.assessmentIntentAtTick === null) return prompt('third-attendance-intent', true,
    'Record bounded intent and choose nothing.',
    'The examination, any imaging, any operation, and whether she stays or comes back tomorrow are theirs. Writing down that those decisions exist is not making them.');
  if (patient.boundariesReviewedAtTick === null) return prompt('third-attendance-boundaries', true,
    'Review the figure that argues against your instinct.',
    'Returning is common, and patients admitted on a return visit did better than those admitted first time — 1.85 percent against 2.48. The return is not the reason. The unexamined third presentation is.');
  if (!patient.colleagueSpoke) return prompt('third-attendance-hold', false,
    'Notice what will and will not arrive.',
    'Her observations were very nearly these on both previous visits and decided nothing then. Nothing is coming to make this easier; you are holding a position on a comparison.');
  if (!patient.teamResponded) return prompt('third-attendance-colleague', true,
    'She was fine on Tuesday. Answer without disagreeing.',
    'That entry is right and can stay right. What you have is a different examination on a different day, and saying so takes nothing away from her.');
  if (!patient.teamObserved) return prompt('third-attendance-reassess', true,
    'Take a current assessment now they have answered.',
    'Yours predates their reply. They own the examination, the investigation and the disposition, and all three are decided against the current picture.');
  return prompt('third-attendance-handoff', false,
    'Hand off a third examination that is owed.',
    'A diagnosis, an investigation and a disposition are not handoff gates. What travels is three visits with what each found, the change between them, and no criticism of anybody.');
}
