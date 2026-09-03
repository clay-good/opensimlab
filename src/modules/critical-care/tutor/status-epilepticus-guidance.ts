import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { StatusEpilepticusProgress } from '../status-epilepticus';

export const STATUS_EPILEPTICUS_TUTOR_VERSION = '0.1.0';

export interface StatusEpilepticusPrompt {
  readonly id: string; readonly suggestion: string; readonly because: string;
}

/**
 * A tutor that reads the learner's own recorded steps.
 *
 * The reflex it works against is the stillness. The convulsions stopped twelve
 * minutes ago and the patient looks treated, which is precisely the picture
 * refractory status hides behind — absent movement is not seizure control, and
 * the only thing that knows the difference here is an EEG the browser does not
 * acquire or read. The second reflex is treating the seizure as the whole
 * problem, when a seizure that will not stop is usually a symptom of something
 * that has not been found.
 *
 * It is silent on the unassisted setting, silent once the trajectory is
 * reassessed, and silent for any scenario version it was not written against.
 */
export function statusEpilepticusInlinePrompt(
  level: GuidanceLevel,
  input: { readonly scenarioVersion: string; readonly patient?: StatusEpilepticusProgress },
): StatusEpilepticusPrompt | null {
  const patient = input.patient;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.reassessmentAtTick !== null) return null;

  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.recognitionAtTick === null) return prompt('cse-recognize', true,
    'He stopped shaking twelve minutes ago. Do not read that as better.',
    'A fifty-two-year-old intubated man, unresponsive, after reported adequate lorazepam and levetiracetam for generalized convulsive status. The visible convulsions have gone and the continuous EEG reports recurrent evolving electrographic seizures with no recovery between them. That is the shape of the mistake this lesson exists for: a still patient looks like a treated patient, and absent movement never established seizure control. Two lines of therapy have failed, so this is refractory by definition and the next decisions are not a bedside call — neurocritical care, epilepsy, EEG, pharmacy, airway and critical care all get activated now. The browser does not acquire or interpret the EEG; the report is authored, and the recognition is of a pattern rather than a diagnosis.');
  if (patient.patternAtTick === null) return prompt('cse-pattern', true,
    'Look at the rest of him, because a brain seizing for an hour has a body attached.',
    'The airway is secured with reported bilateral ventilation and capnography, and then the numbers that say what the seizures are costing: MAP 62, heart rate 118, saturation 94%, temperature 38.1, urine 18 mL an hour, lactate 4.2. That lactate and that oliguria are the seizure showing up in organs that are not the brain. Glucose, electrolytes, and whether the reported drugs actually reached him all stay open — reported adequate is not the same as delivered adequate, and a benzodiazepine that never arrived looks identical to one that failed. So do the mimics: not everything that looks like this on a monitor is a seizure. None of that is closed here, and none of it is acquired or interpreted on this screen.');
  if (patient.pathwayAtTick === null) return prompt('cse-pathway', true,
    'Activate the continuous-anesthetic pathway — the guardrails are the content.',
    'Continuous EEG alongside it, because titrating an anesthetic against seizures you cannot see is guessing, and this therapy is defined by what the EEG shows rather than by a dose. Then ventilation, oxygenation, pressure, perfusion, temperature and organ support, because the treatment is itself dangerous: a man at a MAP of 62 is about to be given a drug that lowers it further, and that is a reason to have the team and the support ready rather than a reason to hesitate. No universal agent, dose, EEG depth, burst-suppression target, duration, access or pump is selected here — the depth and the endpoint are genuinely contested, and this records an expert-selected pathway rather than a recipe. Nothing is delivered.');
  if (patient.causesAtTick === null) return prompt('cse-causes', true,
    'Keep hunting the cause. Suppression is not an answer to why.',
    'Metabolic, glucose, electrolyte, toxic, medication, infectious, structural, vascular, immune — all still open and all running alongside the suppression rather than after it, because a seizure that resists two drugs is usually telling you something has not been found. His remote traumatic brain injury is a plausible story, and a plausible story is the thing most likely to end the search early. Any confirmed time-critical reversible cause gets treated immediately; a hypoglycaemia or a hyponatraemia is not something you suppress your way past. No specimen, test, imaging, lumbar puncture, diagnosis or cause-directed therapy happens on this screen, and the search is explicitly not closed.');
  return prompt('cse-reassess', true,
    'Ten quiet minutes on the EEG. Be precise about what that is.',
    'The authored response reports no electrographic seizure during a brief ten-minute window, with MAP 68, heart rate 102, saturation 96%, temperature 37.9. Ten minutes is a window, not a trend, and this is the number most likely to be over-read — it says a seizure was not seen during it. What stays unknown is nearly everything that matters: whether control is durable, whether it recurs when the anesthetic is weaned, what the EEG background looks like, whether he wakes, what the anesthetic costs him, what caused this, whether the organs recover, and how he does. Nothing here acquires or interprets EEG, examines, doses, delivers, diagnoses, determines disposition, or predicts outcome.');
}
