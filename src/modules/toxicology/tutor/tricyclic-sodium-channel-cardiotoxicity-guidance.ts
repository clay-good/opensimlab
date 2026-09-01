import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { TricyclicProgress } from '../tricyclic-sodium-channel-cardiotoxicity';

export const TRICYCLIC_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a wide complex that is not the rhythm problem it
 * resembles.
 *
 * A regular wide-complex tachycardia with a low pressure has an obvious script,
 * and following it here is the harm: the sodium-channel blockade that widened
 * the QRS is the same thing a sodium-channel-blocking antiarrhythmic would add
 * to. So the prompts keep the whole electrical picture coupled rather than
 * closing on the interval — one QRS width, one aVR finding, one anticholinergic
 * clue or one concentration cannot diagnose or grade this — and they treat the
 * narrower QRS at three hours as a response that is real and reversible rather
 * than as a resolution. None of them selects a solution, concentration, dose,
 * target, antiarrhythmic, airway technique, ventilation setting, or rescue.
 */
export function tricyclicInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly tricyclic?: TricyclicProgress;
}) {
  const patient = input.tricyclic;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('tricyclic-trajectory', true,
    'Put the product, the seizure and the pressure in the same sentence as the wide complex.',
    'Ninety minutes after an amitriptyline-only ingestion, with one generalized seizure that has already stopped, confusion, dry mucosa, mydriasis and a MAP of 59. She is breathing and handling secretions. All of that is one poisoning presenting in several systems at once, not a rhythm with a history attached.');
  if (patient.recognitionAtTick === null) return prompt('tricyclic-recognize', true,
    'Name the sodium-channel pattern, and refuse to close on the QRS.',
    'A QRS of 132 ms with a terminal rightward axis and a prominent terminal R in aVR supports the pattern. It does not make the diagnosis on its own and it does not grade her: the exposure, the conduction, the hypotension, the CNS state, the seizure, the acid-base and the coingestion question all stay coupled. This is also the reason a sodium-channel-blocking antiarrhythmic would be the wrong instinct for the wide complex in front of you.');
  if (patient.supportAtTick === null) return prompt('tricyclic-support', true,
    'Put people in the room for the things that have not happened yet.',
    'Poison center or medical toxicology, resuscitation and critical care, nursing and pharmacy, an airway-capable clinician, and owners for the next seizure, the rhythm and the perfusion — plus compassionate nonjudgmental safety ownership. She has had one seizure and one period of hypotension already; the point of assembling now is that the second of each does not wait for you to be ready.');
  if (patient.evidenceAtTick === null) return prompt('tricyclic-evidence', true,
    'Read the electrical picture with the pressure, the pH and the potassium, and keep the rescue question open.',
    'pH 7.34, bicarbonate 19 and a potassium of 3.7 sit underneath a conduction problem that acidemia makes worse. What refractory rescue would mean, and who would decide it, belongs on the table now rather than at the point of arrest. This lesson selects no solution, concentration, dose, pH or sodium target, antiarrhythmic, airway technique, ventilation setting, lipid or extracorporeal support.');
  if (patient.reassessmentAtTick === null) return prompt('tricyclic-observe', false,
    'Record the intent as intent, let the interval pass, and read the 3-hour report.',
    'The interval is a contrast rather than a required wait or a predicted response time. Nothing here says how any individual case moves.');
  return prompt('tricyclic-handoff', true,
    'Hand off a better ECG as a thing that can come back.',
    'QRS 104 ms, MAP 79, pH 7.43, clearer mentation and no further seizure. That is a response, and it is neither proof that the treatment caused it nor evidence of durable electrical or perfusion stability. Redistribution continues, the conduction delay and the hypotension can recur, no coingestant has been excluded, and the potassium at 3.4 is still moving. All of that travels with her.');
}
