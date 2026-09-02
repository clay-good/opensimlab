import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { DelayedLastProgress } from '../delayed-local-anesthetic-cns-cardiac-toxicity';

export const DELAYED_LAST_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a poisoning that is still being delivered.
 *
 * Two things make this one hard. The first is the clock: thirty-eight hours
 * after the block, nobody is thinking about local anesthetic, and the quiet
 * warnings — metallic taste, tinnitus, tingling around the mouth — arrived
 * twelve minutes before the convulsion and were never going to be the loud
 * part. The second is that the source is a pump, and a room full of people
 * doing excellent resuscitation can leave it running. So the prompts put source
 * cessation in the same breath as the airway and the lipid, refuse the four
 * ways this gets closed early, and read the wide QRS as the cardiac phase
 * rather than an incidental interval. None of them touches the catheter or
 * selects an oxygen setting, sedative, lipid product, dose, route, rhythm
 * intervention, or circuit.
 */
export function delayedLastInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly delayedLast?: DelayedLastProgress;
}) {
  const patient = input.delayedLast;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('delayed-last-trajectory', true,
    'Say that the catheter is still there, and then say what it has been doing.',
    'Thirty-eight hours after ankle fixation, with a continuous ropivacaine catheter still in place: metallic taste, bilateral tinnitus, perioral tingling, dysarthria and agitation twelve minutes before arrival, then a seventy-second convulsion. Now sinus bradycardia at 48 with ectopy, 82/46, shallow breathing at 10. This is not a bolus event that has finished happening — a poisoning that is still being delivered is a different problem from one that already was.');
  if (patient.recognitionAtTick === null) return prompt('delayed-last-recognize', true,
    'Name the CNS and the cardiac phases as one event, and refuse the four ways this gets closed early.',
    'No classic sequence, no clock, no single symptom, no seizure and no ECG interval diagnoses or grades her alone — and the tidy textbook order is the thing least worth relying on, because presentations vary and hers is already past the excitatory part. A wide QRS of 124 ms with bradycardia and ectopy is the cardiac phase, not an incidental interval. Epilepsy, stroke, infection, metabolic causes, other sodium-channel blockers and a coingestion all stay open.');
  if (patient.supportAtTick === null) return prompt('delayed-last-support', true,
    'Give source cessation an owner in the same breath as the airway and the lipid.',
    'Everything else here is somebody’s reflex: the airway, the seizure, the rhythm, the pressure. Stopping the infusion is nobody’s by default, and it is the only step that changes how much drug she is still receiving. Qualified source cessation, airway, seizure, cardiac, poison-center, lipid-rescue and extracorporeal-support ownership all start together, and the catheter itself stays qualified-team work.');
  if (patient.evidenceAtTick === null) return prompt('delayed-last-evidence', true,
    'Read the conduction and the acidosis as one loop, and keep the rescue a question.',
    'A QRS of 124 ms with a pH of 7.28, a PCO2 of 48 and a lactate of 4.1 is a loop rather than a list: acidemia worsens sodium-channel blockade, and hypoventilation feeds the acidemia. Catheter verification, the reservoir, the pump, the rate, the connection and whether it migrated are all still qualified-team work — an unverified pump is not a cleared one. Lipid and extracorporeal eligibility are specialist-led and this lesson determines neither.');
  if (patient.reassessmentAtTick === null) return prompt('delayed-last-observe', false,
    'Record the intents as intents, let the interval pass, and read the 20-minute report.',
    'The interval is a contrast rather than a required wait or a predicted response time. Nothing here says how fast any individual conduction interval narrows.');
  return prompt('delayed-last-handoff', true,
    'Hand off a narrower QRS that has not finished narrowing.',
    'Sinus at 76, 104/64, QRS 104 ms, arousable and no recurrent visible seizure. None of that proves the lipid did it, that the rhythm holds, that she will not convulse again, or that the source is fully accounted for. Local anesthetic already in tissue keeps arriving after the pump stops, so recurrent seizure, arrhythmia, shock, the airway, the acidemia, the source and the refractory contingency all travel with her.');
}
