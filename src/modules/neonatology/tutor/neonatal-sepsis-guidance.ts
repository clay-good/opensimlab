import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { NeonatalSepsisProgress } from '../neonatal-sepsis';

export const NEONATAL_SEPSIS_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for the moment an instrument stops being the answer.
 *
 * The maternal record here is exactly what a risk calculator is built to take:
 * an intrapartum fever, twenty-two hours of rupture, unknown GBS status,
 * antibiotics an hour before birth. And the newborn is clinically ill, which is
 * the finding that ends the calculation rather than feeds it. A calculator
 * intended to support structured assessment cannot overrule a sick infant, and
 * no isolated blood count, CRP or other result can diagnose or exclude
 * early-onset sepsis. So these prompts refuse both instruments in the same
 * breath as they escalate, and they keep the one-hour improvement partial. None
 * of them obtains a culture, selects an antimicrobial, or names a dose, because
 * the regimen is whatever the current local pathway says.
 */
export function neonatalSepsisInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly neonatalSepsis?: NeonatalSepsisProgress;
}) {
  const patient = input.neonatalSepsis;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.supportAtTick === null) return prompt('neonatal-sepsis-support', true,
    'Bring the laboratory and the pharmacy in with the clinicians.',
    'A trained newborn team, an infection pathway, respiratory and circulatory and airway-ready support, laboratory and pharmacy, transport, the shared clock, communication, dignity, follow-up ownership, and a frightened parent. Culture and antibiotics are meant to happen close together, and that is a staffing fact before it is a sequencing one.');
  if (patient.contextAtTick === null) return prompt('neonatal-sepsis-context', true,
    'Put the maternal record and the newborn’s own change side by side.',
    'Intrapartum temperature 38.6°C, twenty-two hours of ruptured membranes, unknown GBS status, maternal antibiotics an hour before birth — and a newborn who transitioned regularly and is now, at ten hours, lethargic and feeding poorly at 35.9°C with a heart rate of 172, grunting at 68, and refill of 4 seconds. The maternal antibiotics are the detail most likely to make a room relax.');
  if (patient.recognitionAtTick === null) return prompt('neonatal-sepsis-recognize', true,
    'Let the infant end the calculation, and claim nothing.',
    'New multisystem illness after relevant perinatal risk requires immediate qualified sepsis evaluation and treatment. A risk calculator intended to support structured assessment cannot overrule a clinically ill infant, and no isolated blood count, CRP or other result can diagnose or exclude early-onset sepsis. Escalating is not the same as having diagnosed him.');
  if (patient.readinessAtTick === null) return prompt('neonatal-sepsis-readiness', true,
    'Keep the culture clause pointing at the treatment.',
    'Blood culture before antibiotics when this does not delay treatment — the clause protects the antibiotics, not the specimen. Then locally protocolized empiric antimicrobials, respiratory, circulatory, glucose and thermal support, targeted investigation including meningitis when appropriate and safe, serial reassessment, and narrowing or stopping on the whole clinical and microbiologic trajectory. This lesson selects no agent and names no dose.');
  if (patient.reassessmentAtTick === null) return prompt('neonatal-sepsis-observe', false,
    'Let the authored interval pass, then read the qualified team’s report.',
    'One hour is a contrast rather than a required wait or a promised response time. Nothing here says how quickly a real newborn answers whichever regimen his unit uses.');
  return prompt('neonatal-sepsis-handoff', true,
    'Hand off a partial response and a pending culture.',
    'Temperature 36.5°C, heart rate 154, rate 58 with persistent retractions, saturation 96% on support, refill 3 seconds, glucose 68, culture pending. He is better and nothing is settled: sepsis is not diagnosed, bacteremia and meningitis are not excluded, other causes are not excluded, the duration is not determined, and stewardship is a question for the trajectory rather than for tonight.');
}
