import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { AsahProgress } from '../aneurysmal-subarachnoid-hemorrhage-deterioration';

export const ASAH_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a diagnosis the imaging cannot make.
 *
 * Delayed cerebral ischemia is recognised rather than measured. The CTA
 * narrowing and the delayed perfusion support it and cannot establish it, and
 * the one-hour deficit duration in the research definition exists so studies
 * can count cases — using it as a waiting period at the bedside is a
 * misreading with a cost. Everything ruled out here is ruled out for a window:
 * a CT that reports no rebleeding describes this scan, and an EEG that
 * captured no seizure describes the interval it captured. So the prompts walk
 * the alternatives before landing anywhere, refuse both the imaging-only
 * shortcut and the clock, and keep every negative attached to its window. None
 * of them diagnoses delayed cerebral ischemia, excludes an alternative, or
 * selects a drug, dose, fluid, pressure target, vasopressor, angioplasty, or
 * airway.
 */
export function asahInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly asah?: AsahProgress;
}) {
  const patient = input.asah;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('asah-trajectory', true,
    'Say the day out loud, because it is the part that makes this expected.',
    'Day 7 after an aneurysmal subarachnoid hemorrhage, coiled on day 1 with no residual filling and nimodipine uninterrupted. She was alert, fluent and without a deficit this morning; thirty-five minutes ago she developed slowed responses, left neglect, mild left facial weakness and left arm drift. A new focal deficit at this point in the course is the thing the whole week has been watched for.');
  if (patient.evidenceAtTick === null) return prompt('asah-evidence', true,
    'Walk the alternatives before you land anywhere, and keep each negative attached to its window.',
    'Rebleeding, hydrocephalus, seizure, and a metabolic or systemic cause each need saying and dismissing on the supplied evidence rather than assumed away. The CT reports no rebleeding, no acute hydrocephalus and no established infarct — that is this scan, not the next hour. The sodium of 139 and the glucose of 106 close a metabolic story for now. This is the work that makes the recognition mean something.');
  if (patient.boundaryAtTick === null) return prompt('asah-boundary', true,
    'Call it possible delayed cerebral ischemia, and refuse both shortcuts.',
    'The new M1 and proximal M2 narrowing and the delayed right-MCA perfusion without an established core support this and cannot establish it — imaging is not what makes this diagnosis, and a deficit with no other explanation on day 7 is. The other shortcut is the clock: the one-hour duration in the research definition exists so studies can count cases, and treating it as a waiting period is a misreading that costs her the interval.');
  if (patient.ownershipAtTick === null) return prompt('asah-ownership', true,
    'Get neurocritical care, the neurovascular team and rescue capability involved on "possible".',
    'The word this turns on is possible. Ownership is activated on a suspicion that is still open rather than on a confirmed diagnosis, because the people who can escalate need to be in the conversation while the deficit is still young. Nothing about induced pressure, angiography or intra-arterial rescue is decided here — those belong to the teams being called.');
  if (patient.laterAtTick === null) return prompt('asah-later', false,
    'Record the ownership, let the interval pass, and read the later report.',
    'The interval is a contrast rather than a required wait or a predicted trajectory. Nothing here says what any individual deficit does next.');
  return prompt('asah-handoff', true,
    'Hand off a patient who is worse, and be precise about what is still not proven.',
    'Eighty minutes after onset she is drowsier, the neglect and facial weakness persist, and the arm that drifted now falls to the bed. The repeat CT still reports no rebleeding, hydrocephalus or established infarct, and a captured EEG window reports no electrographic seizure — a window, not a permanent exclusion. Nothing here proves delayed cerebral ischemia, proves the narrowing is causal, or proves the aneurysm stays secure. The deficit trajectory, the perfusion, the rescue decision, the seizure and rebleeding questions and the airway all travel with her.');
}
