import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { DkaResolutionProgress } from '../dka-resolution';

export const DKA_RESOLUTION_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a resolution that glucose does not decide.
 *
 * The trap here is a number that has moved. Glucose has come down from 468 to
 * 184 mg/dL, the pH has come up, the anion gap has closed, and none of those is
 * the criterion. So the prompts never announce whether this patient has
 * resolved — that recognition is the lesson, and the learner records it. They
 * name which two measurements the criteria are written in, and they keep the
 * hyperchloremic explanation open rather than closing it.
 */
export function dkaResolutionInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly dkaResolution?: DkaResolutionProgress;
}) {
  const patient = input.dkaResolution;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('dka-resolution-support', true,
    'Confirm who owns insulin, electrolytes, nutrition, education, and the transition.',
    'A bridged transition fails at the seams rather than in the middle. Naming the owners first is what makes the later handoff a list of people rather than a list of hopes.');
  if (patient.contextAtTick === null) return prompt('dka-resolution-context', true,
    'Connect the first panel, the treatment clock, and the current one.',
    'Eight hours of qualified treatment sit between two sets of numbers. Reading the second set without the first leaves you with a value rather than a trajectory, and the trajectory is what the criteria are about.');
  if (patient.recognitionAtTick === null) return prompt('dka-resolution-recognize', true,
    'Read the ketone and the bicarbonate against the resolution criteria, not the glucose.',
    'Resolution is written as plasma ketone below 0.6 mmol/L plus venous pH at least 7.3 or bicarbonate at least 18 mmol/L. Glucose, a closed anion gap, and urine ketones each answer a different question, and a chloride of 112 keeps a hyperchloremic explanation open besides.');
  if (patient.readinessAtTick === null) return prompt('dka-resolution-readiness', true,
    'Review what qualified continuity requires while ketoacidosis persists.',
    'Insulin continues with dextrose rather than stopping when glucose falls, and potassium, kidney function and acid-base are followed serially. This lesson selects no drug, dose, rate or fluid; the boundary is what you would be asking the team for.');
  if (patient.reassessmentAtTick === null) return prompt('dka-resolution-observe', false,
    'Let the authored interval pass, then read the qualified team’s report.',
    'The 4 hours are a contrast rather than a required clinical wait or a safe interval between checks. Nothing here predicts how fast a real patient’s ketones fall.');
  return prompt('dka-resolution-handoff', true,
    'Hand off recurrence risk, not a resolved case.',
    'The panel meets the biochemical criteria and a basal dose was given two hours ago. That is one overlap in progress. It is not proven insulin access, durable glucose or potassium stability, a treated precipitant, or discharge readiness — and those are exactly what the next team needs named.');
}
