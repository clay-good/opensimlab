import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MagnesiumToxicityProgress } from '../magnesium-sulfate-toxicity-recognition';

export const MAGNESIUM_TOXICITY_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for the quietest emergency in the module.
 *
 * Nothing here looks like a crisis. She is drowsy but rousable, her pressure
 * is normal, her saturation is 94%, and she is breathing nine times a minute
 * without any appearance of struggling — which is what magnesium does, and why
 * this is missed. The error this lesson refuses is spending the interval
 * establishing how poisoned she is: her reflexes are already gone and her
 * respiratory rate is already nine, which is the assessment, and the level was
 * drawn before the infusion stopped so it describes a moment that has passed.
 * None of these prompts examines her, changes an infusion, manages an airway,
 * delivers oxygen or ventilation, or selects calcium or any other drug.
 */
export function magnesiumToxicityInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly magnesiumToxicity?: MagnesiumToxicityProgress;
}) {
  const patient = input.magnesiumToxicity;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('magnesium-support', true,
    'Get someone who can manage an airway here now, before you work anything out.',
    'A respiratory rate of nine with absent reflexes is respiratory failure arriving quietly, and the thing that makes magnesium toxicity dangerous is that it does not look dramatic until it is very late. Airway-capable anesthesia, obstetrics, critical care, pharmacy and support ownership all start now, while the assessment continues around them rather than before them.');
  if (patient.contextAtTick === null) return prompt('magnesium-context', true,
    'Read the exposure and the kidneys together — that is the whole mechanism.',
    'She had a 4 g load and has been running 2 g an hour for twelve hours, and magnesium is cleared almost entirely by the kidneys. Her urine output has fallen to 70 mL in four hours and her creatinine has gone from 0.8 to 1.9. The dose never changed; her ability to remove it did. Over thirty-five minutes that has produced drowsiness, slurred speech, weakness, absent patellar reflexes and a respiratory rate of nine.');
  if (patient.uncertaintyAtTick === null) return prompt('magnesium-uncertainty', true,
    'Let the clinical signs lead and treat the number as a supporting document.',
    'Magnesium levels are reported in three different units — 11.8 mg/dL is the same as 4.85 mmol/L and 9.7 mEq/L — and mixing them up is a documented source of error, so a number without its unit means nothing. This one was also drawn before the infusion was stopped, so it describes a moment that has already passed. The reflexes and the breathing are the assessment. And magnesium is not the only possible explanation: postpartum complications, other medicines, an airway or neurological cause, a metabolic derangement and a cardiopulmonary event all stay open.');
  if (patient.readinessAtTick === null) return prompt('magnesium-readiness', true,
    'Hold the source-stop, the airway and the antidote as one parallel readiness.',
    'The infusion is already stopped and isolated by qualified staff, which removes the cause but not the magnesium already in her. Airway and ventilation readiness, the calcium antidote, continuous monitoring of breathing and reflexes rather than intermittent checks, the newborn who is somewhere else, and support for her all belong to the same moment. Stopping the drug is the beginning of this rather than the end of it.');
  if (patient.reassessmentAtTick === null) return prompt('magnesium-reassess', false,
    'Read the fixed 5-minute report as a partial response rather than a reversal.',
    'It is a contrast rather than a predicted trajectory, and nothing here says how any individual magnesium level falls once the infusion stops.');
  return prompt('magnesium-handoff', true,
    'Hand off someone who is better and still full of magnesium.',
    'A partial response is not a reversal: nothing here establishes complete recovery, cleared magnesium, recovered kidneys, a treatment effect, or a safe newborn. The respiratory and neurologic risk, the renal function that caused this, the severe preeclampsia she still has and the seizure prophylaxis question it raises, the medication review, the newborn, what she has just been through, and the disposition all travel with her.');
}
