import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { ThirdAttendanceSnapshot } from '@platform/kernel/protocol';
import { supportsThirdAttendance, type ThirdAttendanceAction } from '../third-attendance';

export const THIRD_ATTENDANCE_DEMONSTRATION_VERSION = '0.1.0';

export function supportsThirdAttendanceDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsThirdAttendance(scenario);
}

export interface ThirdAttendanceDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: ThirdAttendanceAction; readonly finished?: boolean;
}

/**
 * The worked example for a question two people have already answered.
 *
 * It never says a diagnosis was missed and never criticises either previous clinician. It also
 * asks for the assessment before the Tuesday clinician speaks, because an example that acted
 * only once challenged would teach that the position needed defending before it was worth
 * taking.
 */
export function thirdAttendanceDemonstrationStep(
  patient?: ThirdAttendanceSnapshot,
): ThirdAttendanceDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The third examination is handed on as owed, with nobody blamed and nothing about the diagnosis settled here. This ends the example, not her evening.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.attendancesRecordedAtTick === null) {
    return { id: 'visits', focus: 'actions', progress: 0.08, action: 'record-the-attendances-and-what-each-found',
      narration: `Start by separating the three visits. ${patient.attendances} attendances in ${patient.daysSinceFirst} days: generalised pain and one vomit on Sunday, recorded as settling with a soft abdomen on Tuesday, and today. Written as "seen twice and sent home" that is a fact about the department. Written as three examinations it is a fact about her.` };
  }
  if (patient.priorLimitsRecordedAtTick === null) {
    return { id: 'prior', focus: 'actions', progress: 0.20, action: 'record-what-a-previous-assessment-can-say',
      narration: 'Now say what those entries can carry. Both accurate, both written by somebody who did not have today. They tell you two people looked, which is worth knowing and is not the same as telling you there is nothing there now.' };
  }
  if (patient.changeRecordedAtTick === null) {
    return { id: 'change', focus: 'actions', progress: 0.32, action: 'record-what-has-changed-since-the-last-visit',
      narration: 'Record the comparison. Generalised on Sunday, one place today, worse when the trolley is knocked; breakfast on Tuesday and nothing today; and she came back a third time having been told only to if it got worse. No single examination holds that. Three of them do, and you are the first person to have all three.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.46, action: 'escalate-to-the-surgical-team',
      narration: 'Ask now, before anybody challenges you, and ask for an examination rather than for a review of two colleagues’ notes. Nothing in this request is a complaint about either of them, and it is worth saying so out loud when you make it.' };
  }
  if (patient.assessmentIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.58, action: 'record-bounded-assessment-intent',
      narration: 'Record bounded intent and choose nothing. The examination, any imaging, any operation, and whether she stays tonight or comes back tomorrow belong to them.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.68, action: 'review-boundaries',
      narration: 'Review the figure that cuts against you. Six percent of adults later diagnosed had an earlier attendance, and women carried higher adjusted odds — but across nine million attendances, patients admitted on a return visit had lower in-hospital mortality than those admitted first time, 1.85 against 2.48. Coming back is common and is not a verdict on anybody. Your reason is not that she returned. It is that the third examination has not happened.' };
  }
  if (!patient.colleagueSpoke) {
    return { id: 'hold', focus: 'monitor', progress: 0.78,
      narration: 'Look at the observations and notice they will not help you. Ninety-six, thirty-seven four — very nearly what they were on Sunday and on Tuesday, when they decided nothing either. You are holding a position built out of a comparison, and there is no number coming to endorse it.' };
  }
  if (!patient.teamResponded) {
    return { id: 'colleague', focus: 'actions', progress: 0.87,
      narration: 'The Tuesday clinician passes the door and says, kindly, that she was fine on Tuesday. Notice that no fact has changed — only the cost of your position. And notice the answer: that entry is right, it can stay right, and what you have is a different examination on a different day.' };
  }
  if (!patient.teamObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.93, action: 'reassess',
      narration: 'Take a current assessment now they have answered and have read the earlier entries as earlier examinations. They own the examination, the investigation and the disposition, and they decide against the picture your record is holding.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the examination that is owed. A diagnosis, an investigation and a disposition are not handoff gates. What travels is three visits with what each found, the change between them, and no criticism of anybody.' };
}
