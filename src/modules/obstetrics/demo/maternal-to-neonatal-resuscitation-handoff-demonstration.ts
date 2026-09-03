import type { Scenario } from '@anesthesia/scenarios/types';
import type { DemonstrationBeat } from '@anesthesia/demo/demonstration';
import {
  supportsMaternalNeonatalHandoff, type MaternalNeonatalHandoffAction, type MaternalNeonatalHandoffProgress,
} from '../maternal-to-neonatal-resuscitation-handoff';
import { maternalNeonatalHandoffInlinePrompt } from '../tutor/maternal-to-neonatal-resuscitation-handoff-guidance';


/**
 * The narration for a beat is what the tutor says at that state, asked for
 * rather than copied, so this lesson's prose ships once instead of twice.
 * See tests/unit/offline.test.ts for why that matters.
 */
function narrate(patient: MaternalNeonatalHandoffProgress): string {
  const prompt = maternalNeonatalHandoffInlinePrompt('guided', { scenarioVersion: '0.1.0', maternalNeonatalHandoff: patient });
  return prompt ? `${prompt.suggestion} ${prompt.because}` : '';
}

export const MATERNAL_NEONATAL_HANDOFF_DEMONSTRATION_VERSION = '0.1.0';

export function supportsMaternalNeonatalHandoffDemonstration(scenario: Scenario): boolean {
  return scenario.metadata.version === '0.1.0' && supportsMaternalNeonatalHandoff(scenario);
}

export interface MaternalNeonatalHandoffDemonstrationStep {
  readonly id: string; readonly narration: string; readonly focus: DemonstrationBeat['focus'];
  readonly progress: number; readonly action?: MaternalNeonatalHandoffAction; readonly finished?: boolean;
}

/**
 * The worked example for two patients in one room.
 *
 * The failure this refuses is the quiet one: nobody says who owns which
 * patient, and one of them stops being watched. This example examines nobody,
 * resuscitates no newborn, delivers no ventilation, and counsels no family.
 */
export function maternalNeonatalHandoffDemonstrationStep(
  patient?: MaternalNeonatalHandoffProgress,
): MaternalNeonatalHandoffDemonstrationStep {
  if (!patient) {
    return { id: 'preparing', narration: 'Preparing the fictional patient. This example uses the same controls and clock as your practice.', focus: 'none', progress: 0 };
  }
  if (patient.handoffAtTick !== null) {
    return { id: 'finished', focus: 'actions', progress: 1, finished: true,
      narration: 'Two patients are handed on, neither of them finished, with the placental findings and cord gases still to come. Nothing was proven and nothing was excluded — not the newborn’s stability, not her recovery, not why any of this happened. This ends the example, not the care.' };
  }
  if (patient.supportAtTick === null) {
    return { id: 'support', focus: 'actions', progress: 0.08, action: 'activate-obstetrics-maternal-neonatal-handoff-two-patient-team-and-support-ownership',
      narration: narrate(patient) };
  }
  if (patient.contextAtTick === null) {
    return { id: 'context', focus: 'monitor', progress: 0.28, action: 'reconcile-obstetrics-maternal-neonatal-handoff-antenatal-intrapartum-birth-resuscitation-and-whole-family-context',
      narration: narrate(patient) };
  }
  if (patient.safetyAtTick === null) {
    return { id: 'safety', focus: 'monitor', progress: 0.46, action: 'review-obstetrics-maternal-neonatal-handoff-ventilation-priority-response-and-uncertainty-boundaries',
      narration: narrate(patient) };
  }
  if (patient.transferAtTick === null) {
    return { id: 'transfer', focus: 'actions', progress: 0.64, action: 'review-obstetrics-maternal-neonatal-handoff-structured-transfer-readback-and-parallel-readiness',
      narration: narrate(patient) };
  }
  if (patient.reassessmentAtTick === null) {
    return { id: 'reassess', focus: 'monitor', progress: 0.82, action: 'review-obstetrics-maternal-neonatal-handoff-fixed-five-minute-qualified-course-report',
      narration: 'Read the fixed 5-minute report as this course rather than a trajectory. No treatment, ventilation, drug, transport or family counseling is chosen here. It is a contrast rather than a prediction, and it says nothing about how any other newborn behaves after a resuscitation like this one.' };
  }
  return { id: 'handoff', focus: 'actions', progress: 0.92, action: 'handoff-obstetrics-maternal-neonatal-postresuscitation-monitoring-maternal-family-and-outcome-risk',
    narration: 'Nothing here establishes newborn stability, maternal recovery, a placental cause, or any outcome. Hand off the newborn’s respiratory trajectory, glucose, temperature and neurologic state, her own recovery from surgery and anesthesia, the placental findings and cord gases still to come, what the family have been told and by whom, the record, and the follow-up.' };
}
