import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MeconiumTransitionProgress } from '../meconium-stained-transition';

export const MECONIUM_TRANSITION_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for two negatives that are not the same negative.
 *
 * Routine suctioning is not recommended solely because the fluid is meconium
 * stained, and the parent in this room has asked for it directly. Declining is
 * the right answer and the easy half. The hard half is that declining the
 * suction excludes nothing: at thirty minutes of regular breathing, evolving
 * meconium aspiration and other respiratory disease are both still open, and
 * "she does not need suctioning" and "she is fine" are different sentences.
 * These prompts keep them apart. None of them suctions, positions, handles a
 * device or manages an airway, because that is the qualified team's work.
 */
export function meconiumTransitionInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly meconiumTransition?: MeconiumTransitionProgress;
}) {
  const patient = input.meconiumTransition;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('meconium-support', true,
    'Confirm airway-ready attendance, which is what the meconium actually changes.',
    'A trained newborn-capable clinician, an airway-ready birth team, the shared clock, communication, dignity and parent support. Meconium-stained fluid does not call for a suction; it calls for someone present who could clear an airway if this newborn stopped looking like this one.');
  if (patient.contextAtTick === null) return prompt('meconium-context', true,
    'Describe the newborn rather than the fluid.',
    'Forty weeks and one day, thin meconium staining, thirty seconds elapsed, spontaneous breathing with a strong cry, good flexed tone, heart rate 138, 36.8°C, mouth and nose visible, no apparent obstruction, skin-to-skin with an awake parent. Every one of those except the staining is about her.');
  if (patient.recognitionAtTick === null) return prompt('meconium-recognize', true,
    'Say what is not indicated without saying what is excluded.',
    'Routine oral, nasal or tracheal suctioning is not recommended solely because fluid is meconium stained, and a newborn who breathes well or cries can stay in protected transition care. That declines an intervention. It does not exclude meconium aspiration, and it does not make her well.');
  if (patient.readinessAtTick === null) return prompt('meconium-readiness', true,
    'Review what would change the answer, so the answer stays a decision.',
    'Airway clearing is reserved for apparent obstruction. If ventilation becomes necessary and appears obstructed, selective mouth or nose suction may be considered, and tracheal suction belongs only to the uncommon apparent tracheal-obstruction branch when ventilation stays ineffective despite corrective steps. Knowing the trigger is what makes declining now something other than a habit.');
  if (patient.reassessmentAtTick === null) return prompt('meconium-observe', false,
    'Let the authored interval pass, then read the qualified team’s report.',
    'Thirty minutes is a contrast rather than a required wait or a safe observation period. Nothing here says how long a newborn who passed meconium has to breathe well before anyone stops watching.');
  return prompt('meconium-handoff', true,
    'Hand off the two negatives separately.',
    'Regular breathing without apnea, grunting, retractions or cyanosis, heart rate 132, saturation 96%, 36.7°C. No suction was indicated and none was needed. Evolving meconium aspiration is not excluded, other respiratory disease is not excluded, and the next team needs those as two open questions rather than one closed one.');
}
