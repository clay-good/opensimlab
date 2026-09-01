import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { NeonatalBradycardiaProgress } from '../neonatal-bradycardia';

export const NEONATAL_BRADYCARDIA_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its source as a full citation. Turning it into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citation in full.
 */

/**
 * Observed-state guidance for the one lesson here where the threshold is met.
 *
 * Compressions are indicated when the heart rate stays below 60 despite 30
 * seconds of ventilation that inflates the lungs, and this newborn satisfies
 * both halves: 48 per minute after correction, an alternative airway, and
 * visible chest movement. So the prompts do not argue against the branch. They
 * insist on the evidence that opens it, and then refuse the inference that
 * closes it: at three minutes the heart rate is 74 after a minute of
 * coordinated compressions, and one authored newborn getting better after a
 * treatment does not establish that the treatment is why. None of them
 * compresses, ventilates, places an airway, or gives a drug, because that is
 * the qualified team's work.
 */
export function neonatalBradycardiaInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly neonatalBradycardia?: NeonatalBradycardiaProgress;
}) {
  const patient = input.neonatalBradycardia;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('neonatal-bradycardia-support', true,
    'Staff the compressions and the ventilation as two jobs, not one.',
    'A leader, a ventilation and airway owner, a compression owner, someone reading the heart rate, monitoring, a timekeeper, a recorder, access and medication ready, and a parent who cannot see his newborn and has asked a direct question. Coordinated support needs enough hands that neither half is done between other tasks.');
  if (patient.contextAtTick === null) return prompt('neonatal-bradycardia-context', true,
    'Connect the evidence that the ventilation was already adequate.',
    'Two minutes old after an emergency cesarean for abruption concern, ventilation corrected, an alternative airway placed, and 30 seconds of ventilation that visibly inflated the chest — and the heart rate is still 48. That history is what makes this the compression branch rather than another correction.');
  if (patient.recognitionAtTick === null) return prompt('neonatal-bradycardia-recognize', true,
    'Name both halves of the threshold, in the order they were met.',
    'Compressions are indicated when the heart rate stays below 60 despite 30 seconds of ventilation that inflates the lungs. Ventilation is optimized first, and here it already was. Being right about the number still requires having established the ventilation, and skipping that verification is how the branch gets opened on newborns who only needed a better seal.');
  if (patient.readinessAtTick === null) return prompt('neonatal-bradycardia-readiness', true,
    'Review coordination now, and keep epinephrine on the far side of it.',
    'Coordinated compressions and ventilation, heart-rate reassessment, warmth, oxygenation monitoring, access and medication prepared. Epinephrine belongs to a later branch that opens only if the heart rate does not reach 60 after optimized ventilation and compressions, and preparing it is not the same as reaching it.');
  if (patient.reassessmentAtTick === null) return prompt('neonatal-bradycardia-observe', false,
    'Let the authored interval pass, then read the qualified team’s report.',
    'Three minutes is a contrast rather than a required wait or a promised response time. Nothing here says how quickly a real newborn answers coordinated support.');
  return prompt('neonatal-bradycardia-handoff', true,
    'Hand off the improvement without handing off a reason for it.',
    'A heart rate of 74 after a minute of coordinated compressions, saturation 71%, compressions stopped, ventilation continuing. He got better after a treatment; that is not evidence the treatment is why, and one authored newborn cannot supply that evidence. Recurrent bradycardia, circulation, breathing, the abruption, the neurologic question and the parents all stay open.');
}
