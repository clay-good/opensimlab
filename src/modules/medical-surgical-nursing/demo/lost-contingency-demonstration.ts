import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import type { LostContingencySnapshot } from '@platform/kernel/protocol';
import { supportsLostContingency, type LostContingencyAction } from '../lost-contingency';

export const LOST_CONTINGENCY_DEMONSTRATION_VERSION = '0.1.0';

export function supportsLostContingencyDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsLostContingency(scenario);
}

export interface LostContingencyDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: LostContingencyAction; readonly finished?: boolean;
}

/**
 * The worked example for a plan that was not said.
 *
 * Nothing in this lesson is missing, and the example is built to end without
 * anything having been rescued: the contingency was in the notes the whole time,
 * every part of it is recoverable, and what the gap changed was who knew rather
 * than what the plan was. It never asks anyone to remember and never writes a
 * plan of its own, because either would replace a recoverable record with a
 * reconstruction from memory.
 */
export function lostContingencyDemonstrationStep(patient?: LostContingencySnapshot): LostContingencyDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.ended) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: patient.ended === 'handoff'
        ? 'The plan travels in the words it was written in, along with the fact that it was in the notes and not in the handover, and the hours counted against it. Nothing was rescued here, because nothing was ever lost. This ends the example, not the shift.'
        : 'Instructor takeover ended this branch without predicting a patient outcome. Open the debrief or restart to rehearse another response.' };
  }
  if (patient.spokenRecordedAtTick === null) {
    return { id: 'spoken', focus: 'actions', progress: 0.06, action: 'record-what-was-said',
      narration: 'Write down what was actually said, now, while it is still exact. What was said is the only part of this with no record of its own, and in a few minutes it will be a recollection instead of a note.' };
  }
  if (patient.notesCheckedAtTick === null) {
    return { id: 'notes', focus: 'actions', progress: 0.18, action: 'check-the-notes',
      narration: 'Read the post-operative review. It holds one more element than was said, and the extra one is a contingency the surgical team wrote yesterday. A gap between speech and record is a claim about both, and now you have both.' };
  }
  if (patient.gapRecordedAtTick === null) {
    return { id: 'gap', focus: 'actions', progress: 0.3, action: 'record-the-gap-as-a-transmission-gap',
      narration: 'Record it as what it is: the contingency is in the notes and was not in the handover. Not a documentation failure, not a clinical error, and not a plan that went missing. Nobody here did anything wrong.' };
  }
  if (patient.reconstructedAtTick === null) {
    return { id: 'reconstruct', focus: 'actions', progress: 0.44, action: 'reconstruct-the-contingency',
      narration: 'Reconstruct it from the record, in the surgical team’s words rather than your own. Every part of it was recoverable, which is exactly what separates this from a plan that was genuinely lost.' };
  }
  if (patient.consequencesRecordedAtTick === null) {
    return { id: 'consequences', focus: 'actions', progress: 0.56, action: 'record-what-the-gap-changes',
      narration: 'Record what the gap changed. Not the plan and not the patient: it changed who knew, and for how long. Between the handover and this moment the plan existed and nobody at the bedside was working to it.' };
  }
  if (patient.confirmationAtTick === null) {
    return { id: 'confirm', focus: 'actions', progress: 0.68, action: 'confirm-the-plan-with-the-team',
      narration: 'Take the reconstruction to the registrar and ask whether it still stands as written. Carrying it makes this a confirmation; without it the same call becomes a request for a new plan.' };
  }
  if (patient.boundariesReviewedAtTick === null) {
    return { id: 'boundaries', focus: 'actions', progress: 0.78, action: 'review-boundaries',
      narration: 'Review what the evidence covers. Contingency planning is among the elements observers most often find absent from spoken handovers, and who was studied bounds how far that finding carries.' };
  }
  if (patient.monitoringAtTick === null) {
    return { id: 'monitor', focus: 'actions', progress: 0.86, action: 'monitor',
      narration: `Keep measuring hourly against the threshold the plan names: ${patient.urineThresholdMl} millilitres, with consecutive hours counted rather than judged.` };
  }
  if (!patient.confirmationArrived) {
    return { id: patient.outputReported ? 'output' : 'await', focus: 'monitor', progress: 0.9,
      narration: patient.outputReported
        ? `The assistant reports the last hour: ${patient.urineHourlyMl} millilitres, above the threshold the plan names. One hour is not two, so nothing is triggered and nothing needs to be — and the only reason that sentence can be said at all is that somebody went and read the plan.`
        : 'Keep counting the hours while the confirmation is awaited. This authored interval predicts no real response time; the plan is already the plan, and the call is about who knows it.' };
  }
  if (!patient.confirmationObserved) {
    return { id: 'reassess', focus: 'actions', progress: 0.94, action: 'reassess',
      narration: 'Take a current assessment now the team has answered. What is worth carrying forward is the plan as written, the gap recorded as a transmission gap, and the hours as counted.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.96, action: 'handoff',
    narration: 'Hand off the plan in the words it was written in, that it was in the notes and not in the handover, and how many hours have been counted against it. A triggered contingency was never the gate.' };
}
