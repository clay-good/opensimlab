import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { TermTransitionProgress } from '../term-newborn-transition';

export const TERM_TRANSITION_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for the newborn who needs nothing done to her.
 *
 * Most newborns do not need resuscitation, which makes this the lesson where
 * the pressure runs the other way: not toward a missed intervention but toward
 * an unearned conclusion, and toward small helpful-looking acts — a suction, a
 * quick separation for a check — that this pattern does not call for. So the
 * prompts hold two statements together. Nothing needs to be done to her, and
 * she is not finished being watched. Recognizing a normal transition is a
 * decision assembled from the birth, the breathing, the tone, the heart rate,
 * the temperature and the parents; it is not the absence of one, and it is not
 * a discharge. None of these prompts performs or selects care, because the
 * cord, the drying, the positioning and the feeding are qualified-team work.
 */
export function termTransitionInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly termTransition?: TermTransitionProgress;
}) {
  const patient = input.termTransition;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('term-transition-support', true,
    'Confirm the prepared team before you conclude that nothing is needed.',
    'The team she needs while she looks easy is the same team she needs if she stops breathing at four minutes. A trained newborn-capable clinician, the birth-team roles, the shared clock, the family communication and the support ownership all cost least to establish now.');
  if (patient.contextAtTick === null) return prompt('term-transition-context', true,
    'Assemble the normal rather than sensing it.',
    'Gestation, the antenatal and intrapartum risks, the birth method and clock, breathing or crying, tone, heart rate, temperature, position, airway visibility, the parent and the preferences belong in one sentence. A calm room is not one of those facts.');
  if (patient.recognitionAtTick === null) return prompt('term-transition-recognize', true,
    'Record what this supports, and be exact about what it does not.',
    'Breathing or crying with good tone and an adequate heart rate supports ongoing transition care and no need for resuscitation. That is not a discharge: apnea, respiratory difficulty, thermal instability, glucose, infection and jaundice all stay open, and a low saturation in the first minutes is expected rather than read alone.');
  if (patient.careAtTick === null) return prompt('term-transition-care', true,
    'Name the protective care, including the parts that are omissions.',
    'Deferred cord clamping for at least 60 seconds in most instances of this stable term pattern, prompt drying, protected skin-to-skin with the mouth and nose visible, warm coverings, continued breathing and temperature evaluation, and feeding support. Routine suction, separation, stimulation and supplemental oxygen are not on that list, and leaving them off is the decision.');
  if (patient.reassessmentAtTick === null) return prompt('term-transition-observe', false,
    'Let the authored hour pass, then read the qualified team’s report.',
    'One hour is a contrast rather than a required wait or a promised interval. Nothing here says how long an undisturbed first hour has to run before anyone can relax.');
  return prompt('term-transition-handoff', true,
    'Hand off a quiet hour as a checkpoint, not as a result.',
    'Regular breathing, heart rate 136, 36.7°C and early feeding cues are a good hour and no more than that. Durable respiratory and thermal safety, glucose stability, feeding success and discharge readiness are all unproven, and the next team needs each of them named.');
}
