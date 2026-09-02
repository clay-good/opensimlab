import type { GuidanceLevel } from '@anesthesia/tutor/guidance';
import type { MaternalSepsisProgress } from '../maternal-sepsis-postpartum-deterioration';

export const MATERNAL_SEPSIS_TUTOR_VERSION = '0.1.0';

/**
 * These prompts carry no external link, deliberately.
 *
 * This lesson declares its sources as full citations. Turning one into a URL
 * would be a construction rather than a lookup, and the source view already
 * shows the declared citations in full.
 */

/**
 * Observed-state guidance for an emergency that is already fully assembled.
 *
 * Nothing here is waiting to be discovered. Suspected infection and organ
 * dysfunction that nothing else explains are both already on the page, and the
 * error this lesson refuses is spending the next interval confirming them — a
 * score, a culture, a named source. Scores were built to compare populations
 * rather than to permit treatment, and the source is often not found until
 * later or at all. The second refusal is the mirror of the first: naming sepsis
 * does not close pulmonary embolism, hemorrhage, a hypertensive disorder, or a
 * medication effect, all of which can look like this. None of these prompts
 * calculates a score, acquires a culture or sample, selects an antimicrobial,
 * fluid or vasopressor, or performs source control.
 */
export function maternalSepsisInlinePrompt(level: GuidanceLevel, input: {
  readonly scenarioVersion: string;
  readonly maternalSepsis?: MaternalSepsisProgress;
}) {
  const patient = input.maternalSepsis;
  if (level === 'unassisted' || input.scenarioVersion !== '0.1.0' || !patient) return null;
  if (patient.handoffAtTick !== null) return null;
  const prompt = (id: string, urgent: boolean, suggestion: string, because: string) =>
    level === 'coached' && !urgent ? null : { id, suggestion, because };

  if (patient.trajectoryAtTick === null) return prompt('sepsis-trajectory', true,
    'Put the infection and the failing organs in the same view before anything else.',
    'Thirty-eight hours after a cesarean birth that followed a day of ruptured membranes: 39.1°C, a heart rate of 132, a pressure of 88/52, breathing at 28, a tender uterus and malodorous lochia — and, separately, slowed responses, falling urine output, a creatinine that has doubled to 1.4, and a lactate of 4.2. The infection is the easy half. The organ dysfunction is the half that says how little time there is.');
  if (patient.recognitionAtTick === null) return prompt('sepsis-recognition', true,
    'Call it a maternal-sepsis emergency now, and do not wait for a score or a source.',
    'Suspected infection plus organ dysfunction nothing else explains is the whole definition; a screening score exists to compare populations rather than to permit treatment, and the source is frequently not identified until later or at all. Naming it also closes nothing — pulmonary embolism, concealed hemorrhage, a hypertensive disorder and a medication effect can all present like this and stay open behind the name.');
  if (patient.supportAtTick === null) return prompt('sepsis-support', true,
    'Bring every owner at once, source control and microbiology included.',
    'Obstetrics, critical care, anesthesia, nursing, pharmacy, microbiology, source control, organ support, newborn support and dignity-centered ownership start together rather than in sequence, because source control is the slowest of them to arrange and the one most often started last. She is thirty-eight hours postpartum with a newborn somewhere else — the newborn support and the privacy are part of the response rather than courtesies added to it.');
  if (patient.evidenceAtTick === null) return prompt('sepsis-evidence', true,
    'Read the supplied evidence as a boundary rather than an answer.',
    'The temperature, the white count, the tender uterus and the lochia point at an obstetric source; the creatinine and the lactate say organs are involved. None of that identifies the source, and none of it excludes the noninfectious causes. Cultures are drawn without delaying anything, and no single value here is a decision.');
  if (patient.reassessmentAtTick === null) return prompt('sepsis-reassess', false,
    'Record the bounded intent, let the interval pass, and read the 30-minute report.',
    'The interval is a contrast rather than a required wait or a predicted response time. Nothing here says how fast any individual sepsis turns around.');
  return prompt('sepsis-handoff', true,
    'Hand off better numbers, a source nobody has controlled, and everything still pending.',
    'A rate of 122, a pressure of 94/58, clearer responses and an unchanged temperature — none of which proves the antimicrobials are working, that the shock is resolving, or that her kidneys will recover. The repeat lactate and the urine output are pending, source control is unresolved, and the antimicrobial review, the thromboembolism risk, her feeding and newborn support, and the disposition all travel with her.');
}
