import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MethanolProgress } from '../methanol-visual-acidosis-gaps';

export const METHANOL_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for two numbers that look like an answer.
 *
 * The gaps are the most satisfying thing at this bedside and the least
 * conclusive. Both are wide here at fourteen hours, but the pair moves with the
 * clock — the osmolar gap is the parent alcohol and falls as it is metabolized,
 * the anion gap is the acid it becomes and rises — so a narrow one later would
 * exclude nothing, and neither of them settles what this is. What is not a clue
 * is the vision: snowfield blurring at fourteen hours is injury already
 * underway. So the prompts keep the gaps as clues, put the acid ahead of the
 * concentration, and refuse the five ways this gets closed early. None of them
 * calculates a gap, interprets a laboratory value, or selects a product, dose,
 * route, airway, or extracorporeal modality.
 */
export function methanolInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly methanol?: MethanolProgress;
}) {
  const patient = input.methanol;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('methanol-trajectory', true,
    'Say the vision and the clock together, because one dates the other.',
    'Fourteen hours after a supplied windshield-washer-fluid ingestion, with nausea, headache, snowfield-like blurring, a respiratory rate of 30 and confusion. The breathing is not distress, it is the acidosis being blown off, and the blurred vision at this point in the clock is injury that is already happening rather than a symptom to be observed.');
  if (patient.recognitionAtTick === null) return prompt('methanol-recognize', true,
    'Read the two gaps as a pair on a clock, and refuse the five ways this gets closed early.',
    'Neither the source report, the vision, the anion gap, the osmolar gap nor a concentration diagnoses or grades him alone. The pair is the useful part: the osmolar gap is the parent alcohol and shrinks as it is metabolized, while the anion gap is what it becomes and grows — so both being wide at fourteen hours is worth saying out loud, and a narrow osmolar gap later would exclude nothing. Ketoacidosis, uremia, lactic acidosis, salicylate, ethylene glycol, isopropanol and coingestion all stay open.');
  if (patient.supportAtTick === null) return prompt('methanol-support', true,
    'Find the antidote, extracorporeal, airway and ophthalmic owners now rather than after a number.',
    'Blocking further metabolism and removing what has already been made are two different jobs with two different owners, and only one of them is quick to arrange. Waiting on a concentration before calling anyone spends the interval in which the acid is still being produced. Emergency, critical care, nursing, pharmacy, the poison center, the laboratory, nephrology and ophthalmology start together.');
  if (patient.evidenceAtTick === null) return prompt('methanol-evidence', true,
    'Notice which acid this is not, and keep every gap a clue.',
    'A pH of 7.19 with a bicarbonate of 7 and an anion gap of 31 sitting next to a lactate of 2.4 says the acid is not lactate and is not being measured. The ethanol below the reporting limit removes one thing that would have masked it rather than confirming what is there, and the creatinine of 1.2 matters for what comes next rather than for the diagnosis. No gap, level, or threshold here establishes antidote or extracorporeal eligibility, and this lesson determines neither.');
  if (patient.reassessmentAtTick === null) return prompt('methanol-observe', false,
    'Record the intents as intents, let the interval pass, and read the 45-minute report.',
    'The interval is a contrast rather than a required wait or a predicted response time. Nothing here says how fast any individual acidosis corrects.');
  return prompt('methanol-handoff', true,
    'Hand off a better pH and an eye that has not changed.',
    'pH 7.27, bicarbonate 10, a heart rate of 106 — and the blurred vision and the confusion are exactly where they were. A partially corrected acidosis is not cleared toxin, and none of this proves his sight, his kidneys or his acid-base will hold. Recurrent acidosis, the visual and neurologic injury, the airway, electrolytes, coingestion, exposure completeness and whether the extracorporeal course finishes all travel with him.');
}
