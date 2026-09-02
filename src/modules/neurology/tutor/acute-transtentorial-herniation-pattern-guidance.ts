import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { HerniationProgress } from '../acute-transtentorial-herniation-pattern';

export const HERNIATION_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a pattern that assembled in twelve minutes.
 *
 * Nothing here is waiting to be confirmed. The consciousness, the pupil and the
 * motor response all changed together in the same twelve minutes, and that
 * convergence is the diagnosis — an isolated blown pupil is not, and a complete
 * Cushing triad is not required, so watching for the respiratory irregularity
 * that has not arrived is watching. The CT was taken before the decline, which
 * makes it context rather than a current picture, and repeating it is not
 * allowed to delay the call. So the prompts name the emergency on what has
 * already changed, put the airway with the rescue rather than after it, and end
 * on a pupil that is still 6 mm. None of them calculates a score, interprets
 * imaging, performs an airway procedure, or selects a drug, dose, or operation.
 */
export function herniationInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly herniation?: HerniationProgress;
}) {
  const patient = input.herniation;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('herniation-trajectory', true,
    'Say all four changes and the twelve minutes they happened in.',
    'Conversant at GCS 14 down to GCS 9, a new right pupil at 6 mm and nonreactive against a reactive left 3 mm, new left-arm extension while the right arm still localizes, and a heart rate of 54 with a pressure of 168/111. Each of those in isolation has a long differential. All of them moving in the same direction inside twelve minutes, in a man with a known right temporal mass, has one.');
  if (patient.recognitionAtTick === null) return prompt('herniation-recognition', true,
    'Name it now, and do not wait for the sign that has not arrived.',
    'The bradycardia and the hypertension reinforce this and the respiratory irregularity is not required — a complete Cushing triad is a description of how bad things get, not a threshold for acting. An isolated anisocoria would not be enough on its own and neither would the imaging; what makes this the emergency is the convergence you can already see. Waiting for one more feature is the only decision here that cannot be taken back.');
  if (patient.ownershipAtTick === null) return prompt('herniation-ownership', true,
    'Call airway, neurocritical care, neurosurgery and the operating room in one breath.',
    'He is breathing at 14 and no longer reliably protecting his airway, so the airway team belongs with the rescue rather than after it. Neurosurgery and the operating-room pathway are part of the same call because the only thing that fixes this is removing what is causing it, and that takes longer to arrange than anything else on the list. Nursing, respiratory, pharmacy and imaging come with them.');
  if (patient.boundaryAtTick === null) return prompt('herniation-boundary', true,
    'Read the CT as context, and notice when it was taken.',
    'It reports a 5.2 cm right temporal mass, extensive vasogenic edema, 13 mm of leftward midline shift, effaced right basal cisterns and medial displacement of the uncus — obtained immediately before the steep decline, so it describes the situation he was in rather than the one he is in. Systemic brain protection and expert-selected osmotic rescue are individualized decisions for the teams you have called, and definitive source control is the actual treatment. Repeat imaging does not come before any of it.');
  if (patient.laterAtTick === null) return prompt('herniation-later', false,
    'Record the boundaries, let the interval pass, and read the 15-minute report.',
    'The interval is a contrast rather than a required wait or a predicted trajectory. Nothing here says what any individual patient does next.');
  return prompt('herniation-handoff', true,
    'Hand off everything done and nothing yet achieved.',
    'The airway is secured with bilateral ventilation, an end-tidal of 36 and a saturation of 99%; brain-rescue care has been given; the operating-room pathway is running; the rate is 68 and the pressure 158/88. And the right pupil is still 6 mm and nonreactive, with no neurological recovery reported. Everything that could be started has been started, and none of it has worked yet — the lesion, the consciousness and pupil trajectory, the airway, the pressure strategy, the seizure risk and the surgery all travel with him.');
}
