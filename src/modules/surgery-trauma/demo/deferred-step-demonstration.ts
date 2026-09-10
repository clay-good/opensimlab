import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { DeferredStepSnapshot } from '@platform/kernel/protocol';
import { supportsDeferredStep, type DeferredStepAction } from '../deferred-step';

export const DEFERRED_STEP_DEMONSTRATION_VERSION = '0.1.0';

export function supportsDeferredStepDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsDeferredStep(scenario);
}

export interface DeferredStepDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: DeferredStepAction; readonly finished?: boolean;
}

/**
 * The worked example for a step attached to somebody's arrival.
 *
 * It names no agent and no dose, never says she will become infected, and never blames the
 * registrar in theatre. It also calls before the review slips, because an example that acted
 * only once the review moved would teach that the deferral became wrong at the moment it
 * became inconvenient, rather than at the moment it was made.
 */
export function deferredStepDemonstrationStep(
  patient?: DeferredStepSnapshot,
): DeferredStepDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The step leaves this shift attached to a decision rather than to a person, and nothing about infection or the operation is settled here. This ends the example, not her night.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.injuryRecordedAtTick === null) {
    return { id: 'injury', focus: 'actions', progress: 0.08, action: 'record-the-injury-and-the-clock',
      narration: `Start with the right clock. ${patient.minutesSinceInjury} minutes since the injury and ${patient.minutesSinceArrival} since she arrived — the published thresholds are measured from the injury, and if you write down the arrival time you have quietly given yourself nineteen minutes that do not exist.` };
  }
  if (patient.pendingStepRecordedAtTick === null) {
    return { id: 'pending', focus: 'actions', progress: 0.20, action: 'record-the-step-that-is-waiting',
      narration: 'Now write down what has not happened. No antibiotic. Nobody decided against one, no allergy, no contraindication, and not a word of disagreement in the notes. That is the hardest kind of outstanding step to see, because there is no argument anywhere to draw your eye to it.' };
  }
  if (patient.attachmentRecordedAtTick === null) {
    return { id: 'attachment', focus: 'actions', progress: 0.32, action: 'record-what-the-interval-is-attached-to',
      narration: 'Here is the actual finding. The board ties the antibiotic to the orthopaedic review, and the review is tied to a registrar who is operating. A step with a window measured in minutes is now waiting on a person becoming free — and nobody who wrote that sentence did anything wrong.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.46, action: 'escalate-to-the-team-that-can-prescribe',
      narration: 'Ring now, while the plan still looks fine and nothing has gone wrong with it. Ask for a decision rather than a visit: injury, time of injury, no documented allergy, does this wait for your review. Nothing about the wound will be clearer when somebody walks in.' };
  }
  if (patient.prescribingIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.58, action: 'record-bounded-prescribing-intent',
      narration: 'Record bounded intent and choose nothing. Whether anything is given, which, how much, by what route, the dressing and photography, and the debridement and its timing all belong to them.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.68, action: 'review-boundaries',
      narration: 'Review two numbers that do not agree. Sixty-six minutes from injury in 137 type III tibias, odds ratio 3.78, and one infection in 36 when nothing was delayed against seventeen in 42 when both were. A hundred and twenty minutes from arrival in 230 others, a 2.4-fold hazard, and a median comparison that missed significance at 0.053. Different thresholds, different clocks, both retrospective. You do not have a stopwatch. You do have an interval that is not free.' };
  }
  if (!patient.reviewSlipped) {
    return { id: 'hold', focus: 'monitor', progress: 0.78,
      narration: 'Look at the monitor and notice it is on nobody’s side. Pulse 88, pressure fine, foot warm, and it will be exactly this all night. The thing you are spending is ninety days away from being visible, which is why the plan felt reasonable to everybody who read it.' };
  }
  if (!patient.teamResponded) {
    return { id: 'slip', focus: 'monitor', progress: 0.87,
      narration: 'Theatre rings: the review is now half past five. Watch what travelled. Not the patient — she is identical. The step moved, because it was attached to a person, and that is what attaching it to a person always means.' };
  }
  if (!patient.teamObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.93, action: 'reassess',
      narration: 'Take a current assessment now they have answered — in minutes, without needing to see her, which tells you what kind of decision it always was. They own the prescription, the dressing and the debridement from here.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand it off with the step no longer waiting on anybody’s arrival. A completed review, a written chart and a theatre slot are not handoff gates. What travels is the injury with the minutes measured from it, and what the interval had been attached to.' };
}
