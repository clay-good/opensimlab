import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { HhsOsmolalityProgress } from '../hhs-osmolality';

export const HHS_OSMOLALITY_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for an illness whose reassuring numbers are the trap.
 *
 * Ketones are 1.1 and the pH is 7.36, and a reader who stops there has found a
 * mild presentation. What is severe is the osmolality, the dehydration and the
 * cognitive change, which have to be read together — and the later report is
 * the same trap a second time, because glucose falling and pressure improving
 * are not resolution while she is still hyperosmolar and still below her own
 * baseline. So the prompts point at which numbers belong to the same sentence.
 * None of them says whether she is getting better; that is the reading the
 * learner records.
 */
export function hhsOsmolalityInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly hhsOsmolality?: HhsOsmolalityProgress;
}) {
  const patient = input.hhsOsmolality;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('hhs-support', true,
    'Confirm who owns fluid, insulin timing, electrolytes, the kidneys, and the heart.',
    'Cautious correction in a 74-year-old with heart failure and chronic kidney disease is several people’s judgement at once. Naming them first is what makes the later surveillance somebody’s job.');
  if (patient.contextAtTick === null) return prompt('hhs-context', true,
    'Connect four days of symptoms to the numbers in front of you.',
    'Thirst, polyuria, falling intake and rising confusion are the same illness as the glucose and the osmolality. Read apart, one is a history and the other is a panel; read together they are a trajectory with a speed.');
  if (patient.recognitionAtTick === null) return prompt('hhs-recognize', true,
    'Read the osmolality, the dehydration and the cognition as one finding.',
    'Ketones of 1.1 and a pH of 7.36 answer whether this is ketoacidosis, not whether it is serious. Absent marked ketoacidosis is not a mild illness, and neither the glucose nor the sodium alone carries the severity.');
  if (patient.readinessAtTick === null) return prompt('hhs-readiness', true,
    'Review what cautious correction has to be followed by, not what it should be.',
    'Osmolality trajectory, potassium, urine output, fluid balance, cardiac and kidney tolerance, the precipitant, thrombosis and pressure-injury prevention, and escalation for new neurologic change. A sodium that rises as the glucose falls does not by itself call for hypotonic fluid, and this lesson selects no fluid, insulin, dose or rate.');
  if (patient.reassessmentAtTick === null) return prompt('hhs-observe', false,
    'Let the authored interval pass, then read the qualified team’s report.',
    'The four hours are a contrast rather than a required wait. The average rates in the report describe what happened here; they are not a target and not a safe interval between measurements.');
  return prompt('hhs-handoff', true,
    'Hand off what is still moving, not what has improved.',
    'A lower glucose, a better pressure and a falling osmolality are three things going the right way. She is still hyperosmolar, still passing 0.4 mL/kg/h, and still below her usual cognition, and the precipitant is still under assessment. Those are what the next team has to keep watching.');
}
