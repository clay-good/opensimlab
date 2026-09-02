import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { NcseProgress } from '../nonconvulsive-status-epilepticus-recognition';

export const NCSE_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a seizure with nothing to watch.
 *
 * This is the mirror of the focal-motor lesson next door. There the movement
 * was visible and waiting for an EEG was the error; here there is nothing to
 * see, and the error runs the other way — deciding from the bedside that this
 * is or is not a seizure. Both halves are refused: the suspicion is named
 * without a clinical diagnosis, and the urgent EEG is the boundary rather than
 * an afterthought. What makes the suspicion is the shape of the fluctuation:
 * speech arrest measured in seconds, gaze that deviates and comes back, the
 * same events over and over for ninety-five minutes without a return to
 * baseline. None of these prompts places or reads an EEG, diagnoses
 * nonconvulsive status, or selects a drug, dose, route, oxygen, or airway.
 */
export function ncseInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly ncse?: NcseProgress;
}) {
  const patient = input.ncse;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('ncse-trajectory', true,
    'Describe the fluctuation in seconds, because that is what separates this from confusion.',
    'Ninety-five minutes of alternating short fluent phrases, perseveration, speech arrest lasting twenty to forty seconds, inattention, and rightward gaze deviation for fifteen to twenty-five seconds that comes back toward midline. Delirium waxes over hours; this is the same stereotyped event happening again and again on a scale of seconds, and she has not returned to her usual baseline once in that time.');
  if (patient.suspicionAtTick === null) return prompt('ncse-suspicion', true,
    'Say you suspect a seizure and that this needs an urgent EEG — and stop there.',
    'Both halves matter. You cannot make this diagnosis from the bedside, because the whole problem is that there is nothing to watch; and you cannot wait to suspect it, because the recording is what settles it and somebody has to ask for the recording. Gaze deviation that returns toward midline and speech arrest in seconds are what raise it. Naming a suspicion and naming the test is the entire step.');
  if (patient.ownershipAtTick === null) return prompt('ncse-ownership', true,
    'Get neurology, the EEG service and airway-capable ownership involved together.',
    'The EEG is not a test you order and collect later — it needs people, and asking for it is a staffing question as much as a clinical one, which is why the service is called rather than the box requested. Airway capability travels with them: she handles secretions now, and she has not been reliably awake for ninety-five minutes.');
  if (patient.alternativesAtTick === null) return prompt('ncse-alternatives', true,
    'Work the alternatives properly — alongside the EEG rather than instead of it.',
    'This is where the diagnosis usually gets lost: fluctuating confusion in a seventy-two-year-old becomes a delirium workup and the seizures keep running underneath it. The alternatives are real and stay open — ischemia, a postictal state, delirium, medication, toxic, metabolic, infectious, immune, structural and psychiatric causes — and the CT, CTA, glucose of 108 and sodium of 138 close large things at this minute rather than permanently.');
  if (patient.laterAtTick === null) return prompt('ncse-later', false,
    'Record the review, let the interval pass, and read the recording report.',
    'The interval is a contrast rather than a required wait or a predicted trajectory. Nothing here says what any individual recording shows.');
  return prompt('ncse-handoff', true,
    'Hand off a patient who looks exactly the same and is now known to be seizing.',
    'The qualified neurophysiologist reports recurrent evolving left temporal electrographic seizures totalling twenty-four minutes with no consistent motor correlate, meeting the ACNS electrographic-status definition — and at the bedside she is still fluctuating between short phrases, speech arrest and intermittent command following. The absent motor correlate is why this was invisible, not a reason to doubt it. The cause, the treatment, the recurrence risk, the airway and the recovery all travel with her, and none of them is settled by the recording.');
}
