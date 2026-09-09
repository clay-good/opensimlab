import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { UnfinishedSurveySnapshot } from '@platform/kernel/protocol';
import { supportsUnfinishedSurvey, type UnfinishedSurveyAction } from '../unfinished-survey';

export const UNFINISHED_SURVEY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsUnfinishedSurveyDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsUnfinishedSurvey(scenario);
}

export interface UnfinishedSurveyDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: UnfinishedSurveyAction; readonly finished?: boolean;
}

/**
 * The worked example for an assessment that is accurate and unfinished.
 *
 * It never names an injury, and it deliberately does not wait for the sedation window before
 * asking for the survey. An example that held its position only until the patient produced a
 * finding would teach that the finding is what justifies the position, which is the reverse of
 * the lesson: the window is findable at all because the question was kept open first.
 */
export function unfinishedSurveyDemonstrationStep(
  patient?: UnfinishedSurveySnapshot,
): UnfinishedSurveyDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The unfinished assessment is handed on as unfinished, with the survey owned by the team that can complete it and nothing about a missed injury settled here. This ends the example, not his night.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.examinationLimitsRecordedAtTick === null) {
    return { id: 'limits', focus: 'actions', progress: 0.08, action: 'record-why-he-could-not-be-examined',
      narration: `Start with what he could contribute. Sedated, intubated, a Glasgow Coma Scale of 6 at the scene ${patient.hoursSinceInjury} hours ago — no report of pain, no movement to command, no answer to a question. That sentence goes next to "secondary survey complete", because without it that entry reads as something it does not say.` };
  }
  if (patient.injuryListRecordedAtTick === null) {
    return { id: 'list', focus: 'actions', progress: 0.20, action: 'record-what-the-injury-list-rests-on',
      narration: `Now what the list is made of. ${patient.listedInjuries} injuries, found by reported whole-body imaging and by an examination he could not take part in. A record of what was found. Not a claim about what is not there.` };
  }
  if (patient.surveyIncompleteRecordedAtTick === null) {
    return { id: 'third', focus: 'actions', progress: 0.32, action: 'record-that-the-third-survey-is-not-done',
      narration: 'Write the gap down as a finding. The tertiary survey — the deliberate reexamination once he can take part, imaging reviewed again beside it — has not been done or documented. In 399 patients the recorded rate was 2 percent until somebody went back and looked; then it was 9.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.46, action: 'escalate-to-the-trauma-team',
      narration: 'Ask them now, while he is still sedated and there is nothing to show. Not permission to keep him and not an argument about the bed: the assessment is incomplete, here is why, and here is who completes it.' };
  }
  if (patient.surveyIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.58, action: 'record-bounded-survey-intent',
      narration: 'Record bounded intent and choose nothing. Reexamination when sedation allows, a re-review of the admission imaging, and any further films, referral or operation belong to them.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.68, action: 'review-boundaries',
      narration: 'Review both halves and keep them both. The survey finds things: 2 percent became 9, and 21 of those 41 were extremity fractures. And formalising it in 487 patients moved performance from 27 to 42 percent while the missed-injury rate did not move — 3.8 against 4.8 in hospital. Ten observational studies, none randomised, moderate risk of bias. Worth doing; not proven to fix it.' };
  }
  if (!patient.sedationLightened) {
    return { id: 'hold', focus: 'monitor', progress: 0.78,
      narration: 'Now watch nothing happen. The pressures, the saturation, the ventilator, the temperature — all exactly where they started, and they will stay there. No deterioration is coming to prove you right. Holding the position with nothing to show for it is the position.' };
  }
  if (!patient.teamResponded) {
    return { id: 'window', focus: 'monitor', progress: 0.87,
      narration: 'Sedation lightens for the neurological check and he tells you something for the first time in fourteen hours: he localises on the right, does not move the left arm, and pulls away when the forearm is handled. Nothing on the monitor moved. That window was always coming — what mattered is that the question was still open when it arrived.' };
  }
  if (!patient.teamObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.93, action: 'reassess',
      narration: 'Take a current assessment now they have answered and confirmed from their own record that no tertiary survey was documented. They complete it against the current picture, and the current picture is the one your record now holds.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand it off unfinished, and say so. A completed survey, a named injury and a decision about the bed are not handoff gates. What travels is why he could not be examined, what the list rests on, and that nobody has yet called him clear.' };
}
