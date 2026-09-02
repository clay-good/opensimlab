import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { EncephalitisProgress } from '../suspected-herpes-simplex-encephalitis';

export const ENCEPHALITIS_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a diagnosis you treat before you have it.
 *
 * The meningitis lesson next door runs its treatment clock alongside its
 * diagnostic clock; this one puts treatment in front, and the ending explains
 * why. A CSF HSV PCR taken about eighteen hours after the neurobehavioral
 * symptoms started comes back negative in a man whose MRI shows left
 * mesial-temporal and insular signal change with restricted diffusion and whose
 * EEG shows left temporal lateralized periodic discharges. An early negative
 * does not exclude this, which is exactly why the antiviral could not have
 * waited for it. So the prompts start the pathway before the imaging, the EEG,
 * the CSF or the PCR, keep the captured EEG window a window with a witnessed
 * focal seizure already behind him, and end on repeat testing rather than
 * reassurance. None of them interprets an MRI or EEG, names a pathogen, or
 * selects a regimen or dose.
 */
export function encephalitisInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly encephalitis?: EncephalitisProgress;
}) {
  const patient = input.encephalitis;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('encephalitis-trajectory', true,
    'Put the fever and the new mind in the same sentence, and add the seizure.',
    'Thirty hours of fever and headache, then twelve hours of irritability, repeating the same question, forgetting recent events and reaching for words — and two hours ago a ninety-second behavioural arrest with right facial twitching that stopped on its own. Fever plus new behaviour, memory and language, plus a focal seizure, is an encephalitic syndrome. Any one of those alone is a different conversation; together they are this one.');
  if (patient.ownershipAtTick === null) return prompt('encephalitis-ownership', true,
    'Get neurology, infection, seizure and airway-capable owners in immediately.',
    'He is GCS 14 and rousable now, and he has already had one focal seizure that stopped without treatment. That combination is the reason airway capability and seizure ownership belong here from the start rather than when something changes. Critical care and infection come with them, because the next two decisions — what to start and what to look at — should not be one person’s to make alone.');
  if (patient.treatmentAtTick === null) return prompt('encephalitis-treatment', true,
    'Start the empiric antiviral pathway now, ahead of the MRI, the EEG, the CSF and the PCR.',
    'This is the step that has to come before the looking. Every test in front of you can be normal, pending or negative in someone who has this, so treatment that waits for certainty is treatment that arrives late in the only condition where arriving late is what does the damage. You are choosing no regimen and no dose; what is being decided is that the antiviral does not queue behind a result.');
  if (patient.diagnosticsAtTick === null) return prompt('encephalitis-diagnostics', true,
    'Now read the picture, and hold every part of it loosely.',
    'The CSF shows 96 cells at 86% lymphocytes with protein 82 and a normal glucose ratio — central inflammation, not a pathogen. Viral PCR, antibody and the broader infectious and autoimmune studies are pending, and autoimmune, vascular, neoplastic, toxic-metabolic, postictal and medication causes stay open. The other live question is what the EEG cannot settle: he has had one focal seizure, and a nonconvulsive one would look like the drowsiness you are already seeing.');
  if (patient.laterAtTick === null) return prompt('encephalitis-later', false,
    'Record the pathway, let the interval pass, and read the 4-hour report.',
    'The interval is a contrast rather than a required wait or a predicted trajectory. Nothing here says what any individual patient does next.');
  return prompt('encephalitis-handoff', true,
    'Hand off a negative PCR that changes nothing, and say why.',
    'The MRI describes left mesial-temporal and insular FLAIR change with restricted diffusion, the EEG describes left temporal slowing with lateralized periodic discharges and no seizure during the sample, and the CSF HSV PCR is negative — from a specimen taken about eighteen hours after the neurobehavioral symptoms began. An early negative does not exclude this, which is the whole reason the antiviral went first. Repeat testing, continued antiviral care, the seizure question, the autoimmune workup and his cognition all travel with him.');
}
