import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { UnfinishedSurveySnapshot } from '@platform/kernel/protocol';

/**
 * These prompts carry no external link, deliberately.
 *
 * This scenario declares its sources as full citations without URLs, and a link built from a
 * citation is a guess rather than a lookup. The tray already sends a reader to the source view.
 */

/**
 * Observed-state guidance for an assessment that is accurate and unfinished.
 *
 * The prompts never say there is a missed injury, because nothing in the lesson can establish
 * that, and saying it would remove the whole difficulty: the learner's job is to defend an
 * unfinished assessment without knowing whether anything is actually there. They keep pointing
 * at what the record can and cannot say, and at who owns the step that has not been taken.
 */
export function unfinishedSurveyInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string; readonly unfinishedSurvey?: UnfinishedSurveySnapshot;
}) {
  const patient = input.unfinishedSurvey;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient || patient.ended) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.examinationLimitsRecordedAtTick === null) return prompt('unfinished-survey-limits', true,
    'Write down what he was able to contribute to that examination.',
    `Sedated, intubated, a Glasgow Coma Scale of 6 at the scene ${patient.hoursSinceInjury} hours ago. He could not report pain, move to command, or be asked where it hurt. Whoever reads "secondary survey complete" next needs that sentence beside it.`);
  if (patient.injuryListRecordedAtTick === null) return prompt('unfinished-survey-list', true,
    'Record what the list rests on, not what it seems to rule out.',
    `${patient.listedInjuries} injuries, from reported imaging and an examination he could not take part in. That is a record of what was found. It is not a statement that nothing else is there.`);
  if (patient.surveyIncompleteRecordedAtTick === null) return prompt('unfinished-survey-third', true,
    'Record the unfinished assessment as a finding in its own right.',
    'No tertiary survey has been done or documented. In the study that named the step, the recorded rate was 2 percent until somebody went back and looked, and then it was 9. Writing down that he is not yet fully assessed is what stops him being treated as though he were.');
  if (patient.escalationAtTick === null) return prompt('unfinished-survey-escalate', true,
    'Ask the team that owns the survey to finish it.',
    'Not permission to keep him, and not a disagreement about the bed. A statement that the assessment is incomplete, why it is incomplete, and who completes it.');
  if (patient.surveyIntentAtTick === null) return prompt('unfinished-survey-intent', true,
    'Record bounded intent and choose nothing.',
    'Reexamination when sedation allows, a re-review of the admission imaging, and any further films, referral or operation are theirs. Writing down that those decisions exist is not making them.');
  if (patient.boundariesReviewedAtTick === null) return prompt('unfinished-survey-boundaries', true,
    'Review a step worth taking whose evidence does not show it works.',
    'The survey finds things: 2 percent became 9 in 399 patients. Formalising it in 487 patients raised performance from 27 to 42 percent and changed the missed-injury rate not at all. Both of those are true at once, and you should be able to say why you would still do it.');
  if (!patient.sedationLightened) return prompt('unfinished-survey-hold', false,
    'Notice that nothing is going to happen to make this easier.',
    'Every monitored number will stay where it is, because an unexamined limb does not change a heart rate. There is no deterioration coming to justify the position you are holding.');
  if (!patient.teamResponded) return prompt('unfinished-survey-window', true,
    'The window opened. Say what it showed.',
    'He localises on the right and does not move the left arm, and he pulls away when the left forearm is handled. That is the first thing he has been able to tell anyone in fourteen hours, and it exists because somebody kept the question open.');
  if (!patient.teamObserved) return prompt('unfinished-survey-reassess', true,
    'Take a current assessment now they have answered.',
    'Yours predates their reply and the sedation window. They own completing the survey and re-reviewing the imaging, and both are done against the current picture.');
  return prompt('unfinished-survey-handoff', false,
    'Hand off an assessment recorded as unfinished.',
    'A completed survey, a named injury and a decision about the bed are not handoff gates. What travels is why he could not be examined, what the list rests on, and that nobody has yet called him clear.');
}
