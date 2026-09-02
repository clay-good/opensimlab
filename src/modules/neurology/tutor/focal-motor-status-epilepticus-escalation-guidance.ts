import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { FocalMotorStatusProgress } from '../focal-motor-status-epilepticus-escalation';

export const FOCAL_MOTOR_STATUS_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a seizure that got quieter without stopping.
 *
 * The room feels better after the rescue care and that feeling is the hazard.
 * The bilateral convulsions became less dramatic, but stereotyped left face and
 * arm clonus is still running and she has not come back — which is one
 * continuous event at eighteen minutes rather than a seizure that ended. So
 * the prompts say that out loud before anything else moves, escalate on the
 * visible movement rather than on an EEG that does not exist here, and treat
 * the airway, the glucose and the search for a cause as work that runs
 * alongside rather than instead. None of them times the seizure, acquires or
 * interprets an EEG, or selects a drug, dose, route, oxygen, or airway.
 */
export function focalMotorStatusInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly focalMotorStatus?: FocalMotorStatusProgress;
}) {
  const patient = input.focalMotorStatus;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('focal-motor-status-trajectory', true,
    'Count this as one event, and start the count where it started.',
    'Eighteen minutes of a single continuous evolving event: rhythmic left face and arm clonus that generalised, then became less dramatic after qualified rescue care. Not three episodes and not a seizure followed by a postictal phase — one event, still running, with meaningful responsiveness not yet returned. The heart rate of 118 and the breathing between motor bursts belong to that event too.');
  if (patient.recognitionAtTick === null) return prompt('focal-motor-status-recognition', true,
    'Say that quieter is not stopped, before anything else moves.',
    'Overt stereotyped left face and arm clonus is still visible and she has not come back. A partial response that removes the most alarming part of the picture is the moment this diagnosis gets missed, because the room relaxes and the clock keeps running. Less dramatic movement is not seizure resolution — that sentence is the whole lesson, and everything after it depends on somebody having said it.');
  if (patient.ownershipAtTick === null) return prompt('focal-motor-status-ownership', true,
    'Escalate on what you can see, without waiting for an EEG to agree.',
    'There is no EEG result here and none is needed to act: continuous focal motor seizure activity with no recovery is enough on its own, and qualified seizure, resuscitation and airway-capable ownership start together on it. Waiting for electrographic confirmation before calling anyone converts a visible emergency into a scheduling problem. Nothing about which drug comes next is decided here.');
  if (patient.safetyAtTick === null) return prompt('focal-motor-status-safety', true,
    'Run the airway, the glucose and the cause alongside — not instead.',
    'The glucose of 104 removes one fast reversible cause and nothing else. Airway risk, injury risk, and the structural, vascular, infectious, immune, toxic, metabolic, medication-related and nonepileptic alternatives all stay open, and the authored absences of trauma, fever and toxin exposure are snapshots rather than exclusions. This review runs in parallel with the escalation, which is why it comes after the call rather than before it.');
  if (patient.laterAtTick === null) return prompt('focal-motor-status-later', false,
    'Record the review, let the interval pass, and read the minute-26 report.',
    'The interval is a contrast rather than a required wait or a predicted trajectory. Nothing here says what any individual seizure does next.');
  return prompt('focal-motor-status-handoff', true,
    'Hand off a seizure that is still going, and say exactly that.',
    'At minute 26 the visible left face and arm clonus continues and meaningful recovery has not returned. No EEG result, no causal diagnosis, no treatment effect and no movement cessation is authored — so nothing here is a claim that anything worked. The active seizure, the recovery question, the airway, the cause, the recurrence risk, the rescue choice and whether an EEG is needed all travel with her.');
}
