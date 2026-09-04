import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsNeonatalSepsis, type NeonatalSepsisAction, type NeonatalSepsisProgress,
} from '../neonatal-sepsis';

export const NEONATAL_SEPSIS_DEMONSTRATION_VERSION = '0.1.0';

export function supportsNeonatalSepsisDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsNeonatalSepsis(scenario);
}

export interface NeonatalSepsisDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: NeonatalSepsisAction; readonly finished?: boolean;
}

/**
 * The worked example for the moment an instrument stops being the answer.
 *
 * The maternal record here is exactly what a risk calculator takes, and the
 * newborn is clinically ill, which is what ends the calculation rather than
 * feeding it. So the example refuses two instruments while escalating on
 * neither: the calculator cannot overrule a sick infant, and no isolated
 * laboratory result can diagnose or exclude early-onset sepsis. It calculates
 * nothing, obtains no culture, selects no antimicrobial and names no dose, and
 * it finishes on a partial response with the culture still pending.
 */
export function neonatalSepsisDemonstrationStep(
  patient?: NeonatalSepsisProgress,
): NeonatalSepsisDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The newborn is handed on better than he was, undiagnosed, with his culture pending and his antibiotics on a clock nobody has set the end of. Escalating was right and it settled nothing. This ends the example, not the illness.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-neonatal-sepsis-newborn-infection-respiratory-circulatory-and-family-support',
      narration: 'Bring the laboratory and the pharmacy in with the clinicians: a trained newborn team, an infection pathway, respiratory and circulatory and airway-ready support, laboratory and pharmacy, transport, the shared clock, communication, dignity, follow-up ownership, and a parent frightened by how fast this changed. Culture and antibiotics are meant to happen close together, and that is a staffing fact before it is a sequencing one.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'actions', progress: 0.24, action: 'reconcile-neonatal-sepsis-maternal-risk-clock-clinical-change-physiology-and-whole-dyad',
      narration: 'Put the maternal record and his own change side by side. Intrapartum temperature 38.6°C, twenty-two hours of ruptured membranes, unknown GBS status, maternal antibiotics an hour before birth — and a newborn who transitioned regularly and is now, at ten hours, lethargic and feeding poorly at 35.9°C, heart rate 172, grunting at 68 with subcostal retractions, saturation 93% in air, refill 4 seconds. The maternal antibiotics are the detail most likely to make a room relax.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.4, action: 'recognize-clinically-ill-newborn-sepsis-risk-without-calculator-laboratory-or-diagnosis-closure',
      narration: 'Let the infant end the calculation, and claim nothing. New multisystem clinical illness after relevant perinatal risk requires immediate qualified sepsis evaluation and treatment. A risk calculator intended to support structured assessment cannot overrule a clinically ill infant, and no isolated blood count, CRP or other laboratory result can diagnose or exclude early-onset sepsis. Escalating is not the same as having diagnosed him.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.56, action: 'review-qualified-neonatal-sepsis-culture-antimicrobial-support-investigation-and-reassessment-boundaries',
      narration: 'Keep the culture clause pointing at the treatment. Blood culture before antibiotics when this does not delay treatment — the clause protects the antibiotics rather than the specimen. Then locally protocolized empiric antimicrobials, respiratory and circulatory and glucose and thermal support, targeted investigation including meningitis when appropriate and safe, serial reassessment, and narrowing or stopping on the complete clinical and microbiologic trajectory. This example selects no agent and names no dose.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'review-neonatal-sepsis-fixed-one-hour-qualified-report',
      narration: 'Let the authored hour pass and read the qualified team’s report. The interval is a contrast rather than a required wait, and nothing here predicts how quickly a real newborn answers whichever regimen his unit uses.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-neonatal-sepsis-respiratory-circulatory-neurologic-culture-family-and-outcome-risk',
    narration: 'Temperature 36.5°C, heart rate 154, respiratory rate 58 with persistent mild retractions, saturation 96% during reported support, refill 3 seconds, glucose 68, blood culture pending. He is better and nothing is settled, so hand off sepsis as undiagnosed, bacteremia and meningitis and other causes as unexcluded, and the antimicrobial duration as a question for the trajectory.' };
}
