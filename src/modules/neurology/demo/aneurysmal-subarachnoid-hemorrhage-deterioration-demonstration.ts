import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsAsah, type AsahAction, type AsahProgress,
} from '../aneurysmal-subarachnoid-hemorrhage-deterioration';

export const ASAH_DEMONSTRATION_VERSION = '0.1.0';

export function supportsAsahDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsAsah(scenario);
}

export interface AsahDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: AsahAction; readonly finished?: boolean;
}

/**
 * The worked example for a diagnosis the imaging cannot make.
 *
 * Delayed cerebral ischemia is recognised rather than measured. The CTA
 * narrowing and the delayed perfusion support it and cannot establish it, and
 * the one-hour deficit duration in the research definition exists so studies
 * can count cases rather than so bedsides can wait. So this example walks the
 * alternatives before landing anywhere, refuses both the imaging-only shortcut
 * and the clock, activates ownership on "possible", and keeps every negative
 * attached to the window it came from. It diagnoses nothing, excludes nothing,
 * and selects no drug, dose, fluid, pressure target, vasopressor, angioplasty,
 * or airway.
 */
export function asahDemonstrationStep(
  patient?: AsahProgress,
): AsahDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on worse than she started, on a suspicion that is still a suspicion, with the people who can act already in the room. Nothing was proven and nothing was excluded — not the cause, not the narrowing, not the next hour. This ends the example, not the deterioration.' };
  }
  if (patient.trajectoryAtTick === null) {
    return { id: 'trajectory', focus: 'monitor', progress: 0.08, action: 'reconcile-neurology-asah-day-aneurysm-status-new-deficit-and-whole-patient',
      narration: 'Say the day out loud, because it is the part that makes this expected. Day 7 after an aneurysmal subarachnoid hemorrhage, coiled on day 1 with no residual filling and nimodipine uninterrupted. She was alert, fluent and without a deficit this morning; thirty-five minutes ago she developed slowed responses, left neglect, mild left facial weakness and left arm drift. A new focal deficit at this point in the course is the thing the whole week has been watched for.' };
  }
  if (patient.evidenceAtTick === null) {
    return { id: 'evidence', focus: 'monitor', progress: 0.24, action: 'review-neurology-asah-rebleeding-hydrocephalus-seizure-metabolic-and-perfusion-evidence',
      narration: 'Walk the alternatives before landing anywhere, and keep each negative attached to its window. Rebleeding, hydrocephalus, seizure, and a metabolic or systemic cause each need saying and dismissing on the supplied evidence rather than assumed away. The CT reports no rebleeding, no acute hydrocephalus and no established infarct — that is this scan, not the next hour. The sodium of 139 and the glucose of 106 close a metabolic story for now. This is the work that makes the recognition mean something.' };
  }
  if (patient.boundaryAtTick === null) {
    return { id: 'boundary', focus: 'actions', progress: 0.44, action: 'recognize-neurology-asah-possible-dci-without-imaging-alone',
      narration: 'Call it possible delayed cerebral ischemia, and refuse both shortcuts. The new M1 and proximal M2 narrowing and the delayed right-MCA perfusion without an established core support this and cannot establish it — imaging is not what makes this diagnosis, and a deficit with no other explanation on day 7 is. The other shortcut is the clock: the one-hour duration in the research definition exists so studies can count cases, and treating it as a waiting period is a misreading that costs her the interval.' };
  }
  if (patient.ownershipAtTick === null) {
    return { id: 'ownership', focus: 'actions', progress: 0.62, action: 'activate-neurology-asah-qualified-neurocritical-neurovascular-and-rescue-ownership',
      narration: 'Get neurocritical care, the neurovascular team and rescue capability involved on “possible”. That word is what this turns on: ownership is activated on a suspicion that is still open rather than on a confirmed diagnosis, because the people who can escalate need to be in the conversation while the deficit is still young. Nothing about induced pressure, angiography or intra-arterial rescue is decided here — those belong to the teams being called.' };
  }
  if (patient.laterAtTick === null) {
    return { id: 'later', focus: 'monitor', progress: 0.8, action: 'review-neurology-asah-strict-later-neurologic-and-perfusion-trajectory',
      narration: 'Let the authored interval pass and read the qualified team’s later report. The interval is a contrast rather than a required wait, and nothing here says what any individual deficit does next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-neurology-asah-dci-aneurysm-recurrence-and-active-risk',
    narration: 'Eighty minutes after onset she is drowsier, the neglect and facial weakness persist, and the arm that drifted now falls to the bed. The repeat CT still reports no rebleeding, hydrocephalus or established infarct, and a captured EEG window reports no electrographic seizure — a window, not a permanent exclusion. Hand off the deficit trajectory, the perfusion, the rescue decision, the seizure and rebleeding questions and the airway, and prove none of it, not the ischemia, not the causal narrowing, not the aneurysm.' };
}
