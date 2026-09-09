import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { UnownedDelaySnapshot } from '@platform/kernel/protocol';
import { supportsUnownedDelay, type UnownedDelayAction } from '../unowned-delay';

export const UNOWNED_DELAY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsUnownedDelayDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsUnownedDelay(scenario);
}

export interface UnownedDelayDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: UnownedDelayAction; readonly finished?: boolean;
}

/**
 * The worked example for a wait that nobody decided.
 *
 * It never claims the delay has harmed her — the randomised evidence carried in this lesson
 * would not support that — and it rings the list team before the evening is lost. An example
 * that acted only after a third cancellation would teach that the wait had to get worse before
 * it counted, when the point is that it had already been nobody's for two days.
 */
export function unownedDelayDemonstrationStep(
  patient?: UnownedDelaySnapshot,
): UnownedDelayDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The wait leaves this shift with an author on it, and nothing about the operation or its timing is settled here. This ends the example, not her admission.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.fractureRecordedAtTick === null) {
    return { id: 'fracture', focus: 'actions', progress: 0.08, action: 'record-the-fracture-and-the-clock',
      narration: `Start with the total, because nobody has ever written it down. ${patient.hoursSinceAdmission} hours since admission, ${patient.cancellations} cancellations, ${patient.fastedHours} hours fasted, and not one person in these notes arguing that she should not have the operation. Each piece of that happened to a different person on a different shift, which is precisely why the total has never existed.` };
  }
  if (patient.delayReasonsRecordedAtTick === null) {
    return { id: 'reasons', focus: 'actions', progress: 0.20, action: 'record-what-each-delay-was-for',
      narration: 'Now take the delays one at a time and look for the name. A scan for a murmur that appears in no examination entry, requested by nobody the record names. A review by no named person, with no question attached. A full list nobody rebooked her from. Reasonable-sounding, every one of them, and authorless.' };
  }
  if (patient.pendingRecordedAtTick === null) {
    return { id: 'pending', focus: 'actions', progress: 0.32, action: 'record-what-is-still-being-waited-for',
      narration: 'Separate what is outstanding from what is only still on the page. The scan is not booked and nobody has said what it would change. No medical question is documented anywhere. What is left is a slot — and a slot and a scan are fixed by two different telephone calls, which is why it matters which one you think you are waiting for.' };
  }
  if (patient.escalationAtTick === null) {
    return { id: 'escalate', focus: 'actions', progress: 0.46, action: 'escalate-to-the-team-that-owns-the-list',
      narration: 'Ring the list now, and ask for a name rather than for sympathy. A named slot with a named consultant. Notice what you are not doing: not disputing the constraint, not overriding anybody. Giving two days of nobody’s wait to a specific person who can weigh it.' };
  }
  if (patient.schedulingIntentAtTick === null) {
    return { id: 'intent', focus: 'actions', progress: 0.58, action: 'record-bounded-scheduling-intent',
      narration: 'Record bounded intent and arrange nothing. The order of the list, whatever preoperative testing they actually want, the anaesthetic assessment, and the fasting instruction that follows a real slot all belong to them.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.68, action: 'review-boundaries',
      narration: 'Review the contradiction honestly, because it is a real one. Complications rise past 24 hours in 42,230 patients; adjusted relative risk of death 0.81 with earlier surgery across sixteen observational studies. And then a randomised trial moved the median from 24 hours to 6 in 2,970 patients and found nothing — mortality 9 against 10 percent. Going faster than prompt is not proven to help. None of that describes a third day nobody signed for.' };
  }
  if (!patient.listLost) {
    return { id: 'hold', focus: 'monitor', progress: 0.78,
      narration: 'Now look at the monitor and see the problem. Pulse, pressure, saturation — all exactly what they were on admission, and they will stay there. There has never been a number on this chart for anybody to react to, which is how two days passed without a single person doing anything wrong.' };
  }
  if (!patient.teamResponded) {
    return { id: 'list', focus: 'monitor', progress: 0.87,
      narration: 'The evening goes to another case. Third cancellation, nineteen fasted hours, tomorrow is day three, and every monitored number is unchanged. Add it to the total rather than to tonight: "she was bumped again" is the sentence that produced the first two.' };
  }
  if (!patient.teamObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.93, action: 'reassess',
      narration: 'Take a current assessment now they have answered — and notice how fast they answered, and that they had not known. Nobody was refusing her. They have her against a named slot now, and they own the scheduling and the fasting from here.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off a wait that now has an author. A completed scan, a confirmed slot and a theatre time are not handoff gates. What travels is the total in hours, each delay with its missing name, and the person who now holds it.' };
}
