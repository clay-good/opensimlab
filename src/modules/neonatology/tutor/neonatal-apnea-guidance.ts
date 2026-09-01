import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { NeonatalApneaProgress } from '../neonatal-apnea';

export const NEONATAL_APNEA_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its source as a full citation. Turning it into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citation in full.
 */

/**
 * Observed-state guidance for the minute in which one thing matters.
 *
 * Almost everything a newborn resuscitation can offer is available in this
 * room, and the guidance settles which of it comes first: a newborn who is not
 * breathing by 60 seconds, or whose heart rate is below 100 despite the initial
 * steps, needs assisted ventilation, and effective lung inflation shown by a
 * rising heart rate is the priority. So these prompts keep narrowing rather
 * than widening. They do not reach for oxygen, compressions, access or a cause
 * before the lungs have been inflated, and they do not let the rising number at
 * 90 seconds stand in for durable breathing, a stable transition, neurologic
 * safety or a diagnosis. None of them delivers the ventilation, because that is
 * the qualified team's work.
 */
export function neonatalApneaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly neonatalApnea?: NeonatalApneaProgress;
}) {
  const patient = input.neonatalApnea;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('neonatal-apnea-support', true,
    'Name who owns the ventilation before naming the problem.',
    'A leader, an airway and ventilation owner, someone assessing the heart rate, a timekeeper, a recorder, checked equipment, and a parent who is being spoken to. The airway owner is the role this minute is about; the others are what keep that role from having to do everything.');
  if (patient.contextAtTick === null) return prompt('neonatal-apnea-context', true,
    'Connect the clock to the steps that have already been done.',
    'Forty seconds after a birth that followed a prolonged deceleration, with warmth, positioning, drying, stimulation and airway assessment already completed by qualified staff. Apnea after the initial steps is a different finding from apnea before them, and only one of those is in front of you.');
  if (patient.recognitionAtTick === null) return prompt('neonatal-apnea-recognize', true,
    'Let the threshold decide, not the search for a reason.',
    'Not breathing within the first 60 seconds, or a heart rate under 100 despite initial steps, calls for assisted ventilation. Why he is apneic — the deceleration, hypoxia, sedation, infection, something structural — stays open, and none of it changes what comes first.');
  if (patient.readinessAtTick === null) return prompt('neonatal-apnea-readiness', true,
    'Review effective ventilation, and let the heart rate be the evidence.',
    'Assisted ventilation begun before 60 seconds, chest movement checked, heart-rate response watched, warmth and monitoring maintained. Corrective steps, an alternative airway, oxygen titration, compressions, access and medication are prepared rather than used, because a heart rate that rises means the lungs are being inflated and the rest is not yet indicated.');
  if (patient.reassessmentAtTick === null) return prompt('neonatal-apnea-observe', false,
    'Let the authored interval pass, then read the qualified team’s report.',
    'Ninety seconds is a contrast rather than a required wait or a promised response time. Nothing here says how quickly a real newborn answers effective ventilation.');
  return prompt('neonatal-apnea-handoff', true,
    'Hand off a first answer, and say that it is only the first.',
    'Visible chest movement, a heart rate risen to 126, and irregular respirations emerging mean the ventilation is working. They do not mean he will keep breathing, that the transition is stable, that his brain is safe, or that anyone knows why this happened — and the next team needs each of those named as open.');
}
