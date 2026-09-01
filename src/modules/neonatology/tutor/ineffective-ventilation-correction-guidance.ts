import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { IneffectiveVentilationProgress } from '../ineffective-ventilation-correction';

export const INEFFECTIVE_VENTILATION_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its source as a full citation. Turning it into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citation in full.
 */

/**
 * Observed-state guidance for the moment before the next intervention.
 *
 * A newborn who is not responding invites escalation, and the guidance says to
 * correct first: when the heart rate stays below 100 and does not rise during
 * face-mask ventilation, fix the common leak and obstruction, reassess, and use
 * an alternative airway when needed. The compression threshold has two halves —
 * below 60 *and* despite adequate ventilation after corrective steps — and the
 * second half is the one that gets dropped. So these prompts keep the clause
 * attached to the number, keep the cause of the failed ventilation open, and
 * never treat the falling saturation as the primary sign. None of them handles
 * a mask, selects a pressure, or places an airway, because that is the
 * qualified team's work.
 */
export function ineffectiveVentilationInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly ineffectiveVentilation?: IneffectiveVentilationProgress;
}) {
  const patient = input.ineffectiveVentilation;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('ineffective-ventilation-support', true,
    'Get the airway help here before the ventilation gets harder.',
    'A leader, an airway and ventilation owner, someone watching the heart rate, monitoring, a timekeeper, a recorder, checked equipment, and a parent who cannot see her newborn and has asked. Help called during a failing resuscitation arrives later than help called at the start of one.');
  if (patient.contextAtTick === null) return prompt('ineffective-ventilation-context', true,
    'Put the two clocks and the interface in the same sentence.',
    'Eighty seconds old, thirty of them spent on face-mask ventilation, with no visible chest movement and a heart rate that went from 82 to 78. The interval matters as much as the numbers: this is ventilation that has been tried and has not worked, not ventilation that has not started.');
  if (patient.recognitionAtTick === null) return prompt('ineffective-ventilation-recognize', true,
    'Read the heart rate as the primary sign, and leave the reason open.',
    'A rise in heart rate is the sign that ventilation is effective; chest movement is secondary and the saturation is neither. Absent rise means it is not working. Whether that is leak, obstruction, position, delivered pressure, equipment, or the lungs themselves stays open, and the correction is the same for most of them.');
  if (patient.readinessAtTick === null) return prompt('ineffective-ventilation-readiness', true,
    'Keep the compression threshold attached to its second half.',
    'Correct the common mask leak and airway obstruction, reassess position, delivered ventilation, chest movement, heart rate and equipment, and use an alternative airway when needed. Compressions come only if the heart rate stays under 60 despite adequate ventilation after corrective steps — and at 78 with ventilation that has not yet worked, neither half of that is true.');
  if (patient.reassessmentAtTick === null) return prompt('ineffective-ventilation-observe', false,
    'Let the authored interval pass, then read the qualified team’s report.',
    'Two minutes is a contrast rather than a required wait or a promised correction time. Nothing here says how quickly a real leak is found or how fast a chest answers once it is.');
  return prompt('ineffective-ventilation-handoff', true,
    'Hand off a correction that worked, and the disease it did not rule out.',
    'A corrected leak, visible chest movement, a heart rate at 118 and a saturation climbing to 76% say the ventilation is now effective. They do not say she will keep breathing, that her airway and lungs are normal, that her brain is safe, or why the first thirty seconds failed — and a leak that was corrected once can recur.');
}
