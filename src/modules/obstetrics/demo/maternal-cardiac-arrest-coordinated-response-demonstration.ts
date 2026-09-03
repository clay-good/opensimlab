import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMaternalArrest, type MaternalArrestAction, type MaternalArrestProgress,
} from '../maternal-cardiac-arrest-coordinated-response';
import { maternalArrestInlinePrompt } from '../tutor/maternal-cardiac-arrest-coordinated-response-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: MaternalArrestProgress): string {
  const prompt = maternalArrestInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalArrest: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const MATERNAL_ARREST_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMaternalArrestDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMaternalArrest(scenario);
}

export interface MaternalArrestDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MaternalArrestAction; readonly finished?: boolean;
}

/**
 * The worked example for an arrest where the resuscitation is already someone
 * else's job.
 *
 * What is left is everything a pregnancy adds to a standard resuscitation. This
 * example checks no pulse, performs no compressions or uterine displacement,
 * reads no rhythm, and selects no airway, drug, shock, delivery or procedure.
 */
export function maternalArrestDemonstrationStep(
  patient?: MaternalArrestProgress,
): MaternalArrestDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'She is handed on in an arrest that is still happening, with the room ready for a delivery nobody has performed. Nothing was proven and nothing was excluded — not the cause, not the circulation, not what happens next for either of them. This ends the example, not the arrest.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-maternal-arrest-prepared-resuscitation-obstetric-anesthesia-delivery-newborn-and-dignity-response-now',
      narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-maternal-arrest-clock-responsiveness-breathing-pulse-rhythm-pregnancy-and-whole-person',
      narration: narrate(patient) };
  }
  if (patient.modificationsAtTick === null) {
    return { id: 'modifications', focus: 'actions', progress: 0.46, action: 'review-obstetrics-maternal-arrest-supplied-pregnancy-modifications-and-airway-priority-boundary',
      narration: narrate(patient) };
  }
  if (patient.readinessAtTick === null) {
    return { id: 'readiness', focus: 'actions', progress: 0.64, action: 'review-obstetrics-maternal-arrest-reversible-causes-delivery-newborn-and-hemorrhage-readiness-boundary',
      narration: narrate(patient) };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-maternal-arrest-fixed-minute-four-active-resuscitation-and-delivery-readiness-report',
      narration: 'Read the fixed minute-4 report as a checkpoint rather than a verdict. Resuscitation is active, circulation has not returned, and the delivery readiness is in place. No compression, displacement, airway, access, rhythm, drug, shock, delivery or procedure is chosen here, and nothing says how any individual arrest behaves next.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-maternal-arrest-active-arrest-cause-procedure-hemorrhage-newborn-family-and-outcome-risk',
    narration: 'Resuscitation is still active, circulation has not returned, and nothing here establishes a completed delivery, a restored circulation, a newborn condition, a cause, a treatment effect or a decision to stop. Hand off the active arrest, the open causes, the procedures, the hemorrhage risk, the newborn, her family, the staff who have been in this room, and the disposition.' };
}
