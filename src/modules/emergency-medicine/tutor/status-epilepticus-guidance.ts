import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { StatusEpilepticusProgress } from '../status-epilepticus';

export const STATUS_EPILEPTICUS_TUTOR_VERSION = '0.1.0';

export interface StatusEpilepticusPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is under-dosing the clock rather than the drug.
 * Everyone knows the benzodiazepine; what gets skipped in the thirty seconds
 * before it is the glucose, the suction and the position — and one of those
 * three is a treatment for the seizure itself.
 *
 * It is silent on the unassisted setting, silent once the reassessment is
 * recorded, and silent for any scenario version it was not written against.
 */
export function statusEpilepticusInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: StatusEpilepticusProgress },
): StatusEpilepticusPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessedAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.reviewedAtTick === null) return prompt('status-review', true,
    'Start the clock on the seizure, not on your arrival.',
    'Generalised bilateral convulsive activity continuing for six minutes twenty seconds without recovery between movements. Five minutes is the operational threshold, and the reason it is an operational definition rather than a biological one is that waiting for a biological answer costs neurons: self-sustaining seizures become harder to stop the longer they run, as the receptors the benzodiazepine works on are internalised. So the useful question is not whether this will stop on its own but how long it has already been going. The airway is patent between movements, breathing spontaneous, SpO₂ 92% on room air, a pulse present, and the glucose is not yet known. This meets the treatment threshold; it does not diagnose a cause, and nothing on this screen examines the patient.');

  if (patient.supportedAtTick === null) return prompt('status-stabilization', true,
    'Position, suction, oxygen, monitor, access, help — and the glucose, which is treatment.',
    'All of it in parallel, and the engine gates the lorazepam behind it for one reason above the others: the point-of-care glucose comes back at 118, and it had to be asked. Hypoglycaemia is a cause of convulsive status that a benzodiazepine will suppress without correcting, which produces a patient who stops fitting and stays hypoglycaemic — the worst kind of apparent success. The rest of the bundle is about the next two minutes rather than this one: a benzodiazepine in a patient already at 92% will make the breathing worse before it makes the seizure better, so suction and a position and someone watching are what make the drug safe to give. Protection from injury without restraint, because holding a convulsing limb breaks it. Physical care, specimens and equipment operation are not simulated.');

  if (patient.lorazepamAtTick === null) return prompt('status-lorazepam', true,
    'Lorazepam 4 mg intravenously — a full first dose, not a cautious one.',
    'The fixed first-line action here. The commonest error with benzodiazepines in status is not choosing the wrong one, it is giving too little of the right one and then waiting: an underdose is the one thing that reliably produces a seizure that continues and a patient who is now also sedated. A full weight-appropriate dose given once beats two timid ones. The modelled convulsions stop on the next physiology update rather than on this click, which is why the reassessment waits. Preparation, physical delivery, pharmacokinetics, contraindication assessment and individual treatment response are not predicted here.');

  return prompt('status-reassess', true,
    'Let the tick pass, then look — and hold the second-line boundary in your head.',
    'Visible generalised convulsions have stopped, ventilation is spontaneous, a pulse is present, saturation 96% with support. Airway and ventilation surveillance continues rather than stopping, because the drug that ended the seizure is still working on the respiratory drive and the twenty minutes after a benzodiazepine is when people are found apnoeic. The boundary this lesson keeps deliberately clear is the second-line one: a seizure that persists or recurs needs a second-line antiseizure medication promptly rather than a second dose of the same benzodiazepine and a longer wait. EEG, causal evaluation, repeat or alternate medication, airway procedures, recurrence, disposition and outcome are outside this lesson.');
}
