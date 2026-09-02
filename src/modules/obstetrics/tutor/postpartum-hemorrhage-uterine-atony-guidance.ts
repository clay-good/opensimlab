import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { AtonyProgress } from '../postpartum-hemorrhage-uterine-atony';

export const ATONY_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a number that has not arrived yet.
 *
 * Six hundred and fifty millilitres is not a thousand, and waiting for a
 * thousand is the error this lesson exists to refuse: the definition exists so
 * cases can be counted, and what should start the response is a heart rate of
 * 118 and a pressure of 94/58 in a healthy thirty-one-year-old eight minutes
 * after birth. The second refusal is the single cause. A boggy uterus makes
 * atony the most likely explanation and not the only one — trauma, retained
 * tissue, coagulopathy, rupture, inversion and concealed bleeding all stay
 * open, and a placenta reported grossly complete is a gross inspection rather
 * than an exclusion. None of these prompts measures a loss, examines a uterus,
 * placenta or tract, or selects a uterotonic, fluid, component, tamponade or
 * operation.
 */
export function atonyInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly atony?: AtonyProgress;
}) {
  const patient = input.atony;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('atony-trajectory', true,
    'Read the physiology rather than the volume, and notice that she is still talking.',
    'Eight minutes after an uncomplicated term birth: 650 mL measured and rising, bleeding that has not stopped, a boggy enlarged uterus, a heart rate of 118, a pressure of 94/58, breathing at 24, pale and dizzy — and conversing normally. A healthy woman of thirty-one compensates well and then stops compensating quickly, so the conversation is not the reassurance it feels like.');
  if (patient.recognitionAtTick === null) return prompt('atony-recognition', true,
    'Call it a hemorrhage now, and refuse both the threshold and the single cause.',
    'A thousand millilitres is a definition for counting cases, not a trigger for starting; what starts this is a rising measured loss with a tachycardia and a falling pressure. And the boggy uterus makes atony most likely without making it the only thing — trauma, retained tissue, coagulopathy, rupture, inversion and concealed bleeding all stay open, and a placenta reported grossly complete has been looked at rather than proven whole.');
  if (patient.supportAtTick === null) return prompt('atony-support', true,
    'Bring the whole room at once, including the blood bank and the theatre.',
    'Obstetric hemorrhage, anesthesia, nursing, monitoring, blood bank, operating room, newborn support and dignity-centered ownership all start together rather than in sequence, because the two slowest things to arrange are components and an operating room and both are needed before anyone knows whether they will be used. She has just had a baby and is frightened — the dignity and the newborn support are part of the response rather than courtesies added to it.');
  if (patient.evidenceAtTick === null) return prompt('atony-evidence', true,
    'Keep every cause coupled, and treat the reassuring findings as reports.',
    'The supplied tone points at atony, the placenta was grossly complete, and the genital tract and coagulation are uncertain rather than clear. Hypoperfusion is already visible in the pulse and the pressure. None of it excludes concealed bleeding, none of it settles the coagulation, and no laboratory value here is a decision — the review is what keeps the other causes alive while the bundle runs.');
  if (patient.reassessmentAtTick === null) return prompt('atony-reassess', false,
    'Record the bundled intent, let the interval pass, and read the 10-minute report.',
    'The interval is a contrast rather than a required wait or a predicted response time. Nothing here says how fast any individual bleeding slows.');
  return prompt('atony-handoff', true,
    'Hand off numbers that improved and a bleed that is not finished.',
    'A rate of 104, a pressure of 102/64, a firmer uterus and visibly slower bleeding — none of which proves the bundle did it, that the loss has stopped, that her coagulation is holding, or that nothing is collecting where it cannot be seen. The cumulative loss, the hemoglobin trajectory, the coagulation, the transfusion and procedure questions, her pain and privacy, the feeding and newborn support, and the disposition all travel with her.');
}
