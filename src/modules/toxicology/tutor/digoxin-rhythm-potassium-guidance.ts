import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { DigoxinProgress } from '../digoxin-rhythm-potassium';

export const DIGOXIN_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for four numbers that only mean something together.
 *
 * A level of 8.6, a potassium of 6.1, a complete block and an escape rhythm at
 * 36 each look like the headline, and the prompts refuse all four closures. The
 * potassium is the one that misleads hardest: in acute digoxin poisoning it is
 * a marker of how poisoned she is rather than an electrolyte problem standing
 * on its own, and the treatment will drive it the other way fast enough that
 * hypokalemia becomes the next risk. The last prompt is about a number that
 * does not appear: a standard total digoxin assay after immune Fab measures
 * bound drug too, so the 60-minute report deliberately has no level in it, and
 * the absence is the finding. None of them selects a vial count, dose, rate,
 * electrolyte, pacing, dialysis, cardioversion, or antiarrhythmic.
 */
export function digoxinInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly digoxin?: DigoxinProgress;
}) {
  const patient = input.digoxin;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('digoxin-trajectory', true,
    'Say the vomiting and the yellow vision alongside the rhythm.',
    'Seven hours after an immediate-release digoxin ingestion, with repeated vomiting, yellow-tinted blurred vision, drowsiness, an escape rhythm at 36 and a MAP of 53. The gastrointestinal and visual findings are part of the poisoning rather than background noise, and the quantity and coingestants are still qualified-team work.');
  if (patient.recognitionAtTick === null) return prompt('digoxin-recognize', true,
    'Name this as life-threatening, and refuse all four ways of closing it early.',
    'The level of 8.6, the potassium of 6.1, the complete block and the escape rate each look like the headline, and none of them is the whole finding. Pacing the block would capture a rhythm in a poisoned myocardium and leave the poisoning. The potassium is the one that misleads hardest: here it is a marker of how poisoned she is rather than an electrolyte problem standing on its own.');
  if (patient.supportAtTick === null) return prompt('digoxin-support', true,
    'Get the owners in place for an arrhythmia that has not happened yet.',
    'Poison center or medical toxicology, emergency and critical care, nursing and pharmacy, cardiac and perfusion owners, someone watching the potassium, an airway-capable clinician, and compassionate nonjudgmental safety ownership. She has frequent ectopy without sustained ventricular tachycardia, and atropine and an initial vasopressor have already failed — both of which are reasons to build the room now.');
  if (patient.evidenceAtTick === null) return prompt('digoxin-evidence', true,
    'Read the level with the clock that makes it interpretable, and the potassium as a trajectory rather than a value.',
    'The 8.6 ng/mL was drawn seven hours after the last dose and before any antidote, which is what lets it mean anything. Renal function, magnesium, acid-base and coingestion all sit with it. And the potassium of 6.1 is about to become the opposite problem, because immune Fab pulls it down quickly. What refractory-arrhythmia rescue would mean, and who decides it, belongs here rather than at the arrest.');
  if (patient.reassessmentAtTick === null) return prompt('digoxin-observe', false,
    'Record the intents as intents, let the interval pass, and read the 60-minute report.',
    'The interval is a contrast rather than a required wait or a predicted response time. Nothing here says how any individual poisoning answers.');
  return prompt('digoxin-handoff', true,
    'Hand off the number that is missing as carefully as the ones that are there.',
    'Sinus at 62, MAP 75, potassium down to 4.7, lactate 2.1, no sustained ventricular arrhythmia — none of which proves the treatment did it or that the rhythm will hold. There is deliberately no repeat digoxin concentration, because a standard total assay after Fab measures bound drug and would be clinically misleading; the next team needs to know that rather than to go looking for it. Recurrent arrhythmia, a potassium still falling, renal impairment, the rescue question and her safety all travel with her.');
}
