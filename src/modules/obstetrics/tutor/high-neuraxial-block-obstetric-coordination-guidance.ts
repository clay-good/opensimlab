import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { HighNeuraxialProgress } from '../high-neuraxial-block-obstetric-coordination';

export const HIGH_NEURAXIAL_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for a block that is still climbing.
 *
 * Ninety seconds took her from a working epidural to a weak voice, failing
 * hands and a sensory level at C6. The error this lesson refuses is measuring
 * the block before calling for help, because the level being measured is the
 * one that has already been passed. The thing that is easiest to forget is
 * that she is awake through all of it: frightened, unable to breathe properly,
 * and about to be surrounded by people. None of these prompts examines her,
 * assesses the block, manages an airway, delivers oxygen or ventilation, or
 * selects an anesthetic or a birth plan.
 */
export function highNeuraxialInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly highNeuraxial?: HighNeuraxialProgress;
}) {
  const patient = input.highNeuraxial;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('neuraxial-support', true,
    'Call for airway-capable help now, and have someone stay at her head.',
    'A block that reached C6 in ninety seconds has not stopped there, so any level you establish is the one it has already passed. Anesthesia, obstetrics, theatre, the newborn team and support ownership start now. Someone staying with her and talking to her is not a courtesy here: she is fully awake, her voice is failing, and she can feel herself losing the ability to breathe.');
  if (patient.contextAtTick === null) return prompt('neuraxial-context', true,
    'Read the clock, the level and the arms as one ascending line.',
    'An epidural top-up four minutes ago, then ninety seconds of ascending numbness, weakening arms, a weak voice and difficulty breathing, with a supplied sensory level at C6 and worsening grip. The arms are the useful sign — hand weakness means the block is at the level that runs the diaphragm. Alongside that: a heart rate of 52, a pressure of 78/42, and a fetal baseline of 90. Every one of those is the same event.');
  if (patient.uncertaintyAtTick === null) return prompt('neuraxial-uncertainty', true,
    'Hold the high block as the leading explanation without letting it close the rest.',
    'Rapid ascent after a top-up makes a high block the obvious reading, but a vasovagal event, aortocaval compression, local-anesthetic systemic toxicity, an embolic event, hemorrhage and a cardiopulmonary cause all present into this same picture and stay open. The product, concentration, dose, catheter position and true block extent are unresolved, and being awake and frightened is part of the presentation rather than a detail beside it.');
  if (patient.readinessAtTick === null) return prompt('neuraxial-readiness', true,
    'Let the airway, the circulation and the birth readiness run at once.',
    'Airway and ventilation support, circulatory support, the manual uterine displacement that qualified staff have already begun, fetal surveillance at a baseline of 90, the birth that may have to happen anyway, and continuous reassurance all belong to the same moment rather than a sequence. If she needs her airway secured she may also need an anesthetic she can no longer tell you about, which is why the awareness question is raised now rather than afterwards.');
  if (patient.reassessmentAtTick === null) return prompt('neuraxial-reassess', false,
    'Read the fixed 4-minute report as partial support rather than resolution.',
    'It is a contrast rather than a predicted trajectory, and nothing here says how any individual block recedes.');
  return prompt('neuraxial-handoff', true,
    'Hand off a block that has not receded and a birth that has not happened.',
    'Nothing here establishes block recession, fetal recovery, a treatment effect, a safe newborn, or that she was unaware of any of it. The airway and respiratory risk, the circulation, the block level, the fetal status, the birth decision, the awareness question, what she has just experienced while fully conscious, and the disposition all travel with her.');
}
