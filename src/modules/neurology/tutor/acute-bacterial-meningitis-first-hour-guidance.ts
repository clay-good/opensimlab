import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MeningitisProgress } from '../acute-bacterial-meningitis-first-hour';

export const MENINGITIS_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for an hour that gets spent on the wrong things.
 *
 * Everything here is decided by what happens in parallel rather than in
 * sequence. She is alert, oriented and nonfocal, which is precisely the state
 * in which a lumbar puncture does not wait for routine imaging — the scan is
 * for the features she does not have, and ordering it anyway is how the hour
 * disappears. The blood work cannot settle anything either: a C-reactive
 * protein of 162 and a procalcitonin of 4.8 are consistent and not
 * confirmatory. So the prompts get the owners and the precautions moving before
 * the diagnostic question is worked, keep the imaging decision tied to the
 * features that would actually justify it, and put the empiric pathway on a
 * track that no test is allowed to hold up. None of them performs a lumbar
 * puncture, interprets CSF, or chooses a regimen, dose, route, or fluid.
 */
export function meningitisInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly meningitis?: MeningitisProgress;
}) {
  const patient = input.meningitis;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('meningitis-trajectory', true,
    'Say how fast this arrived, and say what she still has intact.',
    'Fourteen hours of worsening headache and fever, then six hours of photophobia, repeated vomiting and painful neck movement, at 39.3°C with a heart rate of 118. And she is GCS 15, oriented in four domains, with clear speech, equal reactive pupils, a symmetric examination and no rash. Both halves matter: the first says how little time there is, and the second is what makes the next few minutes simple rather than complicated.');
  if (patient.ownershipAtTick === null) return prompt('meningitis-ownership', true,
    'Turn this into a service before you turn it into a puzzle.',
    'One clinician thinking carefully is the slowest possible version of this hour. Qualified infection, neurological, resuscitation and nursing ownership, plus locally appropriate precautions, all start now — precautions included, because they protect the people around her and stop being retrofittable the moment she is moved. The diagnostic question is worth working, and it is worth working with the team already assembled.');
  if (patient.diagnosticsAtTick === null) return prompt('meningitis-diagnostics', true,
    'Check the list that would justify a scan, and notice she is not on it.',
    'Routine pre-puncture imaging is for altered consciousness, focal deficit, abnormal pupils, posturing, uncontrolled seizure, bleeding risk, extensive purpura, severe immunocompromise or rapid decline — and this supplied state has none of them, which is what supports a prompt qualified lumbar puncture here. That is a judgement about this minute rather than a permanent clearance, and continuous reassessment can reopen it. Meanwhile no blood marker settles the question: the leukocytes, the CRP and the procalcitonin are consistent with bacterial meningitis and exclude nothing.');
  if (patient.treatmentAtTick === null) return prompt('meningitis-treatment', true,
    'Put the empiric pathway on a track that no test can hold up.',
    'Early qualified intravenous antimicrobial and adjunctive treatment runs through the local pathway, and the point of activating it now is that neither the tap nor the imaging nor the cultures is allowed to delay it. You are choosing no regimen, no dose and no route here — what is being decided is only that the treatment clock and the diagnostic clock run alongside each other rather than one behind the other.');
  if (patient.laterAtTick === null) return prompt('meningitis-later', false,
    'Record the pathway, let the interval pass, and read the 45-minute report.',
    'The interval is a contrast rather than a required wait or a predicted trajectory. Nothing here says what any individual patient does next.');
  return prompt('meningitis-handoff', true,
    'Hand off a convincing CSF with no organism named on it.',
    'Cloudy fluid, an opening pressure of 29, 2,200 white cells at 91% neutrophils, protein 190, a glucose ratio of 0.27 and a lactate of 5.2 — and a Gram stain showing abundant white cells and no organism, with culture, susceptibility and PCR still pending. A negative Gram stain narrows nothing, and empiric treatment was given before any of this returned, which is the shape the hour was supposed to have. The organism, the definitive regimen, the complications, the public-health duties and the hearing follow-up all travel with her.');
}
