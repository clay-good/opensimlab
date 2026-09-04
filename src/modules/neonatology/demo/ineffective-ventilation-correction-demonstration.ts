import type { Scenario } from '@anesthesia/scenarios/types';
import { PREPARING_NARRATION } from '@anesthesia/demo/demonstration';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsIneffectiveVentilation, type IneffectiveVentilationAction, type IneffectiveVentilationProgress,
} from '../ineffective-ventilation-correction';

export const INEFFECTIVE_VENTILATION_DEMONSTRATION_VERSION = '0.1.0';

export function supportsIneffectiveVentilationDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsIneffectiveVentilation(scenario);
}

export interface IneffectiveVentilationDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: IneffectiveVentilationAction; readonly finished?: boolean;
}

/**
 * The worked example for the moment before the next intervention.
 *
 * A demonstration wants to escalate, because a newborn who is not responding
 * makes escalation feel like the only active choice. This one corrects instead,
 * and says why: the compression threshold has two halves and the second one has
 * not been met, because the ventilation has not yet been adequate. It handles
 * no mask, selects no pressure, places no airway and gives no compressions, and
 * it finishes on a correction that worked without ruling out the airway or lung
 * disease that might still be underneath it.
 */
export function ineffectiveVentilationDemonstrationStep(
  patient?: IneffectiveVentilationProgress,
): IneffectiveVentilationDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: PREPARING_NARRATION, focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'The newborn is handed on ventilating well after a correction, with the reason for the first thirty seconds unknown, her airway and lungs not cleared, and a leak that could recur. Correcting worked. Nothing here established that it was enough. This ends the example, not the resuscitation.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-ineffective-neonatal-ventilation-qualified-airway-ventilation-clock-and-dyad-response',
      narration: 'Get the airway help here before the ventilation gets harder: a leader, an airway and ventilation owner, a heart-rate assessor, monitoring, a timekeeper, a recorder, checked equipment, and a parent who cannot see her newborn and has asked for an update. Help called during a failing resuscitation arrives later than help called at the start of one.' };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'actions', progress: 0.24, action: 'reconcile-ineffective-neonatal-ventilation-birth-clock-interface-chest-movement-heart-rate-and-whole-dyad',
      narration: 'Put the two clocks and the interface in one sentence. Eighty seconds old after a cesarean birth at thirty-eight weeks and six days, thirty of those seconds spent on face-mask ventilation, no visible chest movement, heart rate 82 down to 78, preductal saturation 68% on a reliable signal, 36.5°C. This is ventilation that has been tried and has not worked.' };
  }
  if (patient.recognitionAtTick === null) {
    return { id: 'recognize', focus: 'actions', progress: 0.4, action: 'recognize-ineffective-neonatal-ventilation-from-absent-heart-rate-rise-without-cause-closure',
      narration: 'Read the heart rate as the primary sign and leave the reason open. A rise in heart rate is what says ventilation is effective; chest movement is secondary and the saturation is neither. There is no rise, so it is not working — and whether that is leak, obstruction, position, delivered pressure, equipment or the lungs themselves stays open.' };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.56, action: 'review-qualified-neonatal-ventilation-correction-alternative-airway-and-compression-boundary',
      narration: 'Correct before escalating, and keep the compression threshold attached to its second half. The qualified team corrects the common mask leak and airway obstruction, reassesses position, delivered ventilation, chest movement, heart rate and equipment, and uses an alternative airway when needed. Compressions come only if the heart rate stays under 60 despite adequate ventilation after corrective steps, and at 78 with ventilation that has not yet worked, neither half of that is true.' };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'report', focus: 'monitor', progress: 0.76, action: 'review-ineffective-neonatal-ventilation-fixed-two-minute-qualified-response-report',
      narration: 'Let the authored two minutes pass and read the qualified team’s report. The interval is a contrast rather than a required wait, and nothing here predicts how quickly a real leak is found or how fast a chest answers once it is.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.9, action: 'handoff-ineffective-neonatal-ventilation-airway-respiratory-neurologic-parent-and-outcome-risk',
    narration: 'Leak corrected, chest movement visible, heart rate risen to 118, preductal saturation 76% on the same signal, irregular respirations emerging. The ventilation is effective now, so hand off the recurrence of that leak, the airway and lung disease nobody has excluded, the neurologic uncertainty and the unexplained first thirty seconds.' };
}
