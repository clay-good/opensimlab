import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { EasyLabelSnapshot } from '@platform/kernel/protocol';
import { supportsEasyLabel, type EasyLabelAction } from '../easy-label';

export const EASY_LABEL_DEMONSTRATION_VERSION = '0.1.0';

export function supportsEasyLabelDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsEasyLabel(scenario);
}

export interface EasyLabelDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: EasyLabelAction; readonly finished?: boolean;
}

/**
 * The worked example for a label that fits too easily.
 *
 * The label may well be right, and that is the trap rather than a complication of
 * it. An example is unusually exposed here, because a demonstration is expected to
 * arrive somewhere — so this one is written to finish with the label unconfirmed
 * and the competing causes still open, which is what a diagnosis of exclusion
 * looks like when nothing has come back yet.
 */
export function easyLabelDemonstrationStep(
  patient?: EasyLabelSnapshot,
): EasyLabelDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The label is handed on as one of exclusion, with what remains unexcluded named and the samples owned. Nothing has been confirmed and nothing needed to be. This ends the example, not the workup.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.exclusionRecordedAtTick === null) {
    return { id: 'exclusion', focus: 'actions', progress: 0.08, action: 'record-that-the-label-is-a-diagnosis-of-exclusion',
      narration: 'Record that the label is a diagnosis of exclusion. It may well be the right answer — that is the trap rather than a complication of it. Writing this down is what makes the next question obligatory instead of optional.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.20, action: 'escalate-so-both-can-start-together',
      narration: 'Escalate so evaluation and treatment can start together. They are not a queue: sequencing them produces either a delay or an untested treatment, and one call now avoids both.' };
  }
  if (patient.outstandingRecordedAtTick === null) {
    return { id: 'outstanding', focus: 'actions', progress: 0.33, action: 'record-what-has-not-been-excluded',
      narration: 'Record what has not been excluded, by name. Not "infection screen pending" but which organisms, which samples, and what in his own record raises them. A list of names is checkable; a category is not.' };
  }
  if (patient.treatmentIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.45, action: 'record-bounded-treatment-intent',
      narration: 'Record bounded treatment intent and start nothing. Whether immunosuppression begins, when, and against what result belongs to the teams now involved — starting it here would be acting on the label just written down as unconfirmed.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.56, action: 'review-boundaries',
      narration: 'Review what is not settled. No result is available and no grade is assigned. The absence of fever is not a result, and neither is the number of cycles he has had.' };
  }
  if (!patient.historySurfaced) {
    return { id: 'observe', focus: 'monitor', progress: 0.68,
      narration: 'Look in his own record while the samples are arranged. This authored interval is a contrast rather than a required clinical wait, and the notes already held are the cheapest place left to look.' };
  }
  if (!patient.teamResponded) {
    return { id: 'hold', focus: 'monitor', progress: 0.80,
      narration: 'A discharge summary three weeks old, in his own record and never opened in this clinic, reports an admission with a chest infection and a course of antibiotics. That does not make the label wrong. It makes it one of at least two things, which is what a diagnosis of exclusion means.' };
  }
  if (!patient.teamObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.90, action: 'reassess',
      narration: 'Take a current assessment now both teams are on it, with gastroenterology already on the call. They own the samples and the treatment decision, and both need the current picture rather than the one from before the history turned up.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off with the label unconfirmed and the alternatives named. A confirmed diagnosis, a negative screen and a started treatment are not handoff gates. What travels is that the label is one of exclusion, what remains unexcluded, and who owns the samples.' };
}
